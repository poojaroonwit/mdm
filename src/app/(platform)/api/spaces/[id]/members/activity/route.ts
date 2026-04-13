import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(
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
    logger.apiRequest('GET', `/api/spaces/${spaceId}/members/activity`, { userId: session.user.id })

    const querySchema = z.object({
      days: z.string().optional().transform((val) => val ? parseInt(val) : 30).pipe(z.number().int().positive().max(365)),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { days } = queryValidation.data

    // Check if user has access to this space
    const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1 AND user_id = $2
    `, [spaceId, session.user.id])

    if (memberCheck.rows.length === 0) {
      logger.warn('Access denied to member activity', { spaceId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Access denied' }, { status: 403 }))
    }

    // Get member activity data
    const activityData = await query(`
      SELECT 
        sm.user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar,
        sm.role as space_role,
        u.last_sign_in_at,
        u.is_active,
        COUNT(DISTINCT DATE(u.last_sign_in_at)) as active_days,
        MAX(u.last_sign_in_at) as last_activity
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
        AND u.last_sign_in_at >= NOW() - INTERVAL '${days} days'
      GROUP BY sm.user_id, u.name, u.email, u.avatar, sm.role, u.last_sign_in_at, u.is_active
      ORDER BY last_activity DESC NULLS LAST
    `, [spaceId])

    // Get activity statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(CASE WHEN u.is_active THEN 1 END) as active_members,
        COUNT(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_activity,
        COUNT(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_activity,
        AVG(CASE WHEN u.last_sign_in_at >= NOW() - INTERVAL '${days} days' 
            THEN EXTRACT(EPOCH FROM (NOW() - u.last_sign_in_at))/3600 
            END) as avg_hours_since_activity
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
    `, [spaceId])

    // Get daily activity for chart
    const dailyActivity = await query(`
      SELECT 
        DATE(u.last_sign_in_at) as activity_date,
        COUNT(DISTINCT u.id) as active_users
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1
        AND u.last_sign_in_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(u.last_sign_in_at)
      ORDER BY activity_date DESC
    `, [spaceId])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/members/activity`, 200, duration, {
      activityCount: activityData.rows.length,
      period: days,
    })
    return addSecurityHeaders(NextResponse.json({
      activity: activityData.rows,
      statistics: stats.rows[0],
      dailyActivity: dailyActivity.rows,
      period: days
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Members Activity API GET')
  }
}



export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/members/activity/route.ts')
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
    logger.apiRequest('POST', `/api/spaces/${spaceId}/members/activity`, { userId: session.user.id })

    const bodySchema = z.object({
      action: z.string().optional(),
      metadata: z.any().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { action, metadata } = bodyValidation.data

    // Update user's last activity
    await query(`
      UPDATE users 
      SET last_sign_in_at = NOW()
      WHERE id = $1
    `, [session.user.id])

    // Log activity if needed
    if (action) {
      await query(`
        INSERT INTO user_activities (user_id, space_id, action, metadata, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [session.user.id, spaceId, action, JSON.stringify(metadata || {})])
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/spaces/${spaceId}/members/activity`, 200, duration, { action })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Members Activity API POST')
  }
}


export const POST = withErrorHandling(postHandler, 'POST POST /api/spaces/[id]/members/activity/route.ts')