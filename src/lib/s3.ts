import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const CONFIG_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let s3ClientInstance: S3Client | null = null
let cachedConfigTime = 0

export async function getS3Config() {
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
      const config = rows[0].config as any
      if (config.accessKeyId && config.secretAccessKey) {
        return {
          region: config.region || 'us-east-1',
          endpoint: config.endpoint || undefined,
          forcePathStyle: config.forcePathStyle === true || config.forcePathStyle === 'true',
          bucket: config.bucket || '',
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        }
      }
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
      const config = storageResult.rows[0].config as any
      if (config?.access_key_id && config?.secret_access_key) {
        return {
          region: config.region || 'us-east-1',
          endpoint: config.endpoint || undefined,
          forcePathStyle: config.forcePathStyle === true || config.forcePathStyle === 'true',
          bucket: config.bucket || '',
          credentials: {
            accessKeyId: config.access_key_id,
            secretAccessKey: config.secret_access_key,
          },
        }
      }
    }
  } catch (error) {
    // Ignore DB errors and let callers handle missing config
  }

  return null
}

export async function getS3Client(): Promise<S3Client> {
  const now = Date.now()
  if (!s3ClientInstance || (now - cachedConfigTime > CONFIG_CACHE_TTL)) {
    const config = await getS3Config()
    if (!config) {
      throw new Error('AWS S3 is not configured in the UI')
    }
    s3ClientInstance = new S3Client(config)
    cachedConfigTime = now
  }
  return s3ClientInstance
}

// Generate presigned URL for downloading files
export async function generatePresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<string> {
  try {
    const client = await getS3Client()
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const presignedUrl = await getSignedUrl(client, command, { expiresIn })
    return presignedUrl
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

// Validate S3 configuration
export async function validateS3Config(): Promise<boolean> {
  const config = await getS3Config()
  return !!(config?.credentials.accessKeyId && config?.credentials.secretAccessKey)
}
