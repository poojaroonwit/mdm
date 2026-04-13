import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { storeUploadedImage } from '@/lib/upload-storage'
import { logger } from '@/lib/logger'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response

    const formData = await request.formData()
    const file = formData.get('favicon') as File

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'ico').toLowerCase()
    const filename = `favicon-${timestamp}.${fileExtension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const publicUrl = await storeUploadedImage('favicons', filename, buffer, file.type || 'image/x-icon')

    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error) {
    logger.error('POST /api/upload/favicon failed', error)
    throw error
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/upload/favicon')
