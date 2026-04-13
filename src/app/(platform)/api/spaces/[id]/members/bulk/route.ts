import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('POST', `/api/spaces/${spaceId}/members/bulk`, { userId: session.user.id })

    const bodySchema = z.object({
      operation: z.enum(['change_role', 'remove', 'activate', 'deactivate', 'export']),
      userIds: z.array(commonSchemas.id).min(1),
      data: z.object({
        role: z.enum(['owner', 'admin', 'member', 'viewer']).optional(),
      }).optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { operation, userIds, data } = bodyValidation.data

    // Check if current user has permission to manage members
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
      logger.warn('Insufficient permissions for bulk operation', { spaceId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }))
    }

    let result: any = {}

    switch (operation) {
      case 'change_role':
        if (!data?.role) {
          logger.warn('Role missing for change_role operation', { spaceId, operation })
          return addSecurityHeaders(NextResponse.json({ error: 'Role is required for change_role operation' }, { status: 400 }))
        }
        
        // Update roles for selected users
        const updateResult = await query(`
          UPDATE space_members 
          SET role = $1, updated_at = NOW()
          WHERE space_id = $2::uuid AND user_id = ANY($3::uuid[])
          RETURNING user_id, role
        `, [data.role, spaceId, userIds])
        
        result = {
          operation: 'change_role',
          updated: updateResult.rows.length,
          role: data.role
        }
        break

      case 'remove':
        // Remove selected users from space
        const removeResult = await query(`
          DELETE FROM space_members 
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'remove',
          removed: removeResult.rows.length
        }
        break

      case 'activate':
        // Activate selected users (if they have an is_active field)
        const activateResult = await query(`
          UPDATE space_members 
          SET is_active = true, updated_at = NOW()
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'activate',
          activated: activateResult.rows.length
        }
        break

      case 'deactivate':
        // Deactivate selected users
        const deactivateResult = await query(`
          UPDATE space_members 
          SET is_active = false, updated_at = NOW()
          WHERE space_id = $1::uuid AND user_id = ANY($2::uuid[])
          RETURNING user_id
        `, [spaceId, userIds])
        
        result = {
          operation: 'deactivate',
          deactivated: deactivateResult.rows.length
        }
        break

      case 'export':
        // Get member details for export
        const exportResult = await query(`
          SELECT 
            sm.*,
            u.name as user_name,
            u.email as user_email,
            u.role as user_system_role,
            u.is_active,
            u.last_sign_in_at
          FROM space_members sm
          LEFT JOIN users u ON sm.user_id = u.id
          WHERE sm.space_id = $1::uuid AND sm.user_id = ANY($2::uuid[])
          ORDER BY u.name ASC
        `, [spaceId, userIds])
        
        result = {
          operation: 'export',
          members: exportResult.rows,
          count: exportResult.rows.length
        }
        break

      default:
        logger.warn('Invalid bulk operation', { spaceId, operation })
        return addSecurityHeaders(NextResponse.json({ error: 'Invalid operation' }, { status: 400 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/spaces/${spaceId}/members/bulk`, 200, duration, {
      operation,
      userCount: userIds.length,
    })
    return addSecurityHeaders(NextResponse.json({
      success: true,
      result
    }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Members Bulk API')
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/members/bulk')
