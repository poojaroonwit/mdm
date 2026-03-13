/**
 * Shared file upload helper — all files go directly to MinIO.
 */

import { logger } from './logger'

/**
 * Extract just the hostname from a MinIO endpoint string.
 * Handles all formats:
 *   'http://minio-service:9000'              → 'minio-service'
 *   'https://minio.example.com'              → 'minio.example.com'
 *   'ncc-dev-api-storage-data-product.com:443' → 'ncc-dev-api-storage-data-product.com'
 *   'minio-service'                          → 'minio-service'
 */
function parseEndpointHostname(endpoint: string): string {
  try {
    const url = new URL(endpoint.includes('://') ? endpoint : `http://${endpoint}`)
    return url.hostname
  } catch {
    return endpoint.replace(/^https?:\/\//, '').split(':')[0].split('/')[0]
  }
}

async function uploadToMinio(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) {
    logger.error('[upload-storage] MINIO_ENDPOINT is not set', undefined, { subDir, filename })
    throw new Error('MinIO not configured: MINIO_ENDPOINT env var is missing')
  }

  const port = parseInt(process.env.MINIO_PORT || '9000', 10)
  const useSSL = port === 443 || process.env.MINIO_USE_SSL === 'true'
  const accessKey = process.env.MINIO_ACCESS_KEY || ''
  const secretKey = process.env.MINIO_SECRET_KEY || ''
  const bucket = process.env.MINIO_UPLOADS_BUCKET || process.env.MINIO_BUCKET || process.env.MINIO_ACCESS_KEY || 'udp'

  // Extract just the hostname (no protocol, no port) for the MinIO SDK
  const endpointHostname = parseEndpointHostname(endpoint)

  logger.info('[upload-storage] Uploading to MinIO', {
    endpointHostname,
    port,
    useSSL,
    bucket,
    object: `${subDir}/${filename}`,
    bytes: buffer.length,
  })

  // Dynamic import so the minio client is server-only
  const { Client } = await import('minio')

  const client = new Client({
    endPoint: endpointHostname,   // hostname only — no embedded port
    port: useSSL ? 443 : port,
    useSSL,
    accessKey,
    secretKey,
  })

  try {
    try {
      // Ensure bucket exists
      const exists = await client.bucketExists(bucket)
      if (!exists) {
        await client.makeBucket(bucket, 'us-east-1')
        // Set public-read policy so images are accessible via URL
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          }],
        })
        await client.setBucketPolicy(bucket, policy)
      }
    } catch (bucketErr) {
      // If we can't check/create the bucket or set policy (AccessDenied),
      // we still try the putObject call because the user might have write permissions
      // to an existing bucket but not permission to check headers or policies.
      logger.warn('[upload-storage] Bucket check/creation failed, proceedings with direct upload attempt', {
        error: bucketErr instanceof Error ? bucketErr.message : String(bucketErr),
        bucket
      })
    }

    const objectName = `${subDir}/${filename}`
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType || 'application/octet-stream',
    })

    // Return a proxy-relative URL so the browser always fetches through the
    // Next.js /uploads/... route (authenticated via MinIO SDK). This avoids
    // AccessDenied errors when the bucket has no public-read policy.
    const url = `/uploads/${objectName}`

    logger.info('[upload-storage] MinIO upload success', { object: objectName, url })
    return url
  } catch (err) {
    logger.error('[upload-storage] MinIO upload failed', err instanceof Error ? err : new Error(String(err)), {
      endpointHostname,
      port,
      useSSL,
      bucket,
      object: `${subDir}/${filename}`,
    })
    throw err
  }
}

export async function storeUploadedImage(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  return uploadToMinio(subDir, filename, buffer, mimeType)
}

/** Alias for non-image files (PDFs, docs, etc.) — same implementation. */
export const storeUploadedFile = storeUploadedImage
