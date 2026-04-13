import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { checkAnySpaceAccess, requireAnySpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceIdsParam = searchParams.get('spaceIds') || searchParams.get('space_ids')
  const spaceIds = spaceIdsParam?.split(',') || []
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const assignedTo = searchParams.get('assignedTo') || searchParams.get('assigned_to')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const projectId = searchParams.get('projectId')
  const cycleId = searchParams.get('cycleId')

  // Build space filter - support multiple spaces or all spaces
  const spaceFilter: string[] = []
  if (spaceId) spaceFilter.push(spaceId)
  if (spaceIds.length > 0) spaceFilter.push(...spaceIds)

  // If no space filter provided, get all spaces user has access to
  let accessibleSpaceIds: string[] = []
  if (spaceFilter.length === 0) {
    // Get all spaces where user is a member or owner
    const userSpaces = await db.space.findMany({
      where: {
        OR: [
          { createdBy: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ],
        deletedAt: null
      },
      select: {
        id: true
      }
    })
    accessibleSpaceIds = userSpaces.map(s => s.id)

    // If user has no accessible spaces, return empty result
    if (accessibleSpaceIds.length === 0) {
      return NextResponse.json({
        tickets: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      })
    }
  } else {
    // Check if user has access to any of the requested spaces
    const hasAccess = await checkAnySpaceAccess(spaceFilter, session.user.id!)
    if (!hasAccess) {
      return NextResponse.json({ error: `Access denied to one or more spaces` }, { status: 403 })
    }
    accessibleSpaceIds = spaceFilter
  }

  // Build where clause - tickets that belong to any of the accessible spaces
  const where: any = {
    deletedAt: null,
    spaces: {
      some: {
        spaceId: {
          in: accessibleSpaceIds
        }
      }
    }
  }

  if (status) {
    where.status = status
  }

  if (priority) {
    where.priority = priority
  }

  if (assignedTo) {
    where.assignees = {
      some: {
        userId: assignedTo
      }
    }
  }


  if (projectId) {
    where.projectId = projectId
  }

  if (cycleId) {
    where.cycleId = cycleId
  }

  const skip = (page - 1) * limit

  const [tickets, total] = await Promise.all([
    db.ticket.findMany({
      where,
      include: {
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        tags: true,
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        subtasks: {
          where: {
            deletedAt: null
          }
        },
        parent: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    db.ticket.count({ where })
  ])

  return NextResponse.json({
    tickets,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    title,
    description,
    status,
    priority,
    dueDate,
    due_date,
    startDate,
    start_date,
    assignedTo,
    assigned_to,
    spaceIds,
    space_ids,
    spaceId,
    space_id,
    tags,
    estimate,
    attributes,
    parentId,
    parent_id
  } = body

  const finalDueDate = dueDate || due_date
  const finalStartDate = startDate || start_date
  const finalAssignedTo = assignedTo || assigned_to
  const finalSpaceIdsInput = spaceIds || space_ids
  const finalSpaceIdInput = spaceId || space_id
  const finalParentId = parentId || parent_id

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Support both spaceIds array and single spaceId
  const finalSpaceIds = finalSpaceIdsInput && finalSpaceIdsInput.length > 0 ? finalSpaceIdsInput : (finalSpaceIdInput ? [finalSpaceIdInput] : [])

  if (finalSpaceIds.length === 0) {
    return NextResponse.json({ error: 'spaceId or spaceIds is required' }, { status: 400 })
  }

  // Check if user has access to all spaces
  const accessResult = await requireAnySpaceAccess(finalSpaceIds, session.user.id!)
  if (!accessResult.success) return accessResult.response

  // Create ticket
  const ticket = await db.ticket.create({
    data: {
      title,
      description: description || null,
      status: status || 'BACKLOG',
      priority: priority || 'MEDIUM',
      dueDate: finalDueDate ? new Date(finalDueDate) : null,
      startDate: finalStartDate ? new Date(finalStartDate) : null,
      createdBy: session.user.id,
      estimate: estimate || null,
      parentId: finalParentId || null,
      spaces: {
        create: finalSpaceIds.map((sid: string) => ({
          spaceId: sid
        }))
      },
      assignees: finalAssignedTo && finalAssignedTo.length > 0 ? {
        create: finalAssignedTo.map((userId: string) => ({
          userId,
          role: 'ASSIGNEE'
        }))
      } : undefined,
      tags: tags && tags.length > 0 ? {
        create: tags.map((tag: any) => ({
          name: tag.name || tag,
          color: tag.color || null
        }))
      } : undefined,
      attributes: attributes && attributes.length > 0 ? {
        create: attributes.map((attr: any, index: number) => ({
          name: attr.name,
          displayName: attr.displayName || attr.name,
          type: attr.type || 'TEXT',
          value: attr.value || null,
          jsonValue: attr.jsonValue || null,
          isRequired: attr.isRequired || false,
          sortOrder: attr.sortOrder !== undefined ? attr.sortOrder : index
        }))
      } : undefined
    },
    include: {
      spaces: {
        include: {
          space: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      assignees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      tags: true,
      attributes: {
        orderBy: {
          sortOrder: 'asc'
        }
      }
    }
  })

  return NextResponse.json(ticket, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets')
