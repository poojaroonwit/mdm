import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getHandler(
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

  const file = await db.spaceAttachmentStorage.findUnique({
    where: { id: fileId }
  })

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  // TODO: Integrate with actual storage backend and return a file stream or redirect.
  return NextResponse.json({
    file: {
      id: file.id,
      name: file.fileName,
      size: file.fileSize,
      mimeType: file.mimeType,
      path: file.filePath
    }
  })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/storage/files/[id]/download'
)

