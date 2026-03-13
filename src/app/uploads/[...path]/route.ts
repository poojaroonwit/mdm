import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const relativePath = resolvedParams.path.join('/')
    const filePath = join(process.cwd(), 'public', 'uploads', ...resolvedParams.path)

    // 1. Try serving from local disk first
    if (existsSync(filePath)) {
      const fileBuffer = await readFile(filePath)
      const ext = filePath.split('.').pop()?.toLowerCase() || ''
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // 2. Fallback: Fetch from MinIO using SDK with credentials (handles private buckets)
    const BUCKET = process.env.MINIO_UPLOADS_BUCKET || 'udp'
    const endpoint = process.env.MINIO_ENDPOINT

    if (endpoint) {
      try {
        const port = parseInt(process.env.MINIO_PORT || '9000', 10)
        const useSSL = port === 443 || process.env.MINIO_USE_SSL === 'true'
        const accessKey = process.env.MINIO_ACCESS_KEY || ''
        const secretKey = process.env.MINIO_SECRET_KEY || ''

        // Extract hostname only (no protocol/port) for the MinIO SDK
        let hostname = endpoint
        try {
          const u = new URL(endpoint.includes('://') ? endpoint : `http://${endpoint}`)
          hostname = u.hostname
        } catch {
          hostname = endpoint.replace(/^https?:\/\//, '').split(':')[0].split('/')[0]
        }

        const { Client } = await import('minio')
        const client = new Client({ endPoint: hostname, port: useSSL ? 443 : port, useSSL, accessKey, secretKey })

        const stream = await client.getObject(BUCKET, relativePath)
        const chunks: Buffer[] = []
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any))
        }
        const buffer = Buffer.concat(chunks)
        const ext = relativePath.split('.').pop()?.toLowerCase() || ''
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          },
        })
      } catch (minioError) {
        console.error(`[uploads-proxy] MinIO SDK fetch failed for ${relativePath}:`, minioError)
      }
    }

    return new NextResponse('Not Found', { status: 404 })
  } catch (error) {
    console.error('[uploads-route] Unexpected error:', error)
    return new NextResponse('Not Found', { status: 404 })
  }
}
