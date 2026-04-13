import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  
  let userId: string | null = null
  
  if (authResult.success) {
    userId = authResult.session.user.id
  } else {
    // Fall back to x-user-id header if auth fails
    userId = request.headers.get('x-user-id')
    if (!userId) return authResult.response
  }
  
  if (!userId) {
    return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      unreadOnly: z.string().transform((val) => val === 'true').optional(),
      limit: z.string().optional().transform((val) => parseInt(val || '50')).pipe(z.number().int().positive().max(100)).optional().default(50),
      offset: z.string().optional().transform((val) => parseInt(val || '0')).pipe(z.number().int().nonnegative()).optional().default(0),
    }))
    
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }
    
    const { unreadOnly = false, limit = 50, offset = 0 } = queryValidation.data
    logger.apiRequest('GET', '/api/files/notifications', { userId, unreadOnly, limit, offset })

    let whereClause = 'WHERE user_id = $1'
    let queryParams: any[] = [userId]

    if (unreadOnly) {
      whereClause += ' AND is_read = false'
    }

    // Get notifications
    const notificationsResult = await query(
      `SELECT 
        fn.id,
        fn.type,
        fn.title,
        fn.message,
        fn.file_id,
        fn.is_read,
        fn.action_url,
        fn.metadata,
        fn.created_at,
        af.file_name,
        af.mime_type
       FROM file_notifications fn
       LEFT JOIN attachment_files af ON fn.file_id = af.id
       ${whereClause}
       ORDER BY fn.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    )

    // Get unread count
    const unreadCountResult = await query(
      'SELECT COUNT(*) as count FROM file_notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/notifications', 200, duration, { 
      count: notificationsResult.rows.length,
      unreadCount: parseInt((unreadCountResult.rows[0] as any).count)
    })
  return addSecurityHeaders(NextResponse.json({
    notifications: notificationsResult.rows,
    unreadCount: parseInt((unreadCountResult.rows[0] as any).count)
  }))
}













export const GET = withErrorHandling(getHandler, 'GET /api/files/notifications')

async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  
  let userId: string | null = null
  
  if (authResult.success) {
    userId = authResult.session.user.id
  } else {
    userId = request.headers.get('x-user-id')
    if (!userId) return authResult.response
  }
  
  if (!userId) {
    return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      notificationIds: z.array(commonSchemas.id).optional(),
      markAllAsRead: z.boolean().optional().default(false),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { notificationIds, markAllAsRead = false } = bodyValidation.data
    logger.apiRequest('PUT', '/api/files/notifications', { userId, markAllAsRead, notificationIdsCount: notificationIds?.length || 0 })

    if (markAllAsRead) {
      // Mark all notifications as read
      await query(
        'UPDATE file_notifications SET is_read = true WHERE user_id = $1',
        [userId]
      )
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',')
      await query(
        `UPDATE file_notifications 
         SET is_read = true 
         WHERE user_id = $1 AND id IN (${placeholders})`,
        [userId, ...notificationIds]
      )
    } else {
      logger.warn('Invalid request for file notifications update', { userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Invalid request' }, { status: 400 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/files/notifications', 200, duration)
  return addSecurityHeaders(NextResponse.json({ success: true }))
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/files/notifications')













async function deleteHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  
  let userId: string | null = null
  
  if (authResult.success) {
    userId = authResult.session.user.id
  } else {
    userId = request.headers.get('x-user-id')
    if (!userId) return authResult.response
  }
  
  if (!userId) {
    return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      notificationIds: z.array(commonSchemas.id).optional(),
      deleteAll: z.boolean().optional().default(false),
    }))
    
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { notificationIds, deleteAll = false } = bodyValidation.data
    logger.apiRequest('DELETE', '/api/files/notifications', { userId, deleteAll, notificationIdsCount: notificationIds?.length || 0 })

    if (deleteAll) {
      // Delete all notifications
      await query(
        'DELETE FROM file_notifications WHERE user_id = $1',
        [userId]
      )
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Delete specific notifications
      const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',')
      await query(
        `DELETE FROM file_notifications 
         WHERE user_id = $1 AND id IN (${placeholders})`,
        [userId, ...notificationIds]
      )
    } else {
      logger.warn('Invalid request for file notifications deletion', { userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Invalid request' }, { status: 400 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', '/api/files/notifications', 200, duration)
  return addSecurityHeaders(NextResponse.json({ success: true }))
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/files/notifications')









