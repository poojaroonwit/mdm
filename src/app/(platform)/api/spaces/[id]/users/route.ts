import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
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
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceId}/users`, { userId: session.user.id })

    // Check if user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Get all users in this space
    const { rows } = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        NULL as avatar,
        sm.role as space_role,
        u.is_active
      FROM space_members sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1::uuid AND u.is_active = true
      ORDER BY u.name ASC
    `, [spaceId])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/users`, 200, duration, {
      userCount: rows.length
    })
    return NextResponse.json({ 
      users: rows,
      count: rows.length 
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/users')
