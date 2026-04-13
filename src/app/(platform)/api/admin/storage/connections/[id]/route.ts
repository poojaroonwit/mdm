import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get a specific storage connection
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

  const { id } = await params
  const connection = await prisma.storageConnection.findUnique({
    where: { id }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
  }

  return NextResponse.json({ connection })
}

// PUT - Update a storage connection
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

  const { id } = await params
  const { name, type, description, isActive, config } = await request.json()

  const connection = await prisma.storageConnection.findUnique({
    where: { id }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
  }

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (type !== undefined) updateData.type = type
  if (description !== undefined) updateData.description = description
  if (isActive !== undefined) updateData.isActive = isActive
  if (config !== undefined) updateData.config = config

  const updated = await prisma.storageConnection.update({
    where: { id },
    data: updateData
  })

  return NextResponse.json({ connection: updated })
}

// DELETE - Delete a storage connection
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

  const { id } = await params
  const connection = await prisma.storageConnection.findUnique({
    where: { id }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
  }

  await prisma.storageConnection.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/storage/connections/[id]'
)
export const PUT = withErrorHandling(
  putHandler,
  'PUT /api/admin/storage/connections/[id]'
)
export const DELETE = withErrorHandling(
  deleteHandler,
  'DELETE /api/admin/storage/connections/[id]'
)

