import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { encryptApiKey } from '@/lib/encryption'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    const googleProvider = await (prisma as any).oAuthProvider.findFirst({
      where: { providerName: 'google' }
    })
    const azureProvider = await (prisma as any).oAuthProvider.findFirst({
      where: { providerName: 'azure-ad' }
    })

    return NextResponse.json({
      config: {
        googleEnabled: googleProvider?.isEnabled ?? false,
        azureEnabled: azureProvider?.isEnabled ?? false,
        googleClientId: googleProvider?.clientId || '',
        googleClientSecret: googleProvider?.clientSecret ? '••••••••' : '',
        azureTenantId: (azureProvider?.platformConfig as any)?.tenantId || '',
        azureClientId: azureProvider?.clientId || '',
        azureClientSecret: azureProvider?.clientSecret ? '••••••••' : '',
      }
    })
  } catch (error) {
    console.error('Error fetching SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function putHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { config } = body as {
      config: {
        googleEnabled: boolean
        azureEnabled: boolean
        googleClientId: string
        googleClientSecret: string
        azureTenantId: string
        azureClientId: string
        azureClientSecret: string
      }
    }

    if (!config) {
      return NextResponse.json({ error: 'Config object is required' }, { status: 400 })
    }

    // --- Google OAuth ---
    if (config.googleClientId) {
      const existing = await (prisma as any).oAuthProvider.findFirst({
        where: { providerName: 'google' }
      })

      const secretRaw = config.googleClientSecret && config.googleClientSecret !== '••••••••'
        ? encryptApiKey(config.googleClientSecret)
        : (existing?.clientSecret || '')

      const googleData = {
        providerName: 'google',
        displayName: 'Google',
        isEnabled: config.googleEnabled,
        clientId: config.googleClientId,
        clientSecret: secretRaw,
        scopes: ['openid', 'email', 'profile'],
        allowedDomains: [],
        displayOrder: 1,
      }

      if (existing) {
        await (prisma as any).oAuthProvider.update({
          where: { id: existing.id },
          data: { ...googleData, updatedAt: new Date() },
        })
      } else {
        await (prisma as any).oAuthProvider.create({ data: googleData })
      }
    }

    // --- Azure AD SSO ---
    if (config.azureClientId) {
      const existing = await (prisma as any).oAuthProvider.findFirst({
        where: { providerName: 'azure-ad' }
      })

      const secretRaw = config.azureClientSecret && config.azureClientSecret !== '••••••••'
        ? encryptApiKey(config.azureClientSecret)
        : (existing?.clientSecret || '')

      const tenantId = config.azureTenantId || ''
      const azureData = {
        providerName: 'azure-ad',
        displayName: 'Microsoft Azure',
        isEnabled: config.azureEnabled,
        clientId: config.azureClientId,
        clientSecret: secretRaw,
        authorizationUrl: tenantId
          ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
          : null,
        tokenUrl: tenantId
          ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
          : null,
        scopes: ['openid', 'email', 'profile'],
        allowedDomains: [],
        displayOrder: 2,
        platformConfig: tenantId ? { tenantId } : {},
      }

      if (existing) {
        await (prisma as any).oAuthProvider.update({
          where: { id: existing.id },
          data: { ...azureData, updatedAt: new Date() },
        })
      } else {
        await (prisma as any).oAuthProvider.create({ data: azureData })
      }
    }

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SSOConfig',
      entityId: 'system',
      newValue: { googleEnabled: config.googleEnabled, azureEnabled: config.azureEnabled },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, message: 'SSO configuration saved successfully' })
  } catch (error) {
    console.error('Error updating SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/sso-config')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/sso-config')
