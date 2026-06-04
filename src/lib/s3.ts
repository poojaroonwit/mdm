import { S3Client, GetObjectCommand, type S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let s3ClientInstance: S3Client | null = null
let cachedConfigTime = 0

export interface ResolvedS3Config extends S3ClientConfig {
  bucket: string
  endpoint?: string
  forcePathStyle?: boolean
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
}

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return undefined
}

function readBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
  return fallback
}

export function normalizeS3Endpoint(endpoint: string | undefined) {
  const trimmed = endpoint?.trim()
  if (!trimmed) return undefined
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return trimmed

  const lower = trimmed.toLowerCase()
  const protocol =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('minio') ||
    lower.endsWith(':9000')
      ? 'http'
      : 'https'

  return `${protocol}://${trimmed}`
}

function buildS3Config(input: {
  endpoint?: string
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: unknown
}): ResolvedS3Config | null {
  if (!input.accessKeyId || !input.secretAccessKey) {
    return null
  }

  const endpoint = normalizeS3Endpoint(input.endpoint)
  const forcePathStyle = readBoolean(input.forcePathStyle, Boolean(endpoint))

  return {
    region: input.region || 'us-east-1',
    endpoint,
    forcePathStyle,
    bucket: input.bucket || '',
    credentials: {
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
    },
  }
}

function buildS3ConfigFromStoredConfig(config: any): ResolvedS3Config | null {
  return buildS3Config({
    endpoint: config?.endpoint || config?.url,
    region: config?.region,
    bucket: config?.bucket || config?.bucketName || config?.bucket_name,
    accessKeyId: config?.accessKeyId || config?.access_key_id || config?.access_key,
    secretAccessKey: config?.secretAccessKey || config?.secret_access_key || config?.secret_key,
    forcePathStyle: config?.forcePathStyle ?? config?.force_path_style,
  })
}

function buildS3ConfigFromEnv(): ResolvedS3Config | null {
  const endpoint = firstEnv(
    'S3_ENDPOINT',
    'S3_ENDPOINT_URL',
    'AWS_ENDPOINT_URL_S3',
    'AWS_S3_ENDPOINT',
    'RAILWAY_S3_ENDPOINT',
    'RAILWAY_BUCKET_ENDPOINT',
    'MINIO_ENDPOINT'
  )

  return buildS3Config({
    endpoint,
    region: firstEnv('S3_REGION', 'AWS_REGION', 'AWS_DEFAULT_REGION', 'RAILWAY_S3_REGION', 'MINIO_REGION'),
    bucket: firstEnv(
      'S3_BUCKET',
      'S3_BUCKET_NAME',
      'AWS_S3_BUCKET',
      'AWS_BUCKET_NAME',
      'BUCKET_NAME',
      'RAILWAY_S3_BUCKET',
      'RAILWAY_BUCKET_NAME',
      'MINIO_UPLOADS_BUCKET',
      'MINIO_BUCKET'
    ),
    accessKeyId: firstEnv(
      'S3_ACCESS_KEY_ID',
      'S3_ACCESS_KEY',
      'AWS_ACCESS_KEY_ID',
      'RAILWAY_S3_ACCESS_KEY_ID',
      'RAILWAY_S3_ACCESS_KEY',
      'MINIO_ACCESS_KEY'
    ),
    secretAccessKey: firstEnv(
      'S3_SECRET_ACCESS_KEY',
      'S3_SECRET_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'RAILWAY_S3_SECRET_ACCESS_KEY',
      'RAILWAY_S3_SECRET_KEY',
      'MINIO_SECRET_KEY'
    ),
    forcePathStyle: firstEnv('S3_FORCE_PATH_STYLE', 'AWS_S3_FORCE_PATH_STYLE', 'RAILWAY_S3_FORCE_PATH_STYLE', 'MINIO_FORCE_PATH_STYLE'),
  })
}

export async function getS3Config(): Promise<ResolvedS3Config | null> {
  const envConfig = buildS3ConfigFromEnv()
  if (envConfig) {
    return envConfig
  }

  try {
    const { query } = await import('@/lib/db')
    const integrationSql = `
      SELECT config, is_enabled
      FROM platform_integrations
      WHERE type = 'aws-s3'
        AND deleted_at IS NULL
        AND is_enabled = true
      LIMIT 1
    `
    const { rows } = await query(integrationSql, [], 5000)

    if (rows && rows.length > 0) {
      const config = buildS3ConfigFromStoredConfig(rows[0].config)
      if (config) return config
    }

    const storageSql = `
      SELECT config
      FROM storage_connections
      WHERE type = 's3'
        AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `
    const storageResult = await query(storageSql, [], 5000)
    if (storageResult.rows.length > 0) {
      const config = buildS3ConfigFromStoredConfig(storageResult.rows[0].config)
      if (config) return config
    }
  } catch {
    // Ignore DB errors and fall back to environment variables.
  }

  return null
}

export async function getS3Client(): Promise<S3Client> {
  const now = Date.now()
  if (!s3ClientInstance || (now - cachedConfigTime > CONFIG_CACHE_TTL)) {
    const config = await getS3Config()
    if (!config) {
      throw new Error('S3-compatible storage is not configured')
    }
    s3ClientInstance = new S3Client(config)
    cachedConfigTime = now
  }
  return s3ClientInstance
}

export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 300
): Promise<string> {
  try {
    const client = await getS3Client()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    return await getSignedUrl(client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

export async function validateS3Config(): Promise<boolean> {
  const config = await getS3Config()
  return !!(config?.credentials.accessKeyId && config?.credentials.secretAccessKey)
}
