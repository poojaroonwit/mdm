import { query } from './db'
import { getSecretsManager } from './secrets-manager'
import { decryptApiKey } from './encryption'
import { ManageEngineServiceDeskService } from './manageengine-servicedesk'

export interface ServiceDeskIntegrationConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  technicianKey?: string
  isActive: boolean
  createdAt?: Date | string | null
  updatedAt?: Date | string | null
}

function parseConfig(config: unknown): Record<string, unknown> {
  if (!config) return {}
  if (typeof config === 'string') {
    try {
      return JSON.parse(config)
    } catch {
      return {}
    }
  }
  return typeof config === 'object' ? config as Record<string, unknown> : {}
}

async function resolveCredential(value: unknown, integrationId: string, key: 'apiKey' | 'technicianKey') {
  if (typeof value !== 'string' || !value) return null

  if (value.startsWith('vault://')) {
    const vaultPath = value.replace('vault://', '')
    const connectionId = vaultPath.split('/')[0] || integrationId
    const secretsManager = getSecretsManager()
    const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
    return typeof creds?.[key] === 'string' ? creds[key] : null
  }

  return decryptApiKey(value)
}

/**
 * Get normalized ServiceDesk configuration.
 *
 * ServiceDesk is configured through platform_integrations.config. Older code
 * queried external_connections.api_url, but the current schema stores external
 * DB connections there and has no API URL columns.
 */
export async function getServiceDeskConfig(): Promise<ServiceDeskIntegrationConfig | null> {
  const { rows } = await query(
    `SELECT id, name, status, is_enabled, config, created_at, updated_at
     FROM public.platform_integrations
     WHERE type = 'servicedesk'
       AND deleted_at IS NULL
     ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
     LIMIT 1`,
    []
  )

  if (rows.length === 0) return null

  const row = rows[0]
  const config = parseConfig(row.config)
  const baseUrl = typeof config.baseUrl === 'string'
    ? config.baseUrl
    : typeof config.apiUrl === 'string'
      ? config.apiUrl
      : ''
  const apiKey = await resolveCredential(config.apiKey, row.id, 'apiKey')
  const technicianKey = await resolveCredential(config.technicianKey, row.id, 'technicianKey')

  if (!baseUrl || !apiKey) return null

  return {
    id: row.id,
    name: row.name,
    baseUrl,
    apiKey,
    technicianKey: technicianKey || undefined,
    isActive: row.is_enabled !== false && row.status !== 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Get ServiceDesk service instance for a space.
 */
export async function getServiceDeskService(_spaceId: string): Promise<ManageEngineServiceDeskService | null> {
  try {
    const config = await getServiceDeskConfig()

    if (!config || !config.isActive) {
      return null
    }

    return new ManageEngineServiceDeskService({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      technicianKey: config.technicianKey,
    })
  } catch (error) {
    console.error('Error getting ServiceDesk service:', error)
    return null
  }
}
