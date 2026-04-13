import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'

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
    logger.apiRequest('GET', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const comments = await db.ticketComment.findMany({
      where: {
        ticketId: id,
        deletedAt: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/tickets/${id}/comments`, 200, duration, {
      commentCount: comments.length
    })
    return NextResponse.json({ comments })
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]/comments')

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
    logger.apiRequest('POST', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const bodySchema = z.object({
      content: z.string().min(1),
      metadata: z.any().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { content, metadata } = bodyValidation.data

    // Check if ticket exists and user has access
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        spaces: {
          include: {
            space: true
          }
        }
      }
    })

    if (!ticket || ticket.deletedAt) {
      logger.warn('Ticket not found for comment', { ticketId: id })
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Check access - user must have access to at least one space associated with the ticket
    const spaceId = ticket.spaces?.[0]?.spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    const comment = await db.ticketComment.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        content,
        metadata: metadata || {}
      },
      include: {
        author: {
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
    logger.apiResponse('POST', `/api/tickets/${id}/comments`, 201, duration, {
      commentId: comment.id
    })
    return NextResponse.json(comment, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/comments')

async function putHandler(
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
    logger.apiRequest('PUT', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const querySchema = z.object({
      commentId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { commentId } = queryValidation.data

    const bodySchema = z.object({
      content: z.string().min(1),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { content } = bodyValidation.data

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || comment.userId !== session.user.id) {
      logger.warn('Comment not found or unauthorized', { ticketId: id, commentId, userId: session.user.id })
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    const updated = await db.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
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
    logger.apiResponse('PUT', `/api/tickets/${id}/comments`, 200, duration, { commentId })
    return NextResponse.json(updated)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/tickets/[id]/comments')

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
    logger.apiRequest('DELETE', `/api/tickets/${id}/comments`, { userId: session.user.id })

    const querySchema = z.object({
      commentId: z.string().uuid(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { commentId } = queryValidation.data

    const comment = await db.ticketComment.findUnique({
      where: { id: commentId }
    })

    if (!comment || (comment.userId !== session.user.id)) {
      logger.warn('Comment not found or unauthorized for deletion', { ticketId: id, commentId, userId: session.user.id })
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 })
    }

    // Soft delete
    await db.ticketComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/tickets/${id}/comments`, 200, duration, { commentId })
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]/comments')

