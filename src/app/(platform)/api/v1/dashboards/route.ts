import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { buildSearchClause } from '@/shared/lib/api/filtering'

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
    const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
    const searchQuery = searchParams.get('search')
    
    // Parse pagination
    const { page, limit, offset } = parsePaginationParams(request)
    
    // Parse sorting
    const { sortBy, sortOrder } = parseSortParams(request)

    const permission = await checkPermission({
      resource: 'dashboards',
      action: 'read',
      spaceId: spaceId || null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let whereConditions = ['d.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    if (spaceId) {
      whereConditions.push(`d.space_id = $${paramIndex}`)
      queryParams.push(spaceId)
      paramIndex++
    } else {
      const userSpaces = await query(
        `SELECT id FROM spaces 
         WHERE (created_by = $1 OR id IN (
           SELECT space_id FROM space_members WHERE user_id = $1
         )) AND deleted_at IS NULL`,
        [session.user.id]
      )
      
      if (userSpaces.rows.length > 0) {
        const spaceIds = userSpaces.rows.map((r: any) => r.id)
        whereConditions.push(`d.space_id = ANY($${paramIndex}::uuid[])`)
        queryParams.push(spaceIds)
        paramIndex++
      } else {
        return NextResponse.json({ dashboards: [], total: 0, page, limit })
      }
    }

    // Apply search
    if (searchQuery) {
      const searchClause = buildSearchClause(searchQuery, ['d.name', 'd.description'], '')
      if (searchClause.clause) {
        const searchConditions = searchClause.clause.replace('WHERE', 'AND')
        whereConditions.push(searchConditions)
        queryParams.push(...searchClause.params)
        paramIndex += searchClause.params.length
      }
    }

    const whereClause = whereConditions.join(' AND ')

    const dashboardsQuery = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.space_id,
        d.layout,
        d.widgets,
        d.created_at,
        d.updated_at,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM dashboards d
      LEFT JOIN spaces s ON s.id = d.space_id
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy, sortOrder || 'desc', { field: 'created_at', order: 'desc' })}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const dashboardsResult = await query(dashboardsQuery, queryParams)

    // Get total count (remove pagination params)
    const countParams = queryParams.filter((_, idx) => idx < queryParams.length - 2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dashboards d
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const dashboards = dashboardsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      spaceId: row.space_id,
      space: row.space,
      layout: row.layout,
      widgets: row.widgets,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/v1/dashboards',
      200,
      spaceId || undefined
    )

  const response = createPaginationResponse(dashboards, total, page, limit)
  return NextResponse.json({
    dashboards: response.data,
    ...response,
  })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/v1/dashboards')
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
    const { name, description, spaceId = body.space_id, layout, widgets } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!spaceId) {
      return NextResponse.json(
        { error: 'spaceId is required' },
        { status: 400 }
      )
    }

    const permission = await checkPermission({
      resource: 'dashboards',
      action: 'create',
      spaceId,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const result = await query(
      `INSERT INTO dashboards (
        id, name, description, space_id, layout, widgets, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        description || null,
        spaceId,
        layout ? JSON.stringify(layout) : null,
        widgets ? JSON.stringify(widgets) : null,
      ]
    )

    const dashboardId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/dashboards',
      201,
      spaceId
    )

  return NextResponse.json(
    { id: dashboardId, message: 'Dashboard created successfully' },
    { status: 201 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/dashboards')
