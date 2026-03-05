/**
 * Shared file upload helper — all files go directly to MinIO.
 */

import { logger } from './logger'

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
  const bucket = process.env.MINIO_UPLOADS_BUCKET || process.env.MINIO_BUCKET || 'uploads'

  logger.info('[upload-storage] Uploading to MinIO', {
    endpoint: endpoint.replace(/^https?:\/\//, ''),
    port,
    useSSL,
    bucket,
    object: `${subDir}/${filename}`,
    bytes: buffer.length,
  })

  // Dynamic import so the minio client is server-only
  const { Client } = await import('minio')

  const client = new Client({
    endPoint: endpoint.replace(/^https?:\/\//, ''),
    port: useSSL ? 443 : port,
    useSSL,
    accessKey,
    secretKey,
  })

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

    const objectName = `${subDir}/${filename}`
    await client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType || 'application/octet-stream',
    })

    const protocol = useSSL ? 'https' : 'http'
    const portSuffix = (port === 80 || port === 443) ? '' : `:${port}`
    const url = `${protocol}://${endpoint.replace(/^https?:\/\//, '')}${portSuffix}/${bucket}/${objectName}`

    logger.info('[upload-storage] MinIO upload success', { object: objectName, url })
    return url
  } catch (err) {
    logger.error('[upload-storage] MinIO upload failed', err instanceof Error ? err : new Error(String(err)), {
      endpoint: endpoint.replace(/^https?:\/\//, ''),
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
