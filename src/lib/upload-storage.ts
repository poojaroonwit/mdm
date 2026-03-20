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
import { minioClient, MINIO_BUCKET } from './minio'

async function uploadToMinio(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const bucket = MINIO_BUCKET
  const objectName = `${subDir}/${filename}`

  logger.info('[upload-storage] Uploading to MinIO', {
    bucket,
    object: objectName,
    bytes: buffer.length,
    mimeType
  })

  try {
    try {
      // Ensure bucket exists
      const exists = await minioClient.bucketExists(bucket)
      if (!exists) {
        logger.info(`[upload-storage] Creating bucket: ${bucket}`)
        await minioClient.makeBucket(bucket, 'us-east-1')
        
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
        await minioClient.setBucketPolicy(bucket, policy)
      }
    } catch (bucketErr) {
      // If we can't check/create the bucket or set policy (AccessDenied),
      // we still try the putObject call because the user might have write permissions
      // to an existing bucket but not permission to check headers or policies.
      logger.warn('[upload-storage] Bucket check/creation failed, proceeding with direct upload attempt', {
        error: bucketErr instanceof Error ? bucketErr.message : String(bucketErr),
        bucket
      })
    }

    await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimeType || 'application/octet-stream',
    })

    // Return an absolute URL pointing to our /api/assets proxy (studio-2 pattern).
    // Using an absolute URL ensures it works from external pages embedding the widget,
    // because relative paths would resolve against the embedding page's domain.
    const appBase = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
    const url = appBase
      ? `${appBase}/api/assets?filePath=${encodeURIComponent(objectName)}`
      : `/api/assets?filePath=${encodeURIComponent(objectName)}`

    logger.info('[upload-storage] MinIO upload success', { object: objectName, url })
    return url
  } catch (err) {
    logger.error('[upload-storage] MinIO upload failed', err instanceof Error ? err : new Error(String(err)), {
      bucket,
      object: objectName,
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
