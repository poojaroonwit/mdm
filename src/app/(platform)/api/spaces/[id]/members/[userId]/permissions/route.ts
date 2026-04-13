import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceId}/members/${userId}/permissions`, { userId: session.user.id })

    // Check if current user has permission to view member permissions
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to view member permissions', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    // Get member permissions
    const permissions = await query(`
      SELECT permissions FROM member_permissions 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, userId])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/members/${userId}/permissions`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      permissions: permissions.rows[0]?.permissions || []
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Member Permissions API GET')
  }
}



export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/members/[userId]/permissions/route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }


    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('PUT', `/api/spaces/${spaceId}/members/${userId}/permissions`, { userId: session.user.id })

    const bodySchema = z.object({
      permissions: z.array(z.string()),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { permissions } = bodyValidation.data

    // Check if current user has permission to manage member permissions
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to update member permissions', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    // Check if target user is a member of the space
    const targetMemberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, userId])

    if (targetMemberCheck.rows.length === 0) {
      logger.warn('User is not a member of space', { spaceId, targetUserId: userId })
      return addSecurityHeaders(NextResponse.json({ error: 'User is not a member of this space' }, { status: 404 }))
    }

    // Prevent non-owners from modifying owner permissions
    if (targetMemberCheck.rows[0].role === 'owner' && memberCheck.rows[0].role !== 'owner') {
      logger.warn('Non-owner attempted to modify owner permissions', { spaceId, targetUserId: userId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Cannot modify owner permissions' }, { status: 403 }))
    }

    // Update or insert member permissions
    await query(`
      INSERT INTO member_permissions (space_id, user_id, permissions, updated_at)
      VALUES ($1::uuid, $2::uuid, $3, NOW())
      ON CONFLICT (space_id, user_id)
      DO UPDATE SET permissions = $3, updated_at = NOW()
    `, [spaceId, userId, permissions])

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/spaces/${spaceId}/members/${userId}/permissions`, 200, duration, {
      permissionCount: permissions.length
    })
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Permissions updated successfully'
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Member Permissions API PUT')
  }
}


export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/spaces/[id]/members/[userId]/permissions/route.ts')