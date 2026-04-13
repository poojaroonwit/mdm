import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all buckets (spaces as buckets)
async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const spaces = await db.space.findMany({
    include: {
      attachmentStorage: {
        select: {
          fileSize: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const buckets = spaces.map(space => ({
    id: space.id,
    name: space.name,
    public: false,
    fileCount: space.attachmentStorage.length,
    totalSize: space.attachmentStorage.reduce(
      (sum, file) => sum + (file.fileSize || 0),
      0
    ),
    created: space.createdAt,
    spaceId: space.id,
    spaceName: space.name,
    // TODO: Dynamically Determine storage name based on configuration
    storageName: 'Default Storage' 
  }))

  return NextResponse.json({ buckets })
}

// POST - Create a new bucket (creates a new space)
async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { name, public: isPublic } = await request.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
  }

  if (!/^[a-z0-9_-]+$/.test(name)) {
    return NextResponse.json(
      {
        error:
          'Bucket name must contain only lowercase letters, numbers, hyphens, and underscores'
      },
      { status: 400 }
    )
  }

  const existing = await db.space.findFirst({
    where: { name }
  })

  if (existing) {
    return NextResponse.json(
      { error: 'A bucket with this name already exists' },
      { status: 409 }
    )
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const space = await db.space.create({
    data: {
      name,
      slug,
      description: `Storage bucket: ${name}`,
      createdBy: session.user.id
    }
  })

  await db.spaceMember.create({
    data: {
      spaceId: space.id,
      userId: session.user.id,
      role: 'ADMIN'
    }
  })

  return NextResponse.json({
    bucket: {
      id: space.id,
      name: space.name,
      public: isPublic || false,
      fileCount: 0,
      totalSize: 0,
      created: space.createdAt,
      spaceId: space.id,
      spaceName: space.name
    }
  })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/storage/buckets'
)
export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/storage/buckets'
)

