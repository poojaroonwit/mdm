import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/tickets/${id}/subtasks`, { userId: session.user.id })

    const subtasks = await db.ticket.findMany({
      where: {
        parentId: id,
        deletedAt: null
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/subtasks`, 200, duration, {
      subtaskCount: subtasks.length
    })
    return NextResponse.json({ subtasks })
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]/subtasks')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('POST', `/api/tickets/${id}/subtasks`, { userId: session.user.id })

    const bodySchema = z.object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      status: z.string().optional(),
      priority: z.string().optional(),
      spaceIds: z.array(z.string().uuid()).optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { title, description, status, priority, spaceIds } = bodyValidation.data

    // Get parent ticket to inherit spaces
    const parentTicket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!parentTicket) {
      logger.warn('Parent ticket not found for subtask creation', { ticketId: id })
      return NextResponse.json({ error: 'Parent ticket not found' }, { status: 404 })
    }

    // Check access - user must have access to at least one space associated with the parent ticket
    const spaceId = parentTicket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    // Get max position for subtasks
    const maxPosition = await db.ticket.findFirst({
      where: { parentId: id },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const finalSpaceIds = spaceIds && spaceIds.length > 0 
      ? spaceIds 
      : parentTicket.spaces.map(ts => ts.spaceId)

    const subtask = await db.ticket.create({
      data: {
        title,
        description: description || null,
        status: status || 'BACKLOG',
        priority: priority || 'MEDIUM',
        parentId: id,
        createdBy: session.user.id,
        position: (maxPosition?.position || 0) + 1,
        spaces: {
          create: finalSpaceIds.map((spaceId: string) => ({
            spaceId
          }))
        }
      },
      include: {
        spaces: {
          include: {
            space: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/subtasks`, 201, duration, {
      subtaskId: subtask.id
    })
    return NextResponse.json(subtask, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/subtasks')

