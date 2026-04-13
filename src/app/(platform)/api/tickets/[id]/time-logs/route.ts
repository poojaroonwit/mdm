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
    logger.apiRequest('GET', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const timeLogs = await db.ticketTimeLog.findMany({
      where: {
        ticketId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        loggedAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/time-logs`, 200, duration, {
      timeLogCount: timeLogs.length
    })
    return NextResponse.json({ timeLogs })
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]/time-logs')

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
    logger.apiRequest('POST', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const bodySchema = z.object({
      hours: z.number().positive('Valid hours are required'),
      description: z.string().optional().nullable(),
      loggedAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : new Date()),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { hours, description, loggedAt } = bodyValidation.data

    // Check if ticket exists
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { spaces: true }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for time log creation', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access - user must have access to at least one space associated with the ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    const timeLog = await db.ticketTimeLog.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        hours: hours,
        description: description || null,
        loggedAt: loggedAt || new Date()
      },
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
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/tickets/${id}/time-logs`, 201, duration, {
      timeLogId: timeLog.id,
      hours,
    })
    return NextResponse.json(timeLog, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/time-logs')

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
    logger.apiRequest('DELETE', `/api/tickets/${id}/time-logs`, { userId: session.user.id })

    const querySchema = z.object({
      timeLogId: commonSchemas.id,
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { timeLogId } = queryValidation.data

    const timeLog = await db.ticketTimeLog.findUnique({
      where: { id: timeLogId }
    })

    if (!timeLog || timeLog.userId !== session.user.id) {
      logger.warn('Time log not found or unauthorized', { ticketId: id, timeLogId, userId: session.user.id })
      return NextResponse.json({ error: 'Time log not found or unauthorized' }, { status: 404 })
    }

    await db.ticketTimeLog.delete({
      where: { id: timeLogId }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/time-logs`, 200, duration, { timeLogId })
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]/time-logs')

