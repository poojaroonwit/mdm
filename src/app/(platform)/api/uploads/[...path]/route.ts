import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePath = join(process.cwd(), 'public', 'uploads', ...resolvedParams.path)

    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || ''
    
    let contentType = 'application/octet-stream'
    if (['jpg', 'jpeg'].includes(fileExtension)) contentType = 'image/jpeg'
    else if (fileExtension === 'png') contentType = 'image/png'
    else if (fileExtension === 'gif') contentType = 'image/gif'
    else if (fileExtension === 'webp') contentType = 'image/webp'
    else if (fileExtension === 'svg') contentType = 'image/svg+xml'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Error serving upload file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
