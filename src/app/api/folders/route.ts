import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    space_id: commonSchemas.id.optional(),
    type: z.string().optional().default('data_model'),
  }))

  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { space_id: spaceId, type = 'data_model' } = queryValidation.data
  logger.apiRequest('GET', '/api/folders', { userId: session.user.id, spaceId, type })

  // Check space access only if a space_id was provided
  if (spaceId) {
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) {
      logger.warn('Access denied for folders', { spaceId, userId: session.user.id })
      return accessResult.response
    }
  }

  // Folder model doesn't exist in Prisma schema
  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/folders', 200, duration, { count: 0 })
  return NextResponse.json({ folders: [] })
}

export const GET = withErrorHandling(getHandler, 'GET /api/folders')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    type: z.string().optional().default('data_model'),
    space_id: commonSchemas.id,
    parent_id: commonSchemas.id.optional().nullable(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
  
  const { name, type = 'data_model', space_id, parent_id } = bodyValidation.data
  logger.apiRequest('POST', '/api/folders', { userId: session.user.id, name, space_id })

  // Check if user has access to the space (requireSpaceAccess checks member or owner)
  const accessResult = await requireSpaceAccess(space_id, session.user.id!)
  if (!accessResult.success) {
    logger.warn('Access denied for folder creation', { spaceId: space_id, userId: session.user.id })
    return accessResult.response
  }

  // Note: Additional role check (admin/owner) would need to be added to requireSpaceAccess
  // or checked separately if needed. For now, space access is sufficient.

  // Folder model doesn't exist in Prisma schema
  const duration = Date.now() - startTime
  logger.apiResponse('POST', '/api/folders', 501, duration)
  return NextResponse.json(
    { error: 'Folder model not implemented' },
    { status: 501 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST /api/folders')
