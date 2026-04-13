import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { validateParams, validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { storeUploadedFile } from '@/lib/upload-storage'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('GET', `/api/tickets/${id}/attachments`, { userId: session.user.id })

  const attachments = await db.ticketAttachment.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'desc' }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('GET', `/api/tickets/${id}/attachments`, 200, duration, {
    attachmentCount: attachments.length
  })
  return NextResponse.json(createSuccessResponse({ attachments }))
}

export const GET = withErrorHandling(getHandler, 'GET /api/tickets/[id]/attachments')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('POST', `/api/tickets/${id}/attachments`, { userId: session.user.id })

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(createErrorResponse('File is required', 'VALIDATION_ERROR'), { status: 400 })
  }

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: { spaces: true }
  })

  if (!ticket || ticket.deletedAt) {
    logger.warn('Ticket not found for attachment upload', { ticketId: id })
    return NextResponse.json(createErrorResponse('Ticket not found', 'NOT_FOUND'), { status: 404 })
  }

  const spaceId = ticket.spaces?.[0]?.spaceId
  if (spaceId) {
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response
  }

  const fileExtension = (file.name.split('.').pop() || 'bin').toLowerCase()
  const uniqueFileName = `${uuidv4()}.${fileExtension}`

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileUrl = await storeUploadedFile(`tickets/${id}`, uniqueFileName, fileBuffer, file.type || 'application/octet-stream')

  const attachment = await db.ticketAttachment.create({
    data: {
      ticketId: id,
      fileName: file.name,
      filePath: fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: session.user.id
    }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('POST', `/api/tickets/${id}/attachments`, 201, duration, {
    attachmentId: attachment.id,
    fileName: file.name,
    fileSize: file.size,
  })
  return NextResponse.json(createSuccessResponse({ attachment }), { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/tickets/[id]/attachments')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('DELETE', `/api/tickets/${id}/attachments`, { userId: session.user.id })

  const querySchema = z.object({ attachmentId: z.string().uuid() })
  const queryValidation = validateQuery(request, querySchema)
  if (!queryValidation.success) return queryValidation.response
  const { attachmentId } = queryValidation.data

  const attachment = await db.ticketAttachment.findUnique({ where: { id: attachmentId } })
  if (!attachment || attachment.ticketId !== id) {
    logger.warn('Attachment not found', { ticketId: id, attachmentId })
    return NextResponse.json(createErrorResponse('Attachment not found', 'NOT_FOUND'), { status: 404 })
  }

  const ticket = await db.ticket.findUnique({ where: { id } })
  if (attachment.uploadedBy !== session.user.id && ticket?.createdBy !== session.user.id) {
    logger.warn('Unauthorized attachment deletion attempt', { ticketId: id, attachmentId, userId: session.user.id })
    return NextResponse.json(createErrorResponse('Unauthorized', 'FORBIDDEN'), { status: 403 })
  }

  await db.ticketAttachment.delete({ where: { id: attachmentId } })

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/tickets/${id}/attachments`, 200, duration, { attachmentId })
  return NextResponse.json(createSuccessResponse({ deleted: true }))
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/tickets/[id]/attachments')
