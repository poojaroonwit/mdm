import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { KongClient } from '@/lib/kong-client'
import { createAuditContext } from '@/lib/audit-context-helper'

async function postHandler(
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

    // Get API key
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    let apiKey: string | undefined

    if (instance.adminApiKey) {
      if (useVault) {
        try {
          const auditContext = createAuditContext(
            request,
            session.user,
            'Kong instance connection test',
          )
          const secret = await secretsManager.getSecret(
            `kong-instances/${instance.id}/admin-api-key`,
            undefined,
            auditContext,
          )
          apiKey = secret?.adminApiKey
        } catch (error) {
          console.warn('Failed to get Kong API key from Vault:', error)
        }
      } else {
        try {
          apiKey = decryptApiKey(instance.adminApiKey) || undefined
        } catch (error) {
          console.warn('Failed to decrypt Kong API key:', error)
        }
      }
    }

    // Test connection
    const kongClient = new KongClient(instance.adminUrl, apiKey)
    const isConnected = await kongClient.testConnection()

    let nodeInfo = null
    if (isConnected) {
      try {
        nodeInfo = await kongClient.getNodeInfo()
      } catch (error) {
        console.warn('Failed to get Kong node info:', error)
      }
    }

    // Update status
    await prisma.kongInstance.update({
      where: { id },
      data: {
        status: isConnected ? 'connected' : 'disconnected',
        lastConnected: isConnected ? new Date() : null,
      },
    })

    return NextResponse.json({
      connected: isConnected,
      nodeInfo,
      message: isConnected
        ? 'Successfully connected to Kong'
        : 'Failed to connect to Kong',
    })
  } catch (error: any) {
    console.error('Error testing Kong connection:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Failed to test Kong connection',
      },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/kong-instances/[id]/test',
)


