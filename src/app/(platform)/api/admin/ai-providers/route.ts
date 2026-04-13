import { requireAdmin } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { encryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      provider: provider.provider,
      name: provider.name,
      description: provider.description,
      website: provider.website,
      icon: provider.icon,
      isSupported: provider.isSupported,
      apiKey: provider.apiKey ? '***' : null, // Mask the API key for security
      baseUrl: provider.baseUrl,
      customHeaders: provider.customHeaders,
      timeout: provider.timeout,
      retryAttempts: provider.retryAttempts,
      status: provider.status,
      isConfigured: provider.isConfigured,
      lastTested: provider.lastTested,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt
    }))

    return NextResponse.json({ providers: formattedProviders })
  } catch (error: any) {
    console.error('Error fetching AI providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI providers', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { 
      provider, 
      name, 
      description, 
      website, 
      icon, 
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null = null

    if (apiKey) {
      if (useVault) {
        // Store in Vault with audit context
        const auditContext = createAuditContext(request, session.user, 'API key creation')
        await secretsManager.storeSecret(
          `ai-providers/${provider}/api-key`,
          { apiKey },
          undefined,
          auditContext
        )
        // Store a reference in database (encrypted or masked)
        encryptedApiKey = 'vault://' + provider
      } else {
        // Use database encryption
        encryptedApiKey = encryptApiKey(apiKey)
      }
    }

    const providerConfig = await prisma.aIProviderConfig.create({
      data: {
        provider,
        name,
        description,
        website,
        icon,
        apiKey: encryptedApiKey,
        baseUrl,
        customHeaders: customHeaders || {},
        timeout: timeout || 30000,
        retryAttempts: retryAttempts || 3,
        status: 'inactive',
        isConfigured: !!apiKey
      }
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  } catch (error: any) {
    console.error('Error creating AI provider:', error)
    return NextResponse.json(
      { error: 'Failed to create AI provider', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { 
      id,
      apiKey, 
      baseUrl, 
      customHeaders, 
      timeout, 
      retryAttempts 
    } = body

    // Get existing provider to know the provider name
    const existingProvider = await prisma.aIProviderConfig.findUnique({
      where: { id },
      select: { provider: true }
    })

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null | undefined = undefined

    if (apiKey !== undefined) {
      if (apiKey) {
        if (useVault) {
          // Store in Vault with audit context
          const auditContext = createAuditContext(request, session.user, 'API key update')
          await secretsManager.storeSecret(
            `ai-providers/${existingProvider.provider}/api-key`,
            { apiKey },
            undefined,
            auditContext
          )
          // Store reference in database
          encryptedApiKey = 'vault://' + existingProvider.provider
        } else {
          // Use database encryption
          encryptedApiKey = encryptApiKey(apiKey)
        }
      } else {
        // Delete from Vault if using Vault
        if (useVault) {
          try {
            const auditContext = createAuditContext(request, session.user, 'API key deletion')
            await secretsManager.deleteSecret(
              `ai-providers/${existingProvider.provider}/api-key`,
              auditContext
            )
          } catch (error) {
            // Ignore if secret doesn't exist
          }
        }
        encryptedApiKey = null
      }
    }

    const updateData: any = {
      baseUrl,
      customHeaders: customHeaders || {},
      timeout: timeout || 30000,
      retryAttempts: retryAttempts || 3,
    }

    if (encryptedApiKey !== undefined) {
      updateData.apiKey = encryptedApiKey
      updateData.isConfigured = !!apiKey
      updateData.status = apiKey ? 'active' : 'inactive'
    }

    const providerConfig = await prisma.aIProviderConfig.update({
      where: { id },
      data: updateData
    })

    const formattedProvider = {
      id: providerConfig.id,
      provider: providerConfig.provider,
      name: providerConfig.name,
      description: providerConfig.description,
      website: providerConfig.website,
      icon: providerConfig.icon,
      isSupported: providerConfig.isSupported,
      apiKey: providerConfig.apiKey ? '***' : null,
      baseUrl: providerConfig.baseUrl,
      customHeaders: providerConfig.customHeaders,
      timeout: providerConfig.timeout,
      retryAttempts: providerConfig.retryAttempts,
      status: providerConfig.status,
      isConfigured: providerConfig.isConfigured,
      lastTested: providerConfig.lastTested,
      createdAt: providerConfig.createdAt,
      updatedAt: providerConfig.updatedAt
    }

    return NextResponse.json({ provider: formattedProvider })
  } catch (error: any) {
    console.error('Error updating AI provider:', error)
    return NextResponse.json(
      { error: 'Failed to update AI provider', details: error.message },
      { status: 500 }
    )
  }
}
