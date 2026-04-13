import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

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
  const { name, path } = await request.json()

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
  }

  const sanitizedName = name.trim()
  if (sanitizedName.includes('/') || sanitizedName.includes('\\')) {
    return NextResponse.json(
      { error: 'Folder name cannot contain slashes' },
      { status: 400 }
    )
  }

  const space = await db.space.findUnique({
    where: { id: bucketId }
  })

  if (!space) {
    return NextResponse.json({ error: 'Bucket not found' }, { status: 404 })
  }

  const folderPath =
    path && typeof path === 'string' && path.trim()
      ? `${path.trim()}/${sanitizedName}`.replace(/^\/+|\/+$/g, '')
      : sanitizedName

  const existingFile = await db.spaceAttachmentStorage.findFirst({
    where: {
      spaceId: bucketId,
      filePath: {
        startsWith: folderPath + '/'
      }
    }
  })

  if (existingFile) {
    return NextResponse.json(
      { error: 'A folder or file with this name already exists' },
      { status: 409 }
    )
  }

  const exactFile = await db.spaceAttachmentStorage.findFirst({
    where: {
      spaceId: bucketId,
      filePath: folderPath
    }
  })

  if (exactFile) {
    return NextResponse.json(
      { error: 'A file with this path already exists' },
      { status: 409 }
    )
  }

  const folderMarkerId = randomUUID()

  const marker = await db.spaceAttachmentStorage.create({
    data: {
      id: folderMarkerId,
      spaceId: bucketId,
      fileName: sanitizedName,
      filePath: folderPath,
      mimeType: 'folder',
      fileSize: 0,
      createdAt: new Date()
    }
  })

  return NextResponse.json({
    folder: {
      id: marker.id,
      name: sanitizedName,
      path: folderPath,
      type: 'folder',
      createdAt: marker.createdAt
    }
  })
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/storage/buckets/[id]/folders'
)

