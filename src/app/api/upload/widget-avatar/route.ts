import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { storeUploadedImage } from '@/lib/upload-storage'
import { logger } from '@/lib/logger'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Only reject if the browser explicitly provides a non-image MIME type.
    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
    const filename = `widget-avatar-${timestamp}.${fileExtension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const publicUrl = await storeUploadedImage('widget-avatars', filename, buffer, file.type || 'image/png')

    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error) {
    logger.error('POST /api/upload/widget-avatar failed', error)
    throw error
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/upload/widget-avatar')
