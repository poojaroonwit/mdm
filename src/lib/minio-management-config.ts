import { query } from '@/lib/db'

export interface ResolvedMinIOManagementConfig {
  endPoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
  region: string
}

function pickFirstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  return values.find((value) => value !== undefined && value !== null)
}

function normalizePort(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function normalizeBool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function getResolvedMinIOManagementConfig(
  instanceId: string
): Promise<ResolvedMinIOManagementConfig> {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'minio-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    throw new Error('MinIO configuration not found')
  }

  const row = result.rows[0] as {
    management_config?: Record<string, unknown>
    credentials?: Record<string, unknown>
    endpoints?: Array<{ url?: string; port?: number | string }>
  }

  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpointInfo = row.endpoints?.[0]

  const rawEndpoint = pickFirstDefined(
    config.endpoint as string | undefined,
    credentials.endpoint as string | undefined,
    endpointInfo?.url
  )

  if (!rawEndpoint) {
    throw new Error('MinIO endpoint is not configured')
  }

  let endpointUrl: URL
  try {
    endpointUrl = new URL(rawEndpoint.startsWith('http') ? rawEndpoint : `http://${rawEndpoint}`)
  } catch {
    endpointUrl = new URL(`http://${rawEndpoint}`)
  }

  const explicitUseSSL = pickFirstDefined(
    normalizeBool(config.use_ssl),
    normalizeBool(credentials.use_ssl),
    normalizeBool(config.useSSL),
    normalizeBool(credentials.useSSL)
  )

  const useSSL = explicitUseSSL ?? endpointUrl.protocol === 'https:'
  const port = pickFirstDefined(
    normalizePort(config.port),
    normalizePort(credentials.port),
    normalizePort(endpointInfo?.port),
    normalizePort(endpointUrl.port),
    useSSL ? 443 : 9000
  )!

  const accessKey = pickFirstDefined(
    config.access_key as string | undefined,
    credentials.access_key as string | undefined,
    config.accessKey as string | undefined,
    credentials.accessKey as string | undefined
  )

  const secretKey = pickFirstDefined(
    config.secret_key as string | undefined,
    credentials.secret_key as string | undefined,
    config.secretKey as string | undefined,
    credentials.secretKey as string | undefined
  )

  if (!accessKey || !secretKey) {
    throw new Error('MinIO credentials are incomplete')
  }

  return {
    endPoint: endpointUrl.hostname,
    port,
    useSSL,
    accessKey,
    secretKey,
    region: pickFirstDefined(
      config.region as string | undefined,
      credentials.region as string | undefined,
      'us-east-1'
    )!,
  }
}
