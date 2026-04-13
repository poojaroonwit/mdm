import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { rows } = await query(
      `SELECT
        al.id,
        al.action,
        al.entity_type as "resourceType",
        al.entity_id as "resource",
        al.old_value as "oldValue",
        al.new_value as "newValue",
        al.user_id as "userId",
        COALESCE(u.name, u.email, 'System') as "userName",
        al.ip_address as "ipAddress",
        al.user_agent as "userAgent",
        al.created_at as "timestamp"
      FROM audit_logs al
      LEFT JOIN users u ON u.id::text = al.user_id::text
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const logs = rows.map((row: any) => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId || '',
      userName: row.userName || 'Unknown',
      action: row.action,
      resource: row.resource || '',
      resourceType: row.resourceType || '',
      ipAddress: row.ipAddress || '',
      userAgent: row.userAgent || '',
      status: 'success',
      severity: 'low',
      details: {
        oldValue: row.oldValue,
        newValue: row.newValue,
      },
    }))

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ logs: [] })
  }
}
