/**
 * Shared upload helper for S3-compatible object storage.
 */

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { logger } from './logger'
import { getS3Client, getS3Config } from './s3'

async function uploadToS3(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const config = await getS3Config()
  if (!config?.bucket) {
    throw new Error('S3 bucket is not configured')
  }

  const objectName = `${subDir}/${filename}`

  logger.info('[upload-storage] Uploading to S3-compatible storage', {
    bucket: config.bucket,
    object: objectName,
    bytes: buffer.length,
    mimeType,
  })

  try {
    const client = await getS3Client()
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectName,
        Body: buffer,
        ContentType: mimeType || 'application/octet-stream',
      })
    )

    const appBase = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
    const url = appBase
      ? `${appBase}/api/assets?filePath=${encodeURIComponent(objectName)}`
      : `/api/assets?filePath=${encodeURIComponent(objectName)}`

    logger.info('[upload-storage] S3-compatible upload success', { object: objectName, url })
    return url
  } catch (err) {
    logger.error('[upload-storage] S3-compatible upload failed', err instanceof Error ? err : new Error(String(err)), {
      bucket: config.bucket,
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
  return uploadToS3(subDir, filename, buffer, mimeType)
}

export const storeUploadedFile = storeUploadedImage
