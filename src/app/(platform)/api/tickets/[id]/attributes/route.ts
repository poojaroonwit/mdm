import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'

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
  logger.apiRequest('POST', `/api/tickets/${id}/attributes`, { userId: session.user.id })

    const bodySchema = z.object({
      name: z.string().min(1),
      displayName: z.string().optional(),
      type: z.string().optional(),
      value: z.string().optional().nullable(),
      jsonValue: z.any().optional().nullable(),
      isRequired: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

  const { name, displayName, type, value, jsonValue, isRequired, sortOrder } = bodyValidation.data

  // Check if ticket exists and user has access
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { spaces: true }
  })

  if (!ticket || ticket.deletedAt) {
    logger.warn('Ticket not found for attribute creation', { ticketId: id })
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get space ID from ticket
  const spaceId = ticket.spaces?.[0]?.spaceId
  if (!spaceId) {
    logger.warn('Ticket has no associated space', { ticketId: id })
    return NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 })
  }

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) {
    logger.warn('Access denied to create ticket attribute', { ticketId: id, userId: session.user.id })
    return accessResult.response
  }

  // Check if attribute already exists
  const existing = await db.ticketAttribute.findUnique({
    where: {
      ticketId_name: {
        ticketId: id,
        name
      }
    }
  })

  if (existing) {
    logger.warn('Ticket attribute already exists', { ticketId: id, attributeName: name })
    return NextResponse.json({ error: 'Attribute already exists' }, { status: 400 })
  }

  // Get max sort order if not provided
  let finalSortOrder = sortOrder
  if (finalSortOrder === undefined) {
    const maxSort = await db.ticketAttribute.findFirst({
      where: { ticketId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })
    finalSortOrder = maxSort ? maxSort.sortOrder + 1 : 0
  }

  const attribute = await db.ticketAttribute.create({
    data: {
      ticketId: id,
      name,
      displayName: displayName || name,
      type: type || 'TEXT',
      value: value || null,
      jsonValue: jsonValue || null,
      isRequired: isRequired || false,
      sortOrder: finalSortOrder
    }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('POST', `/api/tickets/${id}/attributes`, 201, duration, {
    attributeId: attribute.id,
    attributeName: name,
  })
  return NextResponse.json(attribute, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/attributes')

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
  logger.apiRequest('PUT', `/api/tickets/${id}/attributes`, { userId: session.user.id })

  const bodySchema = z.object({
    attributeId: z.string().uuid(),
    name: z.string().min(1).optional(),
    displayName: z.string().optional(),
    type: z.string().optional(),
    value: z.string().optional().nullable(),
    jsonValue: z.any().optional().nullable(),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { attributeId, displayName, type, value, jsonValue, isRequired, sortOrder } = bodyValidation.data

  // Check if ticket exists and user has access
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { spaces: true }
  })

  if (!ticket || ticket.deletedAt) {
    logger.warn('Ticket not found for attribute update', { ticketId: id })
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get space ID from ticket
  const spaceId = ticket.spaces?.[0]?.spaceId
  if (!spaceId) {
    logger.warn('Ticket has no associated space for attribute update', { ticketId: id })
    return NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 })
  }

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    const updateData: any = {}
    if (displayName !== undefined) updateData.displayName = displayName
    if (type !== undefined) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (jsonValue !== undefined) updateData.jsonValue = jsonValue
    if (isRequired !== undefined) updateData.isRequired = isRequired
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const attribute = await db.ticketAttribute.update({
      where: { id: attributeId },
      data: updateData
    })

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', `/api/tickets/${id}/attributes`, 200, duration, { attributeId })
  return NextResponse.json(attribute)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/tickets/[id]/attributes')

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
  logger.apiRequest('DELETE', `/api/tickets/${id}/attributes`, { userId: session.user.id })

  const querySchema = z.object({
    attributeId: z.string().uuid(),
  })

  const queryValidation = validateQuery(request, querySchema)
  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { attributeId } = queryValidation.data

  // Check if ticket exists and user has access
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { spaces: true }
  })

  if (!ticket || ticket.deletedAt) {
    logger.warn('Ticket not found for attribute deletion', { ticketId: id })
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get space ID from ticket
  const spaceId = ticket.spaces?.[0]?.spaceId
  if (!spaceId) {
    logger.warn('Ticket has no associated space for attribute deletion', { ticketId: id })
    return NextResponse.json({ error: 'Ticket has no associated space' }, { status: 404 })
  }

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

  await db.ticketAttribute.delete({
    where: { id: attributeId }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/tickets/${id}/attributes`, 200, duration, { attributeId })
  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]/attributes')

