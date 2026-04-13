import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE - Delete a bucket (space)
async function deleteHandler(
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

  await db.spaceAttachmentStorage.deleteMany({
    where: { spaceId: bucketId }
  })

  await db.space.delete({
    where: { id: bucketId }
  })

  return NextResponse.json({ message: 'Bucket deleted successfully' })
}

export const DELETE = withErrorHandling(
  deleteHandler,
  'DELETE /api/admin/storage/buckets/[id]'
)

