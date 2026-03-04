import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const formData = await request.formData()
  const file = formData.get('logo') as File

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Only reject if the browser provides a non-image MIME type explicitly.
  // An empty type can occur for some formats on certain browsers.
  if (file.type && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const timestamp = Date.now()
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
    const filename = `logo-${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/logos/${filename}`
    return NextResponse.json({ success: true, url: publicUrl, filename })
  } catch (error: any) {
    console.error('Error uploading logo:', error)
    const isNoSpace = error?.code === 'ENOSPC'
    const isReadOnly = error?.code === 'EROFS' || error?.code === 'EACCES'
    if (isNoSpace) {
      return NextResponse.json({ error: 'Server storage is full' }, { status: 507 })
    }
    if (isReadOnly) {
      return NextResponse.json({ error: 'Server storage is not writable' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/upload/logo')
