import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  providerName: z.string().min(1),
  displayName: z.string().min(1),
  isEnabled: z.boolean().default(true),
  clientId: z.string().min(1),
  clientSecret: z.string().optional(),
  scopes: z.array(z.string()).default([]),
  allowedDomains: z.array(z.string()).default([]),
  displayOrder: z.number().default(0),
})

const ssoConfigSchema = z.object({
  providers: z.array(providerSchema)
})

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    
    const providers = await (prisma as any).oAuthProvider.findMany({
      orderBy: { displayOrder: 'asc' }
    })

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    const processedProviders = await Promise.all(providers.map(async (p: any) => {
      let clientSecret = p.clientSecret
      
      if (useVault && clientSecret?.startsWith('vault://')) {
        try {
          const secret = await secretsManager.getSecret(`sso/${p.providerName}`)
          clientSecret = secret?.value || ''
        } catch (e) {
          console.warn(`Failed to retrieve secret for ${p.providerName}`)
        }
      } else if (clientSecret) {
        const decrypted = decryptApiKey(clientSecret)
        clientSecret = decrypted && decrypted !== clientSecret ? decrypted : clientSecret
      }

      return {
        ...p,
        clientSecret: clientSecret ? '••••••••' : '' // Mask for GET
      }
    }))

    return NextResponse.json({ providers: processedProviders })
  } catch (error) {
    console.error('Error fetching identity providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function putHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const bodyValidation = await validateBody(request, ssoConfigSchema)
    if (!bodyValidation.success) return bodyValidation.response

    const { providers } = bodyValidation.data
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const auditContext = createAuditContext(request, session.user, 'SSO configuration update')

    const oldProviders = await (prisma as any).oAuthProvider.findMany()

    for (const provider of providers) {
      let clientSecret = provider.clientSecret
      
      if (clientSecret && clientSecret !== '••••••••') {
        if (useVault) {
          await secretsManager.storeSecret(
            `sso/${provider.providerName}`,
            { value: clientSecret },
            undefined,
            auditContext
          )
          clientSecret = `vault://${provider.providerName}`
        } else {
          clientSecret = encryptApiKey(clientSecret)
        }
      } else {
        // Keep existing secret if not updated
        const existing = oldProviders.find((p: any) => p.id === provider.id || p.providerName === provider.providerName)
        clientSecret = (existing as any)?.clientSecret || ''
      }

      await (prisma as any).oAuthProvider.upsert({
        where: { id: provider.id || '00000000-0000-0000-0000-000000000000' },
        update: {
          ...provider,
          clientSecret: clientSecret || '',
          updatedAt: new Date()
        },
        create: {
          ...provider,
          clientSecret: clientSecret || ''
        }
      })
    }

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'IdentityProviders',
      entityId: 'system',
      oldValue: oldProviders,
      newValue: providers,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, message: 'Identity providers updated successfully' })
  } catch (error) {
    console.error('Error updating identity providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/sso-config')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/sso-config')

