import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // New way: Fetch from platform_integrations
    const { rows: integrationRows } = await query(
      "SELECT type, config, is_enabled FROM platform_integrations WHERE type IN ('google-auth', 'azure-ad') AND deleted_at IS NULL"
    )

    const config: Record<string, any> = {
      googleEnabled: false,
      azureEnabled: false,
      googleClientId: '',
      googleClientSecret: '',
      azureTenantId: '',
      azureClientId: '',
      azureClientSecret: ''
    }

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    // Helper to process secret retrieval
    const processSecret = async (key: string, value: any) => {
      if (useVault && typeof value === 'string' && value.startsWith('vault://')) {
        try {
          const vaultPath = value.replace('vault://', '')
          // For integration secrets, we might store them under sso/ still or integration/
          // To keep compatible with previous logic, let's assume 'sso/' prefix used in PUT
          const secret = await secretsManager.getSecret(`sso/${key}`)
          if (secret) {
            return secret[key] || secret.value || ''
          }
        } catch (error) {
          console.warn(`Failed to retrieve ${key} from Vault:`, error)
        }
        return value
      } else if (typeof value === 'string' && value.length > 0) {
        const decrypted = decryptApiKey(value)
        return decrypted && decrypted !== value ? decrypted : value
      }
      return value
    }

    // Process integration rows
    for (const row of integrationRows) {
      if (row.type === 'google-auth') {
        config.googleEnabled = row.is_enabled
        if (row.config) {
          config.googleClientId = row.config.clientId || ''
          config.googleClientSecret = await processSecret('googleClientSecret', row.config.clientSecret || '')
        }
      } else if (row.type === 'azure-ad') {
        config.azureEnabled = row.is_enabled
        if (row.config) {
          config.azureTenantId = row.config.tenantId || ''
          config.azureClientId = row.config.clientId || ''
          config.azureClientSecret = await processSecret('azureClientSecret', row.config.clientSecret || '')
        }
      }
    }

    return NextResponse.json({ config })
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { config } = body as { config?: Record<string, any> }

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'SSO configuration object is required' },
        { status: 400 }
      )
    }

    // Resolve final values with fallbacks
    const googleEnabled = config.googleEnabled !== undefined ? config.googleEnabled : config.google_enabled
    const azureEnabled = config.azureEnabled !== undefined ? config.azureEnabled : config.azure_enabled
    const googleClientId = config.googleClientId || config.google_client_id
    const googleClientSecret = config.googleClientSecret || config.google_client_secret
    const azureTenantId = config.azureTenantId || config.azure_tenant_id
    const azureClientId = config.azureClientId || config.azure_client_id
    const azureClientSecret = config.azureClientSecret || config.azure_client_secret

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    const auditContext = createAuditContext(request, session.user, 'SSO configuration update')

    // Helper to process secret storage
    const processSecretStorage = async (key: string, value: any) => {
      if (value && String(value).trim() !== '') {
        if (useVault) {
          try {
            await secretsManager.storeSecret(
              `sso/${key}`,
              { value: String(value) },
              undefined,
              auditContext
            )
            return `vault://${key}`
          } catch (error) {
            console.error(`Failed to store ${key} in Vault:`, error)
            return encryptApiKey(String(value))
          }
        } else {
          return encryptApiKey(String(value))
        }
      }
      return value
    }

    // Prepare configurations
    const gSecret = await processSecretStorage('googleClientSecret', googleClientSecret)
    const aSecret = await processSecretStorage('azureClientSecret', azureClientSecret)

    const googleConfig = {
      clientId: googleClientId,
      clientSecret: gSecret
    }

    const azureConfig = {
      tenantId: azureTenantId,
      clientId: azureClientId,
      clientSecret: aSecret
    }

    // Re-implementation with Check-then-Upsert logic since `type` might not be unique in schema (it's not marked @unique)
    const upsertIntegration = async (type: string, conf: any, enabled: boolean) => {
      const { rows } = await query("SELECT id FROM platform_integrations WHERE type = $1 AND deleted_at IS NULL LIMIT 1", [type])
      if (rows.length > 0) {
        await query(
          "UPDATE platform_integrations SET config = $1, is_enabled = $2, updated_at = NOW() WHERE id = $3",
          [JSON.stringify(conf), enabled, rows[0].id]
        )
      } else {
        await query(
          "INSERT INTO platform_integrations (type, config, is_enabled) VALUES ($1, $2, $3)",
          [type, JSON.stringify(conf), enabled]
        )
      }
    }

    await upsertIntegration('google-auth', googleConfig, googleEnabled || false)
    await upsertIntegration('azure-ad', azureConfig, azureEnabled || false)

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SSOConfiguration',
      entityId: 'system',
      oldValue: { action: 'updated sso config via platform_integrations' }, // Simplified for brevity
      newValue: { googleEnabled: googleEnabled, azureEnabled: azureEnabled },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: 'SSO configuration saved successfully'
    })
  } catch (error) {
    console.error('Error updating SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/sso-config')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/sso-config')

