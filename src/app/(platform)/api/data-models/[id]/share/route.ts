import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

  const { id } = await params
    const body = await request.json()
    const { space_ids } = body

  if (!Array.isArray(space_ids)) {
    return NextResponse.json({ error: 'space_ids must be an array' }, { status: 500 })
  }

  // Get the data model to check permissions using Prisma
    const dataModel = await db.dataModel.findUnique({
      where: { id },
      include: { spaces: { take: 1 } }
    })

  if (!dataModel) {
    return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
  }

  // Check if user has admin/owner access to the original space
    const originalSpaceId = dataModel.spaces?.[0]?.spaceId
  if (!originalSpaceId) {
    return NextResponse.json({ error: 'Data model has no original space' }, { status: 500 })
  }

  const spaceMember = await db.spaceMember.findFirst({
      where: {
        spaceId: originalSpaceId,
        userId: session.user.id
      },
      select: { role: true }
    })

  if (!spaceMember || !['admin', 'owner'].includes(spaceMember.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Validate that all target spaces exist and user has access using Prisma
    if (space_ids.length > 0) {
      const targetSpaces = await db.spaceMember.findMany({
        where: {
          userId: session.user.id,
          spaceId: { in: space_ids }
        },
        select: { spaceId: true }
      })

      const accessibleSpaceIds = targetSpaces.map(s => s.spaceId)
      const invalidSpaceIds = space_ids.filter(id => !accessibleSpaceIds.includes(id))
      
      if (invalidSpaceIds.length > 0) {
        return NextResponse.json({ 
          error: `Access denied to spaces: ${invalidSpaceIds.join(', ')}` 
        })
      }
    }

    // Update the data model with new space_ids using Prisma
    // First, delete existing spaces (except original)
    await db.dataModelSpace.deleteMany({
      where: { 
        dataModelId: id,
        spaceId: { not: originalSpaceId }
      }
    })

    // Then, create new space relations
    if (space_ids.length > 0) {
      await db.dataModelSpace.createMany({
        data: space_ids.map(spaceId => ({
          dataModelId: id,
          spaceId: spaceId
        })),
        skipDuplicates: true
      })
    }

    const updatedModel = await db.dataModel.findUnique({
      where: { id },
      include: { spaces: true }
    })

  return NextResponse.json({ 
    dataModel: updatedModel,
    message: 'Sharing updated successfully'
  })
}

export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/data-models/[id]/share/route.ts')