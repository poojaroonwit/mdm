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

    // 2. Fallback: Try proxying to MinIO if local file doesn't exist
    // This handles cases where assets were uploaded to MinIO but the frontend is using legacy /uploads/ paths
    const PUBLIC_BASE = process.env.MINIO_PUBLIC_URL || (process.env.MINIO_ENDPOINT ? `https://${process.env.MINIO_ENDPOINT}` : null)
    const BUCKET = process.env.MINIO_UPLOADS_BUCKET || 'udp'

    if (PUBLIC_BASE) {
      const minioUrl = `${PUBLIC_BASE.replace(/\/$/, '')}/${BUCKET}/${relativePath}`
      console.log(`[uploads-proxy] Local file not found, proxying to: ${minioUrl}`)
      
      try {
        const response = await fetch(minioUrl)
        if (response.ok) {
          const buffer = await response.arrayBuffer()
          const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
            },
          })
        }
      } catch (proxyError) {
        console.error(`[uploads-proxy] Proxy failed for ${minioUrl}:`, proxyError)
      }
    }

    return new NextResponse('Not Found', { status: 404 })
  } catch (error) {
    console.error('[uploads-route] Unexpected error:', error)
    return new NextResponse('Not Found', { status: 404 })
  }
}
