import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET: Get all spaces associated with a data model
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))

    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }

    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/data-models/${id}/spaces`, { userId: session.user.id })

    const { rows: spaces } = await query(`
      SELECT s.id, s.name, s.slug, dms.created_at
      FROM spaces s
      JOIN data_model_spaces dms ON dms.space_id = s.id
      WHERE dms.data_model_id = $1::uuid AND s.deleted_at IS NULL
      ORDER BY s.name
    `, [id])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-models/${id}/spaces`, 200, duration, { count: spaces.length })
    return addSecurityHeaders(NextResponse.json({ spaces }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Model Spaces API GET')
  }
}

// PUT: Update space associations for a data model


export const GET = withErrorHandling(getHandler, 'GET /api/data-models/[id]/spaces/route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }


    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))

    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }

    const { id } = paramValidation.data

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      space_ids: z.array(commonSchemas.id),
    }))

    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { space_ids } = bodyValidation.data
    logger.apiRequest('PUT', `/api/data-models/${id}/spaces`, { userId: session.user.id, spaceIdsCount: space_ids.length })

    // Check if user has access to all spaces
    if (space_ids.length > 0) {
      const placeholders = space_ids.map((_, i) => `$${i + 1}`).join(',')
      const { rows: spaceAccess } = await query(
        `SELECT space_id, role FROM space_members WHERE space_id IN (${placeholders}) AND user_id = $${space_ids.length + 1}::uuid`,
        [...space_ids, session.user.id]
      )

      if (spaceAccess.length !== space_ids.length) {
        logger.warn('Access denied to one or more spaces during data model space update', { dataModelId: id, spaceIds: space_ids, userId: session.user.id })
        return addSecurityHeaders(NextResponse.json({ error: 'Access denied to one or more spaces' }, { status: 403 }))
      }
    }

    // Remove all existing associations
    await query(
      'DELETE FROM data_model_spaces WHERE data_model_id = $1::uuid',
      [id]
    )

    // Add new associations
    for (const spaceId of space_ids) {
      await query(
        'INSERT INTO data_model_spaces (data_model_id, space_id) VALUES ($1::uuid, $2::uuid)',
        [id, spaceId]
      )
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/data-models/${id}/spaces`, 200, duration, { spaceIdsCount: space_ids.length })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Data Model Spaces API PUT')
  }
}


export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/data-models/[id]/spaces/route.ts')