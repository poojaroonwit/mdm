import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../../middleware'

async function postHandler(request: NextRequest) {
    // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const body = await request.json()
    const { 
      operation, 
      ticketIds = body.ticket_ids, 
      data 
    } = body
    const assigneeId = data?.assigneeId || data?.assignee_id

    if (!operation || !ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'Operation and ticketIds array are required' },
        { status: 400 }
      )
    }

    // Check permission for bulk operations
    const permission = await checkPermission({
      resource: 'tickets',
      action: operation === 'delete' ? 'delete' : 'update',
      spaceId: null, // Bulk operations may span multiple spaces
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let result: any
    let affectedCount = 0

    switch (operation) {
      case 'delete':
        // Soft delete tickets
        result = await query(
          `UPDATE tickets 
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = ANY($1::uuid[])
           AND deleted_at IS NULL
           AND EXISTS (
             SELECT 1 FROM ticket_spaces ts
             WHERE ts.ticket_id = tickets.id
             AND EXISTS (
               SELECT 1 FROM spaces s
               WHERE s.id = ts.space_id
               AND (s.created_by = $2 OR EXISTS (
                 SELECT 1 FROM space_members sm
                 WHERE sm.space_id = s.id AND sm.user_id = $2
               ))
             )
           )`,
          [ticketIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status operation' },
            { status: 400 }
          )
        }

        result = await query(
          `UPDATE tickets 
           SET status = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[])
           AND deleted_at IS NULL
           AND EXISTS (
             SELECT 1 FROM ticket_spaces ts
             WHERE ts.ticket_id = tickets.id
             AND EXISTS (
               SELECT 1 FROM spaces s
               WHERE s.id = ts.space_id
               AND (s.created_by = $3 OR EXISTS (
                 SELECT 1 FROM space_members sm
                 WHERE sm.space_id = s.id AND sm.user_id = $3
               ))
             )
           )`,
          [data.status, ticketIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      case 'update_priority':
        if (!data?.priority) {
          return NextResponse.json(
            { error: 'Priority is required for update_priority operation' },
            { status: 400 }
          )
        }

        result = await query(
          `UPDATE tickets 
           SET priority = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[])
           AND deleted_at IS NULL
           AND EXISTS (
             SELECT 1 FROM ticket_spaces ts
             WHERE ts.ticket_id = tickets.id
             AND EXISTS (
               SELECT 1 FROM spaces s
               WHERE s.id = ts.space_id
               AND (s.created_by = $3 OR EXISTS (
                 SELECT 1 FROM space_members sm
                 WHERE sm.space_id = s.id AND sm.user_id = $3
               ))
             )
           )`,
          [data.priority, ticketIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      case 'assign':
        if (!data?.assigneeId) {
          return NextResponse.json(
            { error: 'assigneeId is required for assign operation' },
            { status: 400 }
          )
        }

        // Remove existing assignments and add new ones
        await query(
          `DELETE FROM ticket_assignees 
           WHERE ticket_id = ANY($1::uuid[])`,
          [ticketIds]
        )

        // Insert new assignments
        for (const ticketId of ticketIds) {
          await query(
            `INSERT INTO ticket_assignees (id, ticket_id, user_id, created_at)
             VALUES (gen_random_uuid(), $1, $2, NOW())
             ON CONFLICT (ticket_id, user_id) DO NOTHING`,
            [ticketId, assigneeId]
          )
        }

        affectedCount = ticketIds.length
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    // Log API request
    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/tickets/bulk',
      200,
      undefined
    )

  return NextResponse.json({
    success: true,
    affected: affectedCount,
    message: `Successfully ${operation}d ${affectedCount} ticket(s)`,
  })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/tickets/bulk')

