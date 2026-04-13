import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { parseFilterParams, buildSearchClause } from '@/shared/lib/api/filtering'

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
    const filters = parseFilterParams(request, ['status'])

    const permission = await checkPermission({
      resource: 'workflows',
      action: 'read',
      spaceId: spaceId || null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let whereConditions = ['w.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    if (spaceId) {
      whereConditions.push(`w.space_id = $${paramIndex}`)
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
        whereConditions.push(`w.space_id = ANY($${paramIndex}::uuid[])`)
        queryParams.push(spaceIds)
        paramIndex++
      } else {
        return NextResponse.json({ workflows: [], total: 0, page, limit })
      }
    }

    // Apply filters
    if (filters.status) {
      whereConditions.push(`w.status = $${paramIndex}`)
      queryParams.push(filters.status)
      paramIndex++
    }

    // Apply search
    if (searchQuery) {
      const searchClause = buildSearchClause(searchQuery, ['w.name', 'w.description'], '')
      if (searchClause.clause) {
        const searchConditions = searchClause.clause.replace('WHERE', 'AND')
        whereConditions.push(searchConditions)
        queryParams.push(...searchClause.params)
        paramIndex += searchClause.params.length
      }
    }

    const whereClause = whereConditions.join(' AND ')

    const workflowsQuery = `
      SELECT 
        w.id,
        w.name,
        w.description,
        w.space_id,
        w.status,
        w.steps,
        w.created_at,
        w.updated_at,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM workflows w
      LEFT JOIN spaces s ON s.id = w.space_id
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy, sortOrder || 'desc', { field: 'created_at', order: 'desc' })}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const workflowsResult = await query(workflowsQuery, queryParams)

    // Get total count (remove pagination params)
    const countParams = queryParams.filter((_, idx) => idx < queryParams.length - 2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM workflows w
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const workflows = workflowsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      spaceId: row.space_id,
      space: row.space,
      status: row.status,
      steps: row.steps,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/v1/workflows',
      200,
      spaceId || undefined
    )

  const response = createPaginationResponse(workflows, total, page, limit)
  return NextResponse.json({
    workflows: response.data,
    ...response,
  })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/v1/workflows')
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
    const { name, description, spaceId = body.space_id, status, steps } = body

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
      resource: 'workflows',
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
      `INSERT INTO workflows (
        id, name, description, space_id, status, steps, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        description || null,
        spaceId,
        status || 'draft',
        steps ? JSON.stringify(steps) : null,
      ]
    )

    const workflowId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/workflows',
      201,
      spaceId
    )

  return NextResponse.json(
    { id: workflowId, message: 'Workflow created successfully' },
    { status: 201 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/workflows')
