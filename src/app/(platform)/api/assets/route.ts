/**
 * /api/assets?filePath=widget-avatars/filename.jpg
 *
 * Public asset proxy for S3-compatible object storage.
 */

import { GetObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { getS3Client, getS3Config } from '@/lib/s3'

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

  const safePath = filePath.replace(/\.\.\//g, '').replace(/^\/+/, '')
  if (!safePath) {
    return new NextResponse('Invalid filePath', { status: 400 })
  }

  const contentType = inferContentType(safePath)
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(safePath)

  try {
    const config = await getS3Config()
    if (!config?.bucket) {
      throw new Error('S3 bucket is not configured')
    }

    const client = await getS3Client()
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: safePath,
      })
    )

    if (!response.Body) {
      throw new Error('S3 object response did not include a body')
    }

    return new NextResponse(response.Body as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': response.ContentType || contentType,
        'Cache-Control': 'public, max-age=86400',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err: any) {
    const code = err?.code || err?.name || ''
    console.error(`[api/assets] ${code || 'Error'} fetching ${safePath}:`, err?.message || err)

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
