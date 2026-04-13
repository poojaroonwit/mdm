import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
  const status = searchParams.get('status')

  const where: any = {
    deletedAt: null
  }

  if (spaceId) {
    where.spaceId = spaceId
  }

  if (status) {
    where.status = status
  }

  const projects = await db.project.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      milestones: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        include: {
          _count: {
            select: { tickets: true }
          }
        }
      },
      _count: {
        select: {
          tickets: true,
          milestones: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ projects })
}

export const GET = withErrorHandling(getHandler, 'GET /api/projects')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { name, description, status, startDate, start_date, endDate, end_date, spaceId, space_id, metadata } = body
  
  const finalStartDate = startDate || start_date
  const finalEndDate = endDate || end_date
  const finalSpaceId = spaceId || space_id

  if (!name || !finalSpaceId) {
    return NextResponse.json(
      { error: 'Name and spaceId are required' },
      { status: 400 }
    )
  }

  // Check if user has access to the space
  const accessResult = await requireSpaceAccess(finalSpaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    const project = await db.project.create({
      data: {
        name,
        description,
        status: status || 'PLANNING',
        startDate: finalStartDate ? new Date(finalStartDate) : null,
        endDate: finalEndDate ? new Date(finalEndDate) : null,
        spaceId: finalSpaceId,
        createdBy: session.user.id,
        metadata: metadata || {}
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

  return NextResponse.json({ project }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/projects')

