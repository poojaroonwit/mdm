import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const entityType = searchParams.get('entityType')
  const action = searchParams.get('action')
  const userId = searchParams.get('userId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const search = searchParams.get('search')
  const userSearch = searchParams.get('userSearch')

  const offset = (page - 1) * limit

  let whereConditions = ['1=1']
  let queryParams: any[] = []
  let paramIndex = 1

  if (entityType) {
    whereConditions.push(`entity_type = $${paramIndex}`)
    queryParams.push(entityType)
    paramIndex++
  }

  if (action) {
    whereConditions.push(`action = $${paramIndex}`)
    queryParams.push(action)
    paramIndex++
  }

  if (userId) {
    whereConditions.push(`user_id::text = $${paramIndex}`)
    queryParams.push(userId)
    paramIndex++
  }

  if (startDate) {
    whereConditions.push(`created_at >= $${paramIndex}`)
    queryParams.push(startDate)
    paramIndex++
  }

  if (endDate) {
    whereConditions.push(`created_at <= $${paramIndex}`)
    queryParams.push(endDate)
    paramIndex++
  }

  if (search) {
    whereConditions.push(`(
        al.action ILIKE $${paramIndex} OR 
        al.entity_type ILIKE $${paramIndex} OR 
        al.entity_id::text ILIKE $${paramIndex} OR
        al.ip_address ILIKE $${paramIndex} OR
        al.user_agent ILIKE $${paramIndex}
      )`)
    const searchTerm = `%${search}%`
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    paramIndex += 5
  }

  if (userSearch) {
    whereConditions.push(`(
        u.name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex}
      )`)
    const userSearchTerm = `%${userSearch}%`
    queryParams.push(userSearchTerm, userSearchTerm)
    paramIndex += 2
  }

  const whereClause = whereConditions.join(' AND ')

  // Get total count
  const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
    `
  const countResult = await query(countQuery, queryParams)
  const total = parseInt(countResult.rows[0]?.total || '0')

  // Get audit logs with user information
  const auditLogsQuery = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
  // Create separate parameters for the main query (including LIMIT and OFFSET)
  const mainQueryParams = [...queryParams, limit, offset]

  const { rows } = await query(auditLogsQuery, mainQueryParams)

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}











export const GET = withErrorHandling(getHandler, 'GET /api/audit-logs')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { action, entityType, entityId, oldValue, newValue, ipAddress, userAgent } = body

  if (!action || !entityType || !entityId) {
    return NextResponse.json(
      { error: 'Action, entityType, and entityId are required' },
      { status: 400 }
    )
  }

  const insertQuery = `
      INSERT INTO audit_logs (action, entity_type, entity_id, old_value, new_value, user_id, ip_address, user_agent)
      VALUES ($1, $2, $3::uuid, $4, $5, $6::uuid, $7, $8)
      RETURNING id, created_at
    `

  const result = await query(insertQuery, [
    action,
    entityType,
    entityId,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    session.user.id,
    ipAddress || null,
    userAgent || null
  ])

  return NextResponse.json({
    id: result.rows[0].id,
    created_at: result.rows[0].created_at
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/audit-logs')









