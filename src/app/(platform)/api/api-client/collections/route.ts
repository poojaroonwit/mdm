import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const collections = await prisma.apiCollection.findMany({
      where: {
        workspaceId,
        parentId: null, // Only get root collections
      },
      include: {
        children: {
          include: {
            children: true,
            requests: true,
          },
        },
        requests: true,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ collections })
}

export const GET = withErrorHandling(getHandler, 'GET /api/api-client/collections')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { workspaceId, name, description, parentId, order } = body

    const collection = await prisma.apiCollection.create({
      data: {
        workspaceId,
        name,
        description,
        parentId,
        order: order || 0,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ collection })
}




export const POST = withErrorHandling(postHandler, 'POST POST /api/api-client/collections')