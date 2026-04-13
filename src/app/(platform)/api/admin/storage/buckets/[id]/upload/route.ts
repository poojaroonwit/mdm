import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { id: bucketId } = await params

  const space = await db.space.findUnique({
    where: { id: bucketId }
  })

  if (!space) {
    return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const path = (formData.get('path') as string) || ''

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  let storageConfig = await db.spaceAttachmentStorage.findFirst({
    where: { spaceId: bucketId }
  })

  if (!storageConfig) {
    storageConfig = await db.spaceAttachmentStorage.create({
      data: {
        id: uuidv4(),
        spaceId: bucketId,
        fileName: '',
        filePath: '',
        fileSize: 0,
        mimeType: 'application/octet-stream'
      }
    })
  }

  const uploadedFiles: any[] = []

  for (const file of files) {
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    const attachmentFile = await db.spaceAttachmentStorage.create({
      data: {
        id: uuidv4(),
        spaceId: bucketId,
        fileName: file.name,
        filePath: path ? `${path}/${uniqueFileName}` : uniqueFileName,
        fileSize: file.size,
        mimeType: file.type
      }
    })

    uploadedFiles.push(attachmentFile)
  }

  return NextResponse.json({
    message: 'Files uploaded successfully',
    files: uploadedFiles
  })
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/storage/buckets/[id]/upload'
)

