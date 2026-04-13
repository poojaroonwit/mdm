import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
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
    logger.apiRequest('GET', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const [dependencies, dependents] = await Promise.all([
      db.ticketDependency.findMany({
        where: {
          ticketId: id
        },
        include: {
          dependsOn: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      }),
      db.ticketDependency.findMany({
        where: {
          dependsOnId: id
        },
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          }
        }
      })
    ])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/dependencies`, 200, duration, {
      dependencyCount: dependencies.length,
      dependentCount: dependents.length,
    })
    return NextResponse.json({ dependencies, dependents })
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]/dependencies')

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
    logger.apiRequest('POST', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const bodySchema = z.object({
      dependsOnId: commonSchemas.id,
      type: z.enum(['BLOCKS', 'RELATED', 'DUPLICATES']).optional().default('BLOCKS'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { dependsOnId, type } = bodyValidation.data

    if (id === dependsOnId) {
      logger.warn('Ticket cannot depend on itself', { ticketId: id })
      return NextResponse.json({ error: 'Ticket cannot depend on itself' }, { status: 400 })
    }

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for dependency creation', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access - user must have access to at least one space associated with the ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    // Check if dependency already exists
    const existing = await db.ticketDependency.findUnique({
      where: {
        ticketId_dependsOnId: {
          ticketId: id,
          dependsOnId
        }
      }
    })

    if (existing) {
      logger.warn('Dependency already exists', { ticketId: id, dependsOnId })
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 400 })
    }

    const dependency = await db.ticketDependency.create({
      data: {
        ticketId: id,
        dependsOnId,
        type: type || 'BLOCKS'
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/dependencies`, 201, duration, {
      dependencyId: dependency.id,
      dependsOnId,
    })
    return NextResponse.json(dependency, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/dependencies')

async function deleteHandler(
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
    logger.apiRequest('DELETE', `/api/tickets/${id}/dependencies`, { userId: session.user.id })

    const querySchema = z.object({
      dependsOnId: commonSchemas.id,
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { dependsOnId } = queryValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for dependency deletion', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access - user must have access to at least one space associated with the ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    await db.ticketDependency.delete({
      where: {
        ticketId_dependsOnId: {
          ticketId: id,
          dependsOnId
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/dependencies`, 200, duration, { dependsOnId })
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]/dependencies')

