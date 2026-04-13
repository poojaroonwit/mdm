import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
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
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceId}/members`, { userId: session.user.id })

    // Check if user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Get space members
    const members = await query(`
      SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_system_role,
        u.is_active
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1::uuid
      ORDER BY sm.role DESC, u.name ASC
    `, [spaceId])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/members`, 200, duration, {
      memberCount: members.rows.length
    })
    return NextResponse.json({
      members: members.rows
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/members')

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
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('POST', `/api/spaces/${spaceId}/members`, { userId: session.user.id })

    const bodySchema = z.object({
      user_id: z.string().uuid(),
      role: z.enum(['owner', 'admin', 'member', 'viewer']).optional().default('member'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { user_id, role } = bodyValidation.data

    // Check if current user has permission to add members (must be owner or admin)
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Additional check: verify user is owner or admin
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions to add space member', { spaceId, userId: session.user.id })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user exists
    const userCheck = await query(`
      SELECT id, name, email FROM users WHERE id = $1::uuid AND is_active = true
    `, [user_id])

    if (userCheck.rows.length === 0) {
      logger.warn('User not found for space membership', { spaceId, targetUserId: user_id })
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Add user to space
    const result = await query(`
      INSERT INTO space_members (space_id, user_id, role)
      VALUES ($1::uuid, $2::uuid, $3)
      ON CONFLICT (space_id, user_id) 
      DO UPDATE SET role = $3, updated_at = NOW()
      RETURNING *
    `, [spaceId, user_id, role])

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/spaces/${spaceId}/members`, 201, duration, {
      memberUserId: user_id,
      role,
    })
    return NextResponse.json({
      member: result.rows[0],
      user: userCheck.rows[0],
      message: 'Member added successfully'
    }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/members')
