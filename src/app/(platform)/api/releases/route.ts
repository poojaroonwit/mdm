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

  const releases = await db.release.findMany({
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
      targetDate: 'desc'
    }
  })

  return NextResponse.json({ releases })
}

export const GET = withErrorHandling(getHandler, 'GET /api/releases')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { name, version, description, status, targetDate, releaseDate, projectId, metadata } = body

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

    // Check if version already exists for this project
    if (version) {
      const existingRelease = await db.release.findFirst({
        where: {
          projectId,
          version,
          deletedAt: null
        }
      })

      if (existingRelease) {
        return NextResponse.json(
          { error: `Release with version ${version} already exists for this project` },
          { status: 400 }
        )
      }
    }

    const release = await db.release.create({
      data: {
        name,
        version: version || null,
        description,
        status: status || 'PLANNED',
        targetDate: targetDate ? new Date(targetDate) : null,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        projectId,
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
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

  return NextResponse.json({ release }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/releases')

