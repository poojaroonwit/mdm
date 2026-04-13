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

  const textMimeTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/x-javascript',
    'application/typescript',
    'application/x-typescript',
    'application/csv',
    'text/csv'
  ]

  const isTextFile =
    textMimeTypes.some(type => file.mimeType?.startsWith(type)) ||
    !!file.fileName?.match(
      /\.(txt|md|json|xml|js|ts|jsx|tsx|py|java|cpp|c|cs|php|rb|go|rs|swift|kt|scala|r|sh|bash|sql|html|css|yaml|yml|csv)$/i
    )

  if (!isTextFile) {
    return NextResponse.json({
      error: 'File content cannot be displayed as text',
      content: null
    })
  }

  const placeholderContent = `File: ${file.fileName}\nType: ${file.mimeType}\nSize: ${file.fileSize} bytes\n\n[File content would be loaded from storage service]`

  return NextResponse.json({
    content: placeholderContent,
    mimeType: file.mimeType,
    fileName: file.fileName
  })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/storage/files/[id]/content'
)

