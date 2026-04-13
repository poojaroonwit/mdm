import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: spaceId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const offset = (page - 1) * limit

    // Check if user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Build query conditions
    // Note: audit_logs table doesn't have space_id column, so we filter by entity_id if it matches the space
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1
    
    // Filter by entity_id matching the space_id (assuming spaces are tracked as entityType='space')
    whereConditions.push(`(al.entity_id = $${paramIndex}::uuid AND al.entity_type = 'space')`)
    queryParams.push(spaceId)
    paramIndex++

    if (action) {
      whereConditions.push(`al.action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get audit log entries
    const auditLogs = await query(`
      SELECT 
        al.*,
        u.name as user_name,
        u.email as user_email,
        u.avatar
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset])

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM audit_logs al
      ${whereClause}
    `, queryParams)

    const total = parseInt(countResult.rows[0].total)
    const hasMore = offset + limit < total

    return NextResponse.json({
      auditLogs: auditLogs.rows,
      pagination: {
        page,
        limit,
        total,
        hasMore
      }
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/audit-log')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: spaceId } = await params

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response
    const body = await request.json()
    const { action, description, metadata, ip_address, user_agent } = body

    if (!action || !description) {
      return NextResponse.json({ error: 'Action and description are required' }, { status: 400 })
    }

    // Log the activity
    // Note: audit_logs table uses entity_id and entity_type instead of space_id
    const result = await query(`
      INSERT INTO audit_logs (
        entity_id,
        entity_type,
        user_id, 
        action, 
        old_value,
        new_value,
        ip_address, 
        user_agent, 
        created_at
      )
      VALUES ($1::uuid, 'space', $2::uuid, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `, [
      spaceId,
      session.user.id,
      action,
      null, // old_value
      JSON.stringify({ description, ...metadata }), // new_value
      ip_address || null,
      user_agent || null
    ])

    return NextResponse.json({
      success: true,
      logId: result.rows[0].id
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/audit-log')
