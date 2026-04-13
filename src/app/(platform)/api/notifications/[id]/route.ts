import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware';
import { query } from '@/lib/db';
import { UpdateNotificationRequest } from '@/types/notifications';
import { logger } from '@/lib/logger';
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation';
import { z } from 'zod';
import { addSecurityHeaders } from '@/lib/security-headers'

// GET /api/notifications/[id] - Get a specific notification
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

    const resolvedParams = await params;
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }));
    
    if (!paramValidation.success) {
      return paramValidation.response;
    }
    
    const { id } = paramValidation.data;
    logger.apiRequest('GET', `/api/notifications/${id}`, { userId: session.user.id });

    const fetchQuery = `
      SELECT 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
      FROM public.notifications 
      WHERE id = $1 AND user_id = $2
    `;

    const { rows } = await query(fetchQuery, [id, session.user.id]);

    if (rows.length === 0) {
      logger.warn('Notification not found', { notificationId: id, userId: session.user.id });
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', `/api/notifications/${id}`, 200, duration);
    return NextResponse.json(rows[0]);
}

export const GET = withErrorHandling(getHandler, 'GET /api/notifications/[id]');

// PATCH /api/notifications/[id] - Update a notification
async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

    const resolvedParams = await params;
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }));
    
    if (!paramValidation.success) {
      return paramValidation.response;
    }
    
    const { id } = paramValidation.data;
    logger.apiRequest('PATCH', `/api/notifications/${id}`, { userId: session.user.id });

    const bodySchema = z.object({
      status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
      read_at: z.string().datetime().optional().nullable(),
    });

    const bodyValidation = await validateBody(request, bodySchema);
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response);
    }

    const body: UpdateNotificationRequest = {
      ...bodyValidation.data,
      read_at: bodyValidation.data.read_at ?? undefined
    };

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (body.status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      updateValues.push(body.status);
      paramIndex++;
    }

    if (body.read_at !== undefined) {
      updateFields.push(`read_at = $${paramIndex}`);
      updateValues.push(body.read_at);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      logger.warn('No fields to update for notification', { notificationId: id });
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add user_id and id to the query
    updateValues.push(session.user.id, id);

    const updateQuery = `
      UPDATE public.notifications 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex + 1} AND user_id = $${paramIndex}
      RETURNING 
        id, user_id, type, priority, status, title, message, data, 
        action_url, action_label, expires_at, read_at, created_at, updated_at
    `;

    const { rows } = await query(updateQuery, updateValues);

    if (rows.length === 0) {
      logger.warn('Notification not found for update', { notificationId: id, userId: session.user.id });
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logger.apiResponse('PATCH', `/api/notifications/${id}`, 200, duration);
    return NextResponse.json(rows[0]);
}

export const PATCH = withErrorHandling(patchHandler, 'PATCH /api/notifications/[id]');

// DELETE /api/notifications/[id] - Delete a notification
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

    const resolvedParams = await params;
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }));
    
    if (!paramValidation.success) {
      return paramValidation.response;
    }
    
    const { id } = paramValidation.data;
    logger.apiRequest('DELETE', `/api/notifications/${id}`, { userId: session.user.id });

    const deleteQuery = `
      DELETE FROM public.notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const { rows } = await query(deleteQuery, [id, session.user.id]);

    if (rows.length === 0) {
      logger.warn('Notification not found for deletion', { notificationId: id, userId: session.user.id });
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logger.apiResponse('DELETE', `/api/notifications/${id}`, 200, duration);
    return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/notifications/[id]');
