import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'

async function putHandler(
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

  const { id: fileId } = await params
  const { newName } = await request.json()

  if (!newName || !newName.trim()) {
    return NextResponse.json({ error: 'New name is required' }, { status: 400 })
  }

  const existingFile = await db.spaceAttachmentStorage.findUnique({
    where: { id: fileId },
    select: { filePath: true, fileName: true, spaceId: true }
  })

  if (!existingFile) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const storageConnection = await db.storageConnection.findFirst({
    where: {
      isActive: true,
      type: { in: ['minio', 's3', 'sftp', 'ftp'] }
    }
  })

  if (!storageConnection) {
    return NextResponse.json(
      { error: 'No active storage connection found' },
      { status: 500 }
    )
  }

  const storageService = new AttachmentStorageService({
    provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
    config: {
      [storageConnection.type]: storageConnection.config
    } as any
  })

  const oldFileName =
    existingFile.filePath?.split('/').pop() || existingFile.fileName
  const trimmedNewName = newName.trim()

  const renameResult = await storageService.renameFile(oldFileName, trimmedNewName)

  if (!renameResult.success) {
    return NextResponse.json(
      {
        error: renameResult.error || 'Failed to rename file in storage'
      },
      { status: 500 }
    )
  }

  const pathParts = existingFile.filePath?.split('/') || []
  pathParts[pathParts.length - 1] = trimmedNewName
  const newFilePath = pathParts.join('/')

  const updatedFile = await db.spaceAttachmentStorage.update({
    where: { id: fileId },
    data: {
      fileName: trimmedNewName,
      filePath: newFilePath
    }
  })

  return NextResponse.json({
    file: {
      id: updatedFile.id,
      name: updatedFile.fileName,
      path: updatedFile.filePath,
      createdAt: updatedFile.createdAt
    }
  })
}

export const PUT = withErrorHandling(
  putHandler,
  'PUT /api/admin/storage/files/[id]/rename'
)

