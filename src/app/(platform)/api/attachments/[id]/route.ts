import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
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
  
  const { id: attachmentId } = paramValidation.data
  logger.apiRequest('GET', `/api/attachments/${attachmentId}`, { userId: session.user.id })

  // Get attachment metadata using Prisma
  const attachment = await db.attachmentFile.findUnique({
    where: { id: attachmentId }
  })

  if (!attachment) {
    logger.warn('Attachment not found', { attachmentId })
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  const duration = Date.now() - startTime
  logger.apiResponse('GET', `/api/attachments/${attachmentId}`, 200, duration)
  return NextResponse.json({ attachment })
}

export const GET = withErrorHandling(getHandler, 'GET /api/attachments/[id]')

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
  
  const { id: attachmentId } = paramValidation.data
  logger.apiRequest('DELETE', `/api/attachments/${attachmentId}`, { userId: session.user.id })

    // Get attachment metadata using Prisma
    const attachment = await db.attachmentFile.findUnique({
      where: { id: attachmentId }
    })

  if (!attachment) {
    logger.warn('Attachment not found for deletion', { attachmentId })
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Get active storage connection
  const storageConnection = await db.storageConnection.findFirst({
    where: { 
      isActive: true,
      type: { in: ['minio', 's3', 'sftp', 'ftp'] }
    }
  })

  if (storageConnection) {
    // Initialize storage service
    const { AttachmentStorageService } = await import('@/lib/attachment-storage')
    const storageService = new AttachmentStorageService({
      provider: storageConnection.type as 'minio' | 's3' | 'sftp' | 'ftp',
      config: {
        [storageConnection.type]: storageConnection.config
      } as any
    })

    // Delete file from storage
    const deleteResult = await storageService.deleteFile(attachment.filePath)

    if (!deleteResult.success) {
      logger.error('Failed to delete file from storage', deleteResult.error, { attachmentId, filePath: attachment.filePath })
      // Continue with database deletion even if storage deletion fails
    }
  }

  // Delete attachment metadata from database using Prisma
  await db.attachmentFile.delete({
    where: { id: attachmentId }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/attachments/${attachmentId}`, 200, duration)
  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/attachments/[id]')