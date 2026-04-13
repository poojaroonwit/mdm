import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { KongClient } from '@/lib/kong-client'
import { createAuditContext } from '@/lib/audit-context-helper'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const instance = await prisma.kongInstance.findUnique({
      where: { id },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'Kong instance not found' },
        { status: 404 },
      )
    }

    // Decrypt API key
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
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
          console.warn('Failed to get Kong API key from Vault:', error)
        }
      } else {
        try {
          decryptedApiKey = decryptApiKey(instance.adminApiKey)
        } catch (error) {
          console.warn('Failed to decrypt Kong API key:', error)
        }
      }
    }

    return NextResponse.json({
      ...instance,
      adminApiKey: decryptedApiKey,
    })
  } catch (error) {
    console.error('Error fetching Kong instance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Kong instance' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/kong-instances/[id]',
)

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, adminUrl, adminApiKey, description, metadata, isActive } =
      body

    const instance = await prisma.kongInstance.findUnique({
      where: { id },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'Kong instance not found' },
        { status: 404 },
      )
    }

    // Validate URL if provided
    if (adminUrl) {
      try {
        new URL(adminUrl)
      } catch {
        return NextResponse.json(
          { error: 'adminUrl must be a valid URL' },
          { status: 400 },
        )
      }
    }

    // Handle API key update
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    let storedApiKey = instance.adminApiKey

    if (adminApiKey !== undefined) {
      if (adminApiKey === null || adminApiKey === '') {
        // Remove API key
        if (useVault) {
          try {
            const deleteAuditContext = createAuditContext(
              request,
              session.user,
              'Kong instance API key deletion',
            )
            await secretsManager.deleteSecret(
              `kong-instances/${instance.id}/admin-api-key`,
              deleteAuditContext,
            )
          } catch (error) {
            console.warn('Failed to delete Kong API key from Vault:', error)
          }
        }
        storedApiKey = null
      } else {
        // Update API key
        if (useVault) {
          try {
            const updateAuditContext = createAuditContext(
              request,
              session.user,
              'Kong instance API key update',
            )
            await secretsManager.storeSecret(
              `kong-instances/${instance.id}/admin-api-key`,
              { adminApiKey },
              undefined,
              updateAuditContext,
            )
            storedApiKey = `vault://kong-instances/${instance.id}/admin-api-key`
          } catch (error) {
            console.error('Failed to store Kong API key in Vault:', error)
            throw error
          }
        } else {
          storedApiKey = encryptApiKey(adminApiKey)
        }
      }
    }

    // Update instance
    const updatedInstance = await prisma.kongInstance.update({
      where: { id },
      data: {
        name: name !== undefined ? name : instance.name,
        adminUrl: adminUrl !== undefined ? adminUrl : instance.adminUrl,
        adminApiKey: storedApiKey,
        description:
          description !== undefined ? description : instance.description,
        metadata: metadata !== undefined ? metadata : instance.metadata,
        isActive: isActive !== undefined ? isActive : instance.isActive,
      },
    })

    // Test connection if URL or API key changed
    if (adminUrl || adminApiKey !== undefined) {
      try {
        const apiKeyToTest =
          adminApiKey !== undefined
            ? adminApiKey || undefined
            : instance.adminApiKey
              ? useVault
                ? (
                    await secretsManager.getSecret(
                      `kong-instances/${instance.id}/admin-api-key`,
                      undefined,
                      createAuditContext(
                        request,
                        session.user,
                        'Kong instance connection test',
                      ),
                    )
                  )?.adminApiKey
                : decryptApiKey(instance.adminApiKey)
              : undefined

        const kongClient = new KongClient(
          updatedInstance.adminUrl,
          apiKeyToTest || undefined,
        )
        const isConnected = await kongClient.testConnection()

        await prisma.kongInstance.update({
          where: { id },
          data: {
            status: isConnected ? 'connected' : 'disconnected',
            lastConnected: isConnected ? new Date() : null,
          },
        })
      } catch (error) {
        console.warn('Failed to test Kong connection:', error)
      }
    }

    return NextResponse.json({ instance: updatedInstance })
  } catch (error: any) {
    console.error('Error updating Kong instance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Kong instance' },
      { status: 500 },
    )
  }
}

export const PUT = withErrorHandling(
  putHandler,
  'PUT /api/admin/kong-instances/[id]',
)

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const instance = await prisma.kongInstance.findUnique({
      where: { id },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'Kong instance not found' },
        { status: 404 },
      )
    }

    // Clean up Vault secrets if using Vault
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    if (useVault && instance.adminApiKey) {
      try {
        const deleteAuditContext = createAuditContext(
          request,
          session.user,
          'Kong instance deletion',
        )
        await secretsManager.deleteSecret(
          `kong-instances/${instance.id}/admin-api-key`,
          deleteAuditContext,
        )
      } catch (error) {
        console.warn('Failed to cleanup Vault secrets:', error)
      }
    }

    await prisma.kongInstance.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Kong instance:', error)
    return NextResponse.json(
      { error: 'Failed to delete Kong instance' },
      { status: 500 },
    )
  }
}

export const DELETE = withErrorHandling(
  deleteHandler,
  'DELETE /api/admin/kong-instances/[id]',
)


