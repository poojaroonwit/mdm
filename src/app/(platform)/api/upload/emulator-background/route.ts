import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limiter'
import { storeUploadedImage } from '@/lib/upload-storage'
import { logger } from '@/lib/logger'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Rate limiting: Strict limit for uploads (resource intensive)
    const rateLimitResult = await checkRateLimit('upload-emulator-bg', session.user.id, {
      enabled: true,
      maxRequestsPerMinute: 10,
      blockDuration: 600,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
    const filename = `emulator-bg-${timestamp}.${fileExtension}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const publicUrl = await storeUploadedImage('emulator-backgrounds', filename, buffer, file.type || 'image/png')

    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error) {
    logger.error('POST /api/upload/emulator-background failed', error)
    throw error
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/upload/emulator-background')
