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
    const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
    const searchQuery = searchParams.get('search')
    
    // Parse pagination
    const { page, limit, offset } = parsePaginationParams(request)
    
    // Parse sorting
    const { sortBy, sortOrder } = parseSortParams(request)
    
    // Parse filters
    const filters = parseFilterParams(request, ['sourceType'])

    // Check permission
    const permission = await checkPermission({
      resource: 'reports',
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
    let whereConditions = ['r.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    // Space filtering
    if (spaceId) {
      whereConditions.push(`r.space_id = $${paramIndex}`)
      queryParams.push(spaceId)
      paramIndex++
    } else {
      // Get all spaces user has access to
      const userSpaces = await query(
        `SELECT id FROM spaces 
         WHERE (created_by = $1 OR id IN (
           SELECT space_id FROM space_members WHERE user_id = $1
         )) AND deleted_at IS NULL`,
        [session.user.id]
      )
      
      if (userSpaces.rows.length > 0) {
        const spaceIds = userSpaces.rows.map((r: any) => r.id)
        whereConditions.push(`r.space_id = ANY($${paramIndex}::uuid[])`)
        queryParams.push(spaceIds)
        paramIndex++
      } else {
        return NextResponse.json({ reports: [], total: 0, page, limit })
      }
    }

    // Apply filters
    if (filters.sourceType) {
      whereConditions.push(`r.source_type = $${paramIndex}`)
      queryParams.push(filters.sourceType)
      paramIndex++
    }

    // Apply search
    if (searchQuery) {
      const searchClause = buildSearchClause(searchQuery, ['r.name', 'r.description'], '')
      if (searchClause.clause) {
        const searchConditions = searchClause.clause.replace('WHERE', 'AND')
        whereConditions.push(searchConditions)
        queryParams.push(...searchClause.params)
        paramIndex += searchClause.params.length
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // Get reports with pagination
    const reportsQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.source_type,
        r.source_id,
        r.space_id,
        r.url,
        r.embed_url,
        r.created_at,
        r.updated_at,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM reports r
      LEFT JOIN spaces s ON s.id = r.space_id
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy, sortOrder || 'desc', { field: 'created_at', order: 'desc' })}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const reportsResult = await query(reportsQuery, queryParams)

    // Get total count (remove pagination params)
    const countParams = queryParams.filter((_, idx) => idx < queryParams.length - 2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      WHERE ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Format reports
    const reports = reportsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sourceType: row.source_type,
      sourceId: row.source_id,
      spaceId: row.space_id,
      space: row.space,
      url: row.url,
      embedUrl: row.embed_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    // Log API request
    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/v1/reports',
      200,
      spaceId || undefined
    )

  const response = createPaginationResponse(reports, total, page, limit)
  return NextResponse.json({
    reports: response.data,
    ...response,
  })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/v1/reports')
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
      name, 
      description, 
      sourceType = body.source_type, 
      sourceId = body.source_id, 
      spaceId = body.space_id, 
      url, 
      embedUrl = body.embed_url 
    } = body

    if (!name || !sourceType) {
      return NextResponse.json(
        { error: 'name and sourceType are required' },
        { status: 400 }
      )
    }

    if (!spaceId) {
      return NextResponse.json(
        { error: 'spaceId is required' },
        { status: 400 }
      )
    }

    // Check permission
    const permission = await checkPermission({
      resource: 'reports',
      action: 'create',
      spaceId,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    // Create report
    const result = await query(
      `INSERT INTO reports (
        id, name, description, source_type, source_id, space_id, url, embed_url,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        description || null,
        sourceType,
        sourceId || null,
        spaceId,
        url || null,
        embedUrl || null,
      ]
    )

    const reportId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/reports',
      201,
      spaceId
    )

  return NextResponse.json(
    { id: reportId, message: 'Report created successfully' },
    { status: 201 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/reports')
