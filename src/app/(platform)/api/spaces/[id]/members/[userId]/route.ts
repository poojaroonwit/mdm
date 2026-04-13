import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('PUT', `/api/spaces/${spaceId}/members/${userId}`, { userId: session.user.id })

    const bodySchema = z.object({
      role: z.enum(['owner', 'admin', 'member', 'viewer']),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { role } = bodyValidation.data

    // Check if current user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Check if current user has permission to update members (must be owner or admin)
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to update member', { spaceId, targetUserId: userId, userId: session.user.id })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent non-owners from promoting users to owner
    if (role === 'owner' && memberCheck.rows[0].role !== 'owner') {
      logger.warn('Non-owner attempted to promote user to owner', { spaceId, targetUserId: userId, userId: session.user.id })
      return NextResponse.json({ error: 'Only owners can promote users to owner' }, { status: 403 })
    }

    // Update member role
    const result = await query(`
      UPDATE space_members 
      SET role = $3, updated_at = NOW()
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId, role])

    if (result.rows.length === 0) {
      logger.warn('Member not found for update', { spaceId, targetUserId: userId })
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/spaces/${spaceId}/members/${userId}`, 200, duration, { role })
    return NextResponse.json({
      member: result.rows[0],
      message: 'Member role updated successfully'
    })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/spaces/[id]/members/[userId]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      userId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: spaceId, userId } = paramValidation.data
    logger.apiRequest('DELETE', `/api/spaces/${spaceId}/members/${userId}`, { userId: session.user.id })

    // Check if current user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Check if current user has permission to remove members (must be owner or admin)
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to remove member', { spaceId, targetUserId: userId, userId: session.user.id })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Prevent users from removing themselves
    if (userId === session.user.id) {
      logger.warn('User attempted to remove themselves', { spaceId, userId: session.user.id })
      return NextResponse.json({ error: 'Cannot remove yourself from space' }, { status: 400 })
    }

    // Check if target user is owner
    const targetMemberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, userId])

    if (targetMemberCheck.rows.length > 0 && targetMemberCheck.rows[0].role === 'owner') {
      logger.warn('Attempted to remove space owner', { spaceId, targetUserId: userId })
      return NextResponse.json({ error: 'Cannot remove space owner' }, { status: 400 })
    }

    // Remove member
    const result = await query(`
      DELETE FROM space_members 
      WHERE space_id = $1 AND user_id = $2
      RETURNING *
    `, [spaceId, userId])

    if (result.rows.length === 0) {
      logger.warn('Member not found for deletion', { spaceId, targetUserId: userId })
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/spaces/${spaceId}/members/${userId}`, 200, duration)
    return NextResponse.json({
      message: 'Member removed successfully'
    })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/spaces/[id]/members/[userId]')
