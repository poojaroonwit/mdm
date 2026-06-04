import { query } from './db'
import { getSecretsManager } from './secrets-manager'
import { decryptApiKey } from './encryption'
import { ManageEngineServiceDeskService, ManageEngineServiceDeskConfig } from './manageengine-servicedesk'

/**
 * Get ServiceDesk service instance for a space
 */
export async function getServiceDeskService(spaceId: string): Promise<ManageEngineServiceDeskService | null> {
  try {
    // Get configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_apikey_value
       FROM public.external_connections 
       WHERE space_id::text = $1
         AND connection_type = 'api'
         AND name LIKE '%ServiceDesk%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [spaceId]
    )

    if (configRows.length === 0) {
      return null
    }

    const config = configRows[0]
    
    // Get API key from Vault or decrypt
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let apiKey: string | null = null
    let technicianKey: string | null = null

    if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
      const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
      const connectionId = vaultPath.split('/')[0]
      const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
      apiKey = creds?.apiKey || null
      technicianKey = creds?.technicianKey || null
    } else {
      apiKey = decryptApiKey(config.api_auth_apikey_value)
    }

    if (!apiKey) {
      return null
    }

    // Create and return service instance
    return new ManageEngineServiceDeskService({
      baseUrl: config.api_url,
      apiKey,
      technicianKey: technicianKey || undefined
    })
  } catch (error) {
    console.error('Error getting ServiceDesk service:', error)
    return null
  }
}

