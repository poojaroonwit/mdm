import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'

export async function GET(request: NextRequest) {
  try {
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

    // Get system metrics
    const systemMetrics = await query(
      `SELECT 
        COUNT(DISTINCT al.user_id) as active_users,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE al.created_at >= $1) as recent_requests,
        COUNT(*) FILTER (WHERE al.action = 'api_request' AND (al.new_value::jsonb)->>'statusCode' = '200') as successful_requests,
        COUNT(*) FILTER (WHERE al.action = 'api_request' AND (al.new_value::jsonb)->>'statusCode' != '200') as failed_requests
      FROM audit_logs al
      WHERE al.created_at >= $1`,
      [startDate]
    )

    // Get activity data (requests per day)
    const activityData = await query(
      `SELECT 
        DATE(al.created_at) as date,
        COUNT(*) as count,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE al.created_at >= $1
      GROUP BY DATE(al.created_at)
      ORDER BY date ASC`,
      [startDate]
    )

    // Get storage usage (from data models and files)
    const storageData = await query(
      `SELECT 
        'data_models' as type,
        COUNT(*) as count,
        COUNT(*) * 1024 as estimated_bytes
      FROM data_models
      WHERE deleted_at IS NULL
      UNION ALL
      SELECT 
        'tickets' as type,
        COUNT(*) as count,
        COUNT(*) * 512 as estimated_bytes
      FROM tickets
      WHERE deleted_at IS NULL
      UNION ALL
      SELECT 
        'reports' as type,
        COUNT(*) as count,
        COUNT(*) * 2048 as estimated_bytes
      FROM reports
      WHERE deleted_at IS NULL`
    )

    // Get performance data (API response times)
    const performanceData = await query(
      `SELECT 
        DATE(al.created_at) as date,
        AVG(CAST((al.new_value::jsonb)->>'duration' AS INTEGER)) as avg_duration,
        MAX(CAST((al.new_value::jsonb)->>'duration' AS INTEGER)) as max_duration,
        MIN(CAST((al.new_value::jsonb)->>'duration' AS INTEGER)) as min_duration
      FROM audit_logs al
      WHERE al.action = 'api_request'
        AND (al.new_value::jsonb)->>'duration' IS NOT NULL
        AND al.created_at >= $1
      GROUP BY DATE(al.created_at)
      ORDER BY date ASC`,
      [startDate]
    )

    // Get top endpoints
    const topEndpoints = await query(
      `SELECT 
        (al.new_value::jsonb)->>'path' as endpoint,
        COUNT(*) as count,
        AVG(CAST((al.new_value::jsonb)->>'duration' AS INTEGER)) as avg_duration
      FROM audit_logs al
      WHERE al.action = 'api_request'
        AND al.created_at >= $1
      GROUP BY (al.new_value::jsonb)->>'path'
      ORDER BY count DESC
      LIMIT 10`,
      [startDate]
    )

    // Get error rate
    const errorRate = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE (al.new_value::jsonb)->>'statusCode' != '200') * 100.0 / 
        NULLIF(COUNT(*), 0) as error_rate
      FROM audit_logs al
      WHERE al.action = 'api_request'
        AND al.created_at >= $1`,
      [startDate]
    )

    // Get total users
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users')
    const totalUsers = parseInt(totalUsersResult.rows[0]?.count || '0')

    // Calculate details for dashboard
    const metrics = systemMetrics.rows[0] || {}
    const errorRateValue = errorRate.rows[0]?.error_rate || 0

    // Calculate storage used
    const totalStorageBytes = storageData.rows.reduce((acc: number, row: any) => acc + parseInt(row.estimated_bytes || '0'), 0)

    // Calculate response time (avg from today or recent)
    const avgResponseTime = performanceData.rows.length > 0
      ? performanceData.rows[performanceData.rows.length - 1].avg_duration
      : 0

    // Calculate errors today
    const today = new Date().toISOString().split('T')[0]
    const errorsToday = await query(
      `SELECT COUNT(*) as count 
       FROM audit_logs al 
       WHERE al.action = 'api_request' 
       AND (al.new_value::jsonb)->>'statusCode' != '200' 
       AND DATE(al.created_at) = DATE(NOW())`
    )
    const errorsTodayCount = parseInt(errorsToday.rows[0]?.count || '0')

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/admin/analytics',
      200,
      undefined
    )

    return NextResponse.json({
      metrics: {
        totalUsers: totalUsers,
        activeUsers: parseInt(metrics.active_users || '0'),
        storageUsed: totalStorageBytes,
        storageLimit: 10 * 1024 * 1024 * 1024, // 10GB Hardcoded limit for now
        responseTime: Math.round(avgResponseTime || 0),
        uptime: 99.9, // Mocked for now
        errorsToday: errorsTodayCount,
        totalRequests: parseInt(metrics.total_requests || '0'),
        recentRequests: parseInt(metrics.recent_requests || '0'),
        successfulRequests: parseInt(metrics.successful_requests || '0'),
        failedRequests: parseInt(metrics.failed_requests || '0'),
        errorRate: parseFloat(errorRateValue.toString()),
      },
      activityData: activityData.rows.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count),
        uniqueUsers: parseInt(row.unique_users),
      })),
      storageData: storageData.rows.map((row: any) => ({
        type: row.type,
        count: parseInt(row.count),
        bytes: parseInt(row.estimated_bytes),
      })),
      performanceData: performanceData.rows.map((row: any) => ({
        date: row.date,
        avgDuration: parseFloat(row.avg_duration || '0'),
        maxDuration: parseFloat(row.max_duration || '0'),
        minDuration: parseFloat(row.min_duration || '0'),
      })),
      topEndpoints: topEndpoints.rows.map((row: any) => ({
        endpoint: row.endpoint,
        count: parseInt(row.count),
        avgDuration: parseFloat(row.avg_duration || '0'),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}
