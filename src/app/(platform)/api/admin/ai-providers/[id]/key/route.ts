import { requireAdmin } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { decryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'
import { db as prisma } from '@/lib/db'

/**
 * GET /api/admin/ai-providers/[id]/key
 * Get decrypted API key for a provider (for 2-way sync with Chat UI)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { id } = await params

    const provider = await prisma.aIProviderConfig.findUnique({
      where: { id },
      select: { 
        id: true,
        provider: true,
        apiKey: true,
        isConfigured: true
      }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    if (!provider.isConfigured || !provider.apiKey) {
      return NextResponse.json({ apiKey: null })
    }

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const auditContext = createAuditContext(request, session.user, 'API key retrieval for Chat UI sync')

    let decryptedApiKey: string | null = null

    if (useVault && provider.apiKey.startsWith('vault://')) {
      // Retrieve from Vault
      try {
        decryptedApiKey = await secretsManager.getApiKey(provider.provider, auditContext)
      } catch (error) {
        console.error('Error retrieving API key from Vault:', error)
        return NextResponse.json({ error: 'Failed to retrieve API key from Vault' }, { status: 500 })
      }
    } else {
      // Decrypt from database
      decryptedApiKey = decryptApiKey(provider.apiKey)
    }

    return NextResponse.json({ apiKey: decryptedApiKey })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}
