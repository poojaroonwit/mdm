/**
 * /api/assets?filePath=widget-avatars/filename.jpg
 *
 * Authenticated MinIO proxy — serves private-bucket files through the
 * Next.js server using SDK credentials. No public MinIO access needed.
 *
 * Modelled after studio-2's /api/secure-file/preview approach.
 */
import { NextRequest, NextResponse } from 'next/server'

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  ico: 'image/x-icon',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('filePath')

  if (!filePath) {
    return new NextResponse('Missing filePath parameter', { status: 400 })
  }

  // Prevent path traversal
  const safePath = filePath.replace(/\.\./g, '').replace(/^\/+/, '')
  if (!safePath) {
    return new NextResponse('Invalid filePath', { status: 400 })
  }

  const endpoint = process.env.MINIO_ENDPOINT
  if (!endpoint) {
    return new NextResponse('Storage not configured', { status: 503 })
  }

  try {
    const port = parseInt(process.env.MINIO_PORT || '9000', 10)
    const useSSL = port === 443 || process.env.MINIO_USE_SSL === 'true'
    const accessKey = process.env.MINIO_ACCESS_KEY || ''
    const secretKey = process.env.MINIO_SECRET_KEY || ''
    const bucket = process.env.MINIO_UPLOADS_BUCKET || 'udp'

    // Extract hostname only — MinIO SDK requires no protocol/port in endPoint
    let hostname = endpoint
    try {
      const u = new URL(endpoint.includes('://') ? endpoint : `http://${endpoint}`)
      hostname = u.hostname
    } catch {
      hostname = endpoint.replace(/^https?:\/\//, '').split(':')[0].split('/')[0]
    }

    const { Client } = await import('minio')
    const client = new Client({ endPoint: hostname, port: useSSL ? 443 : port, useSSL, accessKey, secretKey })

    const stream = await client.getObject(bucket, safePath)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any))
    }
    const buffer = Buffer.concat(chunks)

    const ext = safePath.split('.').pop()?.toLowerCase() || ''
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  } catch (err: any) {
    console.error(`[api/assets] Failed to fetch ${safePath}:`, err?.message || err)
    return new NextResponse('Not Found', { status: 404 })
  }
}
