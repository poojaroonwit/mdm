import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireProjectSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')

  const where: any = {
    deletedAt: null
  }

  if (projectId) {
    where.projectId = projectId
  }

  if (status) {
    where.status = status
  }

  const milestones = await db.milestone.findMany({
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
      project: {
        select: {
          id: true,
          name: true,
          spaceId: true
        }
      },
      _count: {
        select: { tickets: true }
      }
    },
    orderBy: {
      position: 'asc'
    }
  })

  return NextResponse.json({ milestones })
}

export const GET = withErrorHandling(getHandler, 'GET /api/milestones')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { name, description, status, startDate, dueDate, projectId, metadata } = body

  if (!name || !projectId) {
    return NextResponse.json(
      { error: 'Name and projectId are required' },
      { status: 400 }
    )
  }

  // Check if user has access to the project's space
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const accessResult = await requireProjectSpaceAccess(projectId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get max position for milestones in this project
    const maxPosition = await db.milestone.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const milestone = await db.milestone.create({
      data: {
        name,
        description,
        status: status || 'UPCOMING',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        createdBy: session.user.id,
        position: (maxPosition?.position || 0) + 1,
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
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

  return NextResponse.json({ milestone }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/milestones')

