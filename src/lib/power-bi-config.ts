import { query } from '@/lib/db'

export type PowerBIIntegrationConfig = {
  id: string
  name: string
  spaceId: string | null
  accessType: string
  config: Record<string, any>
}

function parseConfig(rawConfig: unknown): Record<string, any> {
  if (!rawConfig) return {}

  if (typeof rawConfig === 'string') {
    try {
      return JSON.parse(rawConfig)
    } catch {
      return {}
    }
  }

  return typeof rawConfig === 'object' && rawConfig !== null ? rawConfig as Record<string, any> : {}
}

export async function getPowerBIIntegrationConfig(
  userId: string,
  options: { configId?: string | null; spaceId?: string | null } = {}
): Promise<PowerBIIntegrationConfig | null> {
  const { configId, spaceId } = options
  const params: any[] = [userId]
  const filters = [
    `source = 'power-bi'`,
    `created_by = $1`,
    `deleted_at IS NULL`,
  ]

  if (configId) {
    params.push(configId)
    filters.push(`id = $${params.length}`)
  }

  if (spaceId) {
    params.push(spaceId)
    filters.push(`space_id = $${params.length}`)
  }

  const result = await query(
    `SELECT id, name, space_id, access_type, config
     FROM report_integrations
     WHERE ${filters.join(' AND ')}
     ORDER BY is_active DESC, updated_at DESC, created_at DESC
     LIMIT 1`,
    params
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    name: row.name,
    spaceId: row.space_id || null,
    accessType: row.access_type,
    config: parseConfig(row.config),
  }
}
