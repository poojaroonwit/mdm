import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../middleware'
import { parsePaginationParams, createPaginationResponse, buildPaginationClause } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { parseFilterParams, buildFilterClause, buildSearchClause } from '@/shared/lib/api/filtering'

async function getHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId')
  const searchQuery = searchParams.get('search')

  // Parse pagination
  const { page, limit, offset } = parsePaginationParams(request)

  // Parse sorting
  const { sortBy, sortOrder } = parseSortParams(request)

  // Parse filters
  const filters = parseFilterParams(request, ['status', 'priority', 'assigneeId'])

  // Check permission
  const permission = await checkPermission({
    resource: 'tickets',
    action: 'read',
    spaceId: spaceId || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Build query with space filtering
  let whereConditions = ['t.deleted_at IS NULL']
  const queryParams: any[] = []
  let paramIndex = 1

  // Space filtering - if spaceId provided, filter by it; otherwise show all accessible spaces
  if (spaceId) {
    whereConditions.push(`EXISTS (
        SELECT 1 FROM ticket_spaces ts 
        WHERE ts.ticket_id = t.id 
        AND ts.space_id::text = $${paramIndex}
      )`)
    queryParams.push(spaceId)
    paramIndex++
  } else {
    // Get all spaces user has access to
    const userSpaces = await query(
      `SELECT id FROM spaces 
         WHERE (created_by::text = $1 OR id IN (
           SELECT space_id FROM space_members WHERE user_id::text = $1
         )) AND deleted_at IS NULL`,
      [session.user.id]
    )

    if (userSpaces.rows.length > 0) {
      const spaceIds = userSpaces.rows.map((r: any) => r.id)
      whereConditions.push(`EXISTS (
          SELECT 1 FROM ticket_spaces ts 
          WHERE ts.ticket_id = t.id 
          AND ts.space_id::text = ANY($${paramIndex})
        )`)
      queryParams.push(spaceIds)
      paramIndex++
    } else {
      // User has no spaces, return empty
      return NextResponse.json({ tickets: [], total: 0, page, limit })
    }
  }

  // Apply filters
  if (Object.keys(filters).length > 0) {
    const filterClause = buildFilterClause(filters, 't')
    if (filterClause.clause) {
      // Handle special case for assigneeId (needs EXISTS subquery)
      if (filters.assigneeId) {
        whereConditions.push(`EXISTS (
            SELECT 1 FROM ticket_assignees ta 
            WHERE ta.ticket_id = t.id 
            AND ta.user_id::text = $${paramIndex}
          )`)
        queryParams.push(filters.assigneeId)
        paramIndex++
      }

      // Handle status and priority filters
      if (filters.status) {
        whereConditions.push(`t.status = $${paramIndex}`)
        queryParams.push(filters.status)
        paramIndex++
      }

      if (filters.priority) {
        whereConditions.push(`t.priority = $${paramIndex}`)
        queryParams.push(filters.priority)
        paramIndex++
      }
    }
  }

  // Apply search
  if (searchQuery) {
    const searchClause = buildSearchClause(searchQuery, ['t.title', 't.description'], '', paramIndex)
    if (searchClause.clause) {
      whereConditions.push(searchClause.clause)
      queryParams.push(...searchClause.params)
      paramIndex = searchClause.paramIndex
    }
  }

  const whereClause = whereConditions.join(' AND ')

  // Get tickets with pagination
  const ticketsQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.start_date,
        t.estimate,
        t.created_at,
        t.updated_at,
        json_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        )) FILTER (WHERE u.id IS NOT NULL) as assignees,
        json_agg(DISTINCT jsonb_build_object(
          'space', jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'slug', s.slug
          )
        )) FILTER (WHERE s.id IS NOT NULL) as spaces
      FROM tickets t
      LEFT JOIN ticket_assignees ta ON ta.ticket_id = t.id
      LEFT JOIN users u ON u.id = ta.user_id
      LEFT JOIN ticket_spaces ts2 ON ts2.ticket_id = t.id
      LEFT JOIN spaces s ON s.id = ts2.space_id
      WHERE ${whereClause}
      GROUP BY t.id, t.title, t.description, t.status, t.priority, t.due_date, t.start_date, t.estimate, t.created_at, t.updated_at
      ${buildOrderByClause(sortBy, sortOrder || 'desc', { field: 'created_at', order: 'desc' }, 't')}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
  queryParams.push(limit, offset)

  const ticketsResult = await query(ticketsQuery, queryParams)

  // Get total count (remove pagination params)
  const countParams = queryParams.filter((_, idx) => idx < queryParams.length - 2)
  const countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tickets t
      WHERE ${whereClause}
    `
  const countResult = await query(countQuery, countParams)
  const total = parseInt(countResult.rows[0]?.total || '0')

  // Format tickets
  const tickets = ticketsResult.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    startDate: row.start_date,
    estimate: row.estimate,
    assignee: row.assignees?.[0] || null,
    assignees: row.assignees || [],
    spaces: row.spaces || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  // Log API request
  await logAPIRequest(
    session.user.id,
    'GET',
    '/api/v1/tickets',
    200,
    spaceId || undefined
  )

  const response = createPaginationResponse(tickets, total, page, limit)
  return NextResponse.json({
    tickets: response.data,
    ...response,
  })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/v1/tickets')
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
    title,
    description,
    status,
    priority,
    dueDate,
    startDate,
    estimate,
    spaceId = body.space_id,
    assignedTo = body.assigned_to,
  } = body

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!spaceId) {
    return NextResponse.json({ error: 'spaceId is required' }, { status: 400 })
  }

  // Check permission
  const permission = await checkPermission({
    resource: 'tickets',
    action: 'create',
    spaceId,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Create ticket
  const result = await query(
    `INSERT INTO tickets (
        id, title, description, status, priority, due_date, start_date, estimate,
        created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING id`,
    [
      title,
      description || null,
      status || 'BACKLOG',
      priority || 'MEDIUM',
      dueDate ? new Date(dueDate) : null,
      startDate ? new Date(startDate) : null,
      estimate || null,
      session.user.id,
    ]
  )

  const ticketId = result.rows[0].id

  // Create space association
  await query(
    `INSERT INTO ticket_spaces (id, ticket_id, space_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, NOW())`,
    [ticketId, spaceId]
  )

  // Create assignee if provided
  if (assignedTo) {
    await query(
      `INSERT INTO ticket_assignees (id, ticket_id, user_id, role, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'ASSIGNEE', NOW())`,
      [ticketId, assignedTo]
    )
  }

  await logAPIRequest(
    session.user.id,
    'POST',
    '/api/v1/tickets',
    201,
    spaceId
  )

  return NextResponse.json(
    { id: ticketId, message: 'Ticket created successfully' },
    { status: 201 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/tickets')
