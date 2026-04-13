import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    spaceId: commonSchemas.id.optional(),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
  
  const { spaceId } = queryValidation.data
  logger.apiRequest('GET', '/api/attachments', { userId: session.user.id, spaceId })

  // Check if user has access to this space
  if (spaceId) {
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) {
      logger.warn('Space not found or access denied for attachments', { spaceId, userId: session.user.id })
      return accessResult.response
    }
  }

  // Get attachments using Prisma
  const attachments = await db.attachmentFile.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/attachments', 200, duration, { count: attachments.length })
  return NextResponse.json({ attachments })
}

export const GET = withErrorHandling(getHandler, 'GET /api/attachments')
