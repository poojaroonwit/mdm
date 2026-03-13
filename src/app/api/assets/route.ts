/**
 * /api/assets?filePath=widget-avatars/filename.jpg
 *
 * MinIO proxy route — mirrors studio-2's /api/secure-file/preview pattern.
 *
 * Uses minioPublicClient (built from MINIO_PUBLIC_URL) so the hostname/port/SSL
 * are always correct for the externally-reachable MinIO server.
 * Falls back to minioClient (MINIO_ENDPOINT) if no public URL is configured.
 *
 * No authentication required — chatbot assets are served to public widgets.
 */
import { NextRequest, NextResponse } from 'next/server'
import { minioClient, minioPublicClient, MINIO_BUCKET } from '@/lib/minio'

export const dynamic = 'force-dynamic'

function inferContentType(filePath: string): string {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.ico')) return 'image/x-icon'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

// Transparent 1×1 PNG — returned when the object is not found (prevents broken-image icons)
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('filePath') || ''

  if (!filePath) {
    return new NextResponse('Missing filePath parameter', { status: 400 })
  }

  // Prevent path traversal
  const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '')
  if (!safePath) {
    return new NextResponse('Invalid filePath', { status: 400 })
  }

  const contentType = inferContentType(safePath)
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(safePath)

  // Prefer the public client (built from MINIO_PUBLIC_URL) so hostname/SSL are correct.
  // Fall back to internal client if public URL is not configured.
  const client = minioPublicClient ?? minioClient

  try {
    // Stream directly to the response — same approach as studio-2
    const stream = await client.getObject(MINIO_BUCKET, safePath)

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    const code = err?.code || ''
    console.error(`[api/assets] ${code || 'Error'} fetching ${safePath}:`, err?.message || err)

    // Return transparent PNG for missing images instead of broken-image icon
    if (isImage) {
      return new NextResponse(TRANSPARENT_PNG, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
          'X-File-Status': 'not-found',
        },
      })
    }

    return new NextResponse('Not Found', { status: 404 })
  }
}
