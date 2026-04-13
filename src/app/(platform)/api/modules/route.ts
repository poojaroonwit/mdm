import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId } from '@/lib/api-middleware'
import { requireSpaceAccess, requireProjectSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { z } from 'zod'
import { validateBody } from '@/lib/api-validation'

const moduleSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional().default('PLANNED'),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
})

// Get all modules for a project
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const spaceId = searchParams.get('space_id')

    if (!projectId && !spaceId) {
      return NextResponse.json(
        { error: 'project_id or space_id is required' },
        { status: 400 }
      )
    }

    let modules
    if (projectId) {
      // Get modules for a specific project
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { spaceId: true }
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Check access
      const accessResult = await requireProjectSpaceAccess(projectId, session.user.id)
      if (!accessResult.success) return accessResult.response

      modules = await db.module.findMany({
        where: {
          projectId,
          deletedAt: null
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
          lead: {
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
          },
          _count: {
            select: {
              tickets: true
            }
          }
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    } else {
      // Get all modules for a space (across all projects)
      const accessResult = await requireSpaceAccess(spaceId!, session.user.id)
      if (!accessResult.success) return accessResult.response

      modules = await db.module.findMany({
        where: {
          project: {
            spaceId: spaceId!,
            deletedAt: null
          },
          deletedAt: null
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
          lead: {
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
          },
          _count: {
            select: {
              tickets: true
            }
          }
        },
        orderBy: [
          { position: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    }

    // Calculate progress for each module
    const modulesWithProgress = await Promise.all(
      modules.map(async (module) => {
        const tickets = await db.ticket.findMany({
          where: {
            moduleId: module.id,
            deletedAt: null
          },
          select: {
            status: true
          }
        })

        const total = tickets.length
        const completed = tickets.filter(t => t.status === 'DONE' || t.status === 'CANCELLED').length
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
          ...module,
          progress,
          totalTickets: total,
          completedTickets: completed
        }
      })
    )

    return NextResponse.json({ success: true, modules: modulesWithProgress })
  } catch (error: any) {
    console.error('Error fetching modules:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

// Create a new module
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const bodyValidation = await validateBody(request, moduleSchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { projectId, name, description, status, startDate, targetDate, leadId, metadata } = bodyValidation.data

    // Check if user has access to the project's space
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { spaceId: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check access
    const accessResult = await requireProjectSpaceAccess(projectId, session.user.id)
    if (!accessResult.success) return accessResult.response

    // Get the highest position for this project
    const lastModule = await db.module.findFirst({
      where: { projectId, deletedAt: null },
      orderBy: { position: 'desc' }
    })
    const position = lastModule ? lastModule.position + 1 : 0

    const module = await db.module.create({
      data: {
        projectId,
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        leadId: leadId || null,
        position,
        createdBy: session.user.id,
        metadata
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
        lead: {
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

    return NextResponse.json({ success: true, module })
  } catch (error: any) {
    console.error('Error creating module:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create module' },
      { status: 500 }
    )
  }
}
