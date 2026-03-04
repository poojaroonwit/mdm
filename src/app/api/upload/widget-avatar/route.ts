import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Only reject if the browser explicitly provides a non-image MIME type.
    // An empty type (e.g. .webp on some browsers) is allowed — the input already
    // restricts selection via accept="image/*".
    if (file.type && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'widget-avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
    const filename = `widget-avatar-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/widget-avatars/${filename}`
    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error: any) {
    console.error('Error uploading widget avatar image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/upload/widget-avatar')
