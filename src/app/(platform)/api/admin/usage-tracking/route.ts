import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Check permission (additional check if needed)
  const permission = await checkPermission({
    resource: 'analytics',
    action: 'read',
    spaceId: null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const resourceType = searchParams.get('resourceType') // tickets, reports, dashboards, workflows
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (range) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    // Get usage statistics by resource type
    let usageStats: any = {}

    if (!resourceType || resourceType === 'tickets') {
      const ticketStats = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as created_recent,
          COUNT(*) FILTER (WHERE updated_at >= $1) as updated_recent,
          COUNT(DISTINCT created_by) as creators,
          COUNT(DISTINCT status) as status_count
        FROM tickets
        WHERE deleted_at IS NULL`,
        [startDate]
      )
      usageStats.tickets = ticketStats.rows[0] || {}
    }

    if (!resourceType || resourceType === 'reports') {
      const reportStats = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as created_recent,
          COUNT(DISTINCT created_by) as creators,
          COUNT(DISTINCT source_type) as source_types
        FROM reports
        WHERE deleted_at IS NULL`,
        [startDate]
      )
      usageStats.reports = reportStats.rows[0] || {}
    }

    if (!resourceType || resourceType === 'dashboards') {
      const dashboardStats = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as created_recent,
          COUNT(DISTINCT created_by) as creators,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM dashboards
        WHERE deleted_at IS NULL`,
        [startDate]
      )
      usageStats.dashboards = dashboardStats.rows[0] || {}
    }

    if (!resourceType || resourceType === 'workflows') {
      const workflowStats = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1) as created_recent,
          COUNT(DISTINCT created_by) as creators,
          COUNT(DISTINCT status) as status_count
        FROM workflows
        WHERE deleted_at IS NULL`,
        [startDate]
      )
      usageStats.workflows = workflowStats.rows[0] || {}
    }

    // Get user activity
    const userActivity = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT DATE(al.created_at)) as active_days,
        COUNT(*) as total_actions,
        MAX(al.created_at) as last_activity
      FROM users u
      LEFT JOIN audit_logs al ON al.user_id = u.id AND al.created_at >= $1
      WHERE al.user_id IS NOT NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY total_actions DESC
      LIMIT 20`,
      [startDate]
    )

    // Get space usage
    const spaceUsage = await query(
      `SELECT 
        s.id,
        s.name,
        COUNT(DISTINCT ts.ticket_id) as ticket_count,
        COUNT(DISTINCT rs.report_id) as report_count,
        COUNT(DISTINCT sm.user_id) as member_count
      FROM spaces s
      LEFT JOIN ticket_spaces ts ON ts.space_id = s.id
      LEFT JOIN report_spaces rs ON rs.space_id = s.id
      LEFT JOIN space_members sm ON sm.space_id = s.id
      WHERE s.deleted_at IS NULL
      GROUP BY s.id, s.name
      ORDER BY ticket_count + report_count DESC
      LIMIT 20`,
      []
    )

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/admin/usage-tracking',
      200,
      undefined
    )

    return NextResponse.json({
      usageStats,
      userActivity: userActivity.rows.map((row: any) => ({
        userId: row.id,
        name: row.name,
        email: row.email,
        activeDays: parseInt(row.active_days || '0'),
        totalActions: parseInt(row.total_actions || '0'),
        lastActivity: row.last_activity,
      })),
      spaceUsage: spaceUsage.rows.map((row: any) => ({
        spaceId: row.id,
        name: row.name,
        ticketCount: parseInt(row.ticket_count || '0'),
        reportCount: parseInt(row.report_count || '0'),
        memberCount: parseInt(row.member_count || '0'),
      })),
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/usage-tracking')

