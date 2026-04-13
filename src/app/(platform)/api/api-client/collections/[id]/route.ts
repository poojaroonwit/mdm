import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const collection = await prisma.apiCollection.findUnique({
      where: { id },
      include: {
        children: true,
        requests: true,
      },
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json({ collection })
}

export const GET = withErrorHandling(getHandler, 'GET /api/api-client/collections/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()
    const { name, description, parentId, order } = body

    const collection = await prisma.apiCollection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json({ collection })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/api-client/collections/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    await prisma.apiCollection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/api-client/collections/[id]')

