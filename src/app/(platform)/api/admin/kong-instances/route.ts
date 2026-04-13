import { requireAdmin, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { KongClient } from '@/lib/kong-client'
import { createAuditContext } from '@/lib/audit-context-helper'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const instances = await prisma.kongInstance.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    const instancesWithDecryptedKeys = await Promise.all(
      instances.map(async (instance) => {
        let decryptedApiKey: string | null = null

        if (instance.adminApiKey) {
          if (useVault) {
            try {
              const auditContext = createAuditContext(
                request,
                session.user,
                'Kong instance API key retrieval',
              )
              const secret = await secretsManager.getSecret(
                `kong-instances/${instance.id}/admin-api-key`,
                undefined,
                auditContext,
              )
              decryptedApiKey = secret?.adminApiKey || null
            } catch (error) {
              console.warn(
                `Failed to get Kong API key from Vault for instance ${instance.id}:`,
                error,
              )
            }
          } else {
            try {
              decryptedApiKey = decryptApiKey(instance.adminApiKey)
            } catch (error) {
              console.warn(
                `Failed to decrypt Kong API key for instance ${instance.id}:`,
                error,
              )
            }
          }
        }

        return {
          id: instance.id,
          name: instance.name,
          adminUrl: instance.adminUrl,
          adminApiKey: decryptedApiKey,
          description: instance.description,
          isActive: instance.isActive,
          status: instance.status,
          lastConnected: instance.lastConnected,
          metadata: instance.metadata,
          createdAt: instance.createdAt,
          updatedAt: instance.updatedAt,
        }
      }),
    )

    return NextResponse.json({ instances: instancesWithDecryptedKeys })
  } catch (error: any) {
    console.error('Error fetching Kong instances:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Kong instances' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/kong-instances',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, adminUrl, adminApiKey, description, metadata, isActive } =
      body

    if (!name || !adminUrl) {
      return NextResponse.json(
        { error: 'name and adminUrl are required' },
        { status: 400 },
      )
    }

    // Validate URL format
    try {
      new URL(adminUrl)
    } catch {
      return NextResponse.json(
        { error: 'adminUrl must be a valid URL' },
        { status: 400 },
      )
    }

    // Store API key securely
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let storedApiKey: string | null = null

    if (adminApiKey) {
      if (useVault) {
        // Will store after instance creation
        storedApiKey = 'vault://kong-instances/temp/admin-api-key'
      } else {
        storedApiKey = encryptApiKey(adminApiKey)
      }
    }

    // Create instance
    const instance = await prisma.kongInstance.create({
      data: {
        name,
        adminUrl,
        adminApiKey: storedApiKey,
        description: description || null,
        metadata: metadata || {},
        isActive: isActive !== undefined ? isActive : true,
        status: 'disconnected',
      },
    })

    // Store API key in Vault if using Vault
    if (useVault && adminApiKey) {
      try {
        const auditContext = createAuditContext(
          request,
          session.user,
          'Kong instance creation',
        )
        await secretsManager.storeSecret(
          `kong-instances/${instance.id}/admin-api-key`,
          { adminApiKey },
          undefined,
          auditContext,
        )
        // Update with correct Vault path
        await prisma.kongInstance.update({
          where: { id: instance.id },
          data: {
            adminApiKey: `vault://kong-instances/${instance.id}/admin-api-key`,
          },
        })
      } catch (error) {
        console.error('Failed to store Kong API key in Vault:', error)
        // Continue even if Vault storage fails
      }
    }

    // Test connection
    try {
      const kongClient = new KongClient(instance.adminUrl, adminApiKey || undefined)
      const isConnected = await kongClient.testConnection()

      await prisma.kongInstance.update({
        where: { id: instance.id },
        data: {
          status: isConnected ? 'connected' : 'disconnected',
          lastConnected: isConnected ? new Date() : null,
        },
      })
    } catch (error) {
      console.warn('Failed to test Kong connection:', error)
      // Don't fail creation if test fails
    }

    return NextResponse.json({ instance })
  } catch (error: any) {
    console.error('Error creating Kong instance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Kong instance' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/kong-instances',
)


