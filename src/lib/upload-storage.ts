/**
 * Shared file upload helper.
 * Tries the local public/ filesystem first (works in dev).
 * Falls back to MinIO when the filesystem is read-only or full (production Docker).
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function tryLocalWrite(
  subDir: string,
  filename: string,
  buffer: Buffer
): Promise<string | null> {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', subDir)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    await writeFile(join(uploadsDir, filename), buffer)
    return `/uploads/${subDir}/${filename}`
  } catch {
    return null
  }
}

async function uploadToMinio(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) throw new Error('MinIO not configured')

  const port = parseInt(process.env.MINIO_PORT || '9000', 10)
  const useSSL = port === 443 || process.env.MINIO_USE_SSL === 'true'
  const accessKey = process.env.MINIO_ACCESS_KEY || ''
  const secretKey = process.env.MINIO_SECRET_KEY || ''
  const bucket = process.env.MINIO_UPLOADS_BUCKET || process.env.MINIO_BUCKET || 'uploads'

  // Dynamic import so the minio client is server-only
  const { Client } = await import('minio')

  const client = new Client({
    endPoint: endpoint.replace(/^https?:\/\//, ''),
    port: useSSL ? 443 : port,
    useSSL,
    accessKey,
    secretKey,
  })

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
  return `${protocol}://${endpoint.replace(/^https?:\/\//, '')}${portSuffix}/${bucket}/${objectName}`
}

export async function storeUploadedImage(
  subDir: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // 1. Try local filesystem (dev / mounted volume)
  const localUrl = await tryLocalWrite(subDir, filename, buffer)
  if (localUrl) return localUrl

  // 2. Fall back to MinIO (production Docker where public/ is read-only)
  return uploadToMinio(subDir, filename, buffer, mimeType)
}

/** Alias for non-image files (PDFs, docs, etc.) — same implementation. */
export const storeUploadedFile = storeUploadedImage
