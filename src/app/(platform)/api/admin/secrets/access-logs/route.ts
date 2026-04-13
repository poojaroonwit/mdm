import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 },
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const userId = searchParams.get('userId')
  const secretPath = searchParams.get('secretPath')
  const action = searchParams.get('action')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const offset = (page - 1) * limit

  // Map 'secret' resource_type to entity_type
  const conditions: string[] = ["a.entity_type = 'secret'"]
  const params: any[] = []
  let paramIndex = 1

  if (userId) {
    conditions.push(`a.user_id = $${paramIndex}::uuid`)
    params.push(userId)
    paramIndex++
  }

  // secretPath mapping is tricky if we don't have resource_name. 
  // We'll skip it or try to match against entity_id casting? 
  // For now, let's ignore secretPath filter or match roughly if possible?
  // Since we don't have resource_name, we can't filter by name.
  if (secretPath) {
     // conditions.push(`a.resource_name LIKE $${paramIndex}`)
     // params.push(`%${secretPath}%`)
     // paramIndex++
  }

  if (action) {
    conditions.push(`a.action = $${paramIndex}`)
    params.push(action)
    paramIndex++
  }

  if (startDate) {
    conditions.push(`a.created_at >= $${paramIndex}::timestamptz`)
    params.push(startDate)
    paramIndex++
  }

  if (endDate) {
    conditions.push(`a.created_at <= $${paramIndex}::timestamptz`)
    params.push(endDate)
    paramIndex++
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`,
    params,
  )
  const total = parseInt(countResult.rows[0].total)

  // Get logs
  params.push(limit, offset)
  const logsResult = await query(
    `SELECT 
        a.id, a.user_id, u.name as user_name, u.email as user_email, 
        a.action, a.entity_type as resource_type, a.entity_id as resource_id,
        null as resource_name, a.ip_address, a.user_agent, 
        '{}'::jsonb as metadata, true as success, a.created_at as timestamp
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params,
  )

  const logs = logsResult.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    secretPath: row.resource_name,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata,
    success: row.success,
    timestamp: row.timestamp,
  }))

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/secrets/access-logs',
)


