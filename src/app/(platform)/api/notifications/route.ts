import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware';
import { query } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { NotificationFilters, CreateNotificationRequest } from '@/types/notifications';
import { logger } from '@/lib/logger';
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';

// GET /api/notifications - Get notifications for the current user
async function getHandler(request: NextRequest) {
  const startTime = Date.now();
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

  logger.apiRequest('GET', '/api/notifications', { userId: session.user.id });

  const querySchema = z.object({
    type: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 50).pipe(z.number().int().positive().max(100)),
    offset: z.string().optional().transform((val) => val ? parseInt(val) : 0).pipe(z.number().int().nonnegative()),
    search: z.string().optional(),
  });

  const queryValidation = validateQuery(request, querySchema);
  if (!queryValidation.success) {
    return queryValidation.response;
  }

  const filters: NotificationFilters = {
    type: queryValidation.data.type as any,
    status: queryValidation.data.status as any,
    priority: queryValidation.data.priority as any,
    limit: queryValidation.data.limit,
    offset: queryValidation.data.offset,
    search: queryValidation.data.search,
  };

  // Build the query
  let whereConditions = ['user_id = $1::uuid'];
  let queryParams: any[] = [session.user.id];
  let paramIndex = 2;

  if (filters.type) {
    whereConditions.push(`type = $${paramIndex}`);
    queryParams.push(filters.type);
    paramIndex++;
  }

  if (filters.status) {
    whereConditions.push(`status = $${paramIndex}`);
    queryParams.push(filters.status);
    paramIndex++;
  }

  if (filters.priority) {
    whereConditions.push(`priority = $${paramIndex}`);
    queryParams.push(filters.priority);
    paramIndex++;
  }

  if (filters.search) {
    whereConditions.push(`(title ILIKE $${paramIndex} OR message ILIKE $${paramIndex})`);
    queryParams.push(`%${filters.search}%`);
    paramIndex++;
  }

  // Add expiration filter
  whereConditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

  const whereClause = whereConditions.join(' AND ');

  // Get notifications
  const notificationsQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

  queryParams.push(filters.limit, filters.offset);

  const { rows: notifications } = await query(notificationsQuery, queryParams);

  // Get total count
  const countQuery = `
      SELECT COUNT(*) as total
      FROM public.notifications 
      WHERE ${whereClause}
    `;

  const { rows: countRows } = await query(countQuery, queryParams.slice(0, -2));
  const total = parseInt(countRows[0].total);

  // Get unread count
  const unreadCountQuery = `
      SELECT COUNT(*) as unread
      FROM public.notifications 
      WHERE user_id = $1::uuid AND status = 'UNREAD' AND (expires_at IS NULL OR expires_at > NOW())
    `;

  const { rows: unreadRows } = await query(unreadCountQuery, [session.user.id]);
  const unreadCount = parseInt(unreadRows[0].unread);

  const duration = Date.now() - startTime;
  logger.apiResponse('GET', '/api/notifications', 200, duration, {
    notificationCount: notifications.length,
    total,
    unreadCount,
  });
  return NextResponse.json({
    notifications,
    total,
    unreadCount,
    hasMore: (filters.offset || 0) + (filters.limit || 50) < total,
  });
}

export const GET = withErrorHandling(getHandler, 'GET /api/notifications');

// POST /api/notifications - Create a new notification
async function postHandler(request: NextRequest) {
  const startTime = Date.now();
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

  // Check system settings
  const settingsRecord = await prisma.systemSetting.findUnique({
    where: { key: 'global' }
  });

  if (settingsRecord) {
    try {
      const settings = JSON.parse(settingsRecord.value);
      if (settings.enableNotifications === false) {
        return NextResponse.json(
          { error: 'Notifications are currently disabled' },
          { status: 403 }
        );
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  logger.apiRequest('POST', '/api/notifications', { userId: session.user.id });

  const bodySchema = z.object({
    user_id: commonSchemas.id.optional(),
    userId: commonSchemas.id.optional(),
    type: z.string().min(1),
    title: z.string().min(1),
    message: z.string().min(1),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    data: z.any().optional(),
    action_url: z.string().url().optional(),
    actionUrl: z.string().url().optional(),
    action_label: z.string().optional(),
    actionLabel: z.string().optional(),
    expires_at: z.string().datetime().optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
  });

  const bodyValidation = await validateBody(request, bodySchema);
  if (!bodyValidation.success) {
    return bodyValidation.response;
  }

  const {
    user_id,
    userId,
    type,
    title,
    message,
    priority = 'MEDIUM',
    data,
    action_url,
    actionUrl,
    action_label,
    actionLabel,
    expires_at,
    expiresAt,
  } = bodyValidation.data;

  const finalUserId = user_id || userId;
  const finalActionUrl = action_url || actionUrl;
  const finalActionLabel = action_label || actionLabel;
  const finalExpiresAt = expires_at || expiresAt;

  if (!finalUserId) {
    return NextResponse.json({ error: 'user_id or userId is required' }, { status: 400 });
  }

  // Check if user has permission to create notifications for this user
  // For now, users can only create notifications for themselves
  if (finalUserId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    logger.warn('Insufficient permissions to create notification', { targetUserId: finalUserId, userId: session.user.id });
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Create notification using the database function
  const createNotificationQuery = `
      SELECT create_notification($1, $2, $3, $4, $5, $6, $7, $8, $9) as notification_id
    `;

  const { rows } = await query(createNotificationQuery, [
    finalUserId,
    type,
    title,
    message,
    priority,
    data ? JSON.stringify(data) : null,
    finalActionUrl || null,
    finalActionLabel || null,
    finalExpiresAt || null,
  ]);

  const notificationId = rows[0].notification_id;

  // Fetch the created notification
  const fetchQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE id = $1
    `;

  const { rows: notificationRows } = await query(fetchQuery, [notificationId]);

  const duration = Date.now() - startTime;
  logger.apiResponse('POST', '/api/notifications', 201, duration, {
    notificationId: notificationRows[0].id,
    type,
  });
  return NextResponse.json(notificationRows[0], { status: 201 });
}

export const POST = withErrorHandling(postHandler, 'POST /api/notifications');
