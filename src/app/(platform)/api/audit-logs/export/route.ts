import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const userSearch = searchParams.get('userSearch')

    let whereConditions = ['1=1']
    let queryParams: any[] = []
    let paramIndex = 1

    if (entityType) {
      whereConditions.push(`entity_type = ${paramIndex}`)
      queryParams.push(entityType)
      paramIndex++
    }

    if (action) {
      whereConditions.push(`action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`)
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

    const auditLogsQuery = `
      SELECT 
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
    `

    const { rows } = await query(auditLogsQuery, queryParams)

    // Convert to CSV format
    const csvHeaders = [
      'Action',
      'Entity Type',
      'Entity ID',
      'User Name',
      'User Email',
      'IP Address',
      'User Agent',
      'Created At',
      'Old Value',
      'New Value'
    ]

    const csvRows = rows.map((row: any) => [
      row.action,
      row.entity_type,
      row.entity_id,
      row.user_name || '',
      row.user_email || '',
      row.ip_address || '',
      row.user_agent || '',
      new Date(row.created_at).toISOString(),
      row.old_value ? JSON.stringify(row.old_value) : '',
      row.new_value ? JSON.stringify(row.new_value) : ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
}









export const GET = withErrorHandling(getHandler, 'GET /api/audit-logs/export')
