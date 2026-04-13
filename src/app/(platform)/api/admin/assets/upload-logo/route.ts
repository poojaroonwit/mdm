import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { storeUploadedImage } from '@/lib/upload-storage'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('logo') as File
  const assetId = formData.get('assetId') as string

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type && !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  const timestamp = Date.now()
  const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase()
  const filename = assetId
    ? `asset-${assetId}-${timestamp}.${fileExtension}`
    : `logo-${timestamp}.${fileExtension}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const publicUrl = await storeUploadedImage('assets/logos', filename, buffer, file.type || 'image/png')

  return NextResponse.json({ success: true, url: publicUrl, filename })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/assets/upload-logo')
