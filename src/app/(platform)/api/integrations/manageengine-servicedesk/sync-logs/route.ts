import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Get sync activity logs
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const space_id = searchParams.get('space_id')
  const ticket_id = searchParams.get('ticket_id')
  const start_date = searchParams.get('start_date')
  const end_date = searchParams.get('end_date')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!space_id) {
    return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let queryStr = `
    SELECT 
      id, ticket_id, sync_type, event_type, success, details, error_message, created_at
    FROM servicedesk_sync_logs
    WHERE space_id = $1::uuid
  `
  const params: any[] = [space_id]
  let paramIndex = 2

  if (ticket_id) {
    queryStr += ` AND ticket_id = $${paramIndex}::uuid`
    params.push(ticket_id)
    paramIndex++
  }

  if (start_date) {
    queryStr += ` AND created_at >= $${paramIndex}`
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    queryStr += ` AND created_at <= $${paramIndex}`
    params.push(end_date)
    paramIndex++
  }

  queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)

  const { rows } = await query(queryStr, params)

  // Get total count for pagination
  let countQuery = `SELECT COUNT(*) as total FROM servicedesk_sync_logs WHERE space_id = $1::uuid`
  const countParams: any[] = [space_id]
  let countParamIndex = 2

  if (ticket_id) {
    countQuery += ` AND ticket_id = $${countParamIndex}::uuid`
    countParams.push(ticket_id)
    countParamIndex++
  }

  if (start_date) {
    countQuery += ` AND created_at >= $${countParamIndex}`
    countParams.push(start_date)
    countParamIndex++
  }

  if (end_date) {
    countQuery += ` AND created_at <= $${countParamIndex}`
    countParams.push(end_date)
  }

  const { rows: countRows } = await query(countQuery, countParams)
  const total = parseInt(countRows[0]?.total || '0')

  return NextResponse.json({
    logs: rows,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + limit < total
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/sync-logs')
