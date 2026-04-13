import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../../middleware'

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
      operation, 
      dashboardIds = body.dashboard_ids, 
      data 
    } = body
    const isActive = data?.isActive !== undefined ? data.isActive : data?.is_active

    if (!operation || !dashboardIds || !Array.isArray(dashboardIds) || dashboardIds.length === 0) {
      return NextResponse.json(
        { error: 'Operation and dashboardIds array are required' },
        { status: 400 }
      )
    }

    // Check permission
    const permission = await checkPermission({
      resource: 'dashboards',
      action: operation === 'delete' ? 'delete' : 'update',
      spaceId: null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let result: any
    let affectedCount = 0

    switch (operation) {
      case 'delete':
        result = await query(
          `UPDATE dashboards 
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = ANY($1::uuid[])
           AND deleted_at IS NULL
           AND (created_by = $2 OR EXISTS (
             SELECT 1 FROM dashboard_permissions dp
             WHERE dp.dashboard_id = dashboards.id
             AND dp.user_id = $2
             AND dp.permission = 'delete'
           ))`,
          [dashboardIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      case 'update_status':
        if (isActive === undefined) {
          return NextResponse.json(
            { error: 'isActive is required for update_status operation' },
            { status: 400 }
          )
        }

        result = await query(
          `UPDATE dashboards 
           SET is_active = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[])
           AND deleted_at IS NULL
           AND (created_by = $3 OR EXISTS (
             SELECT 1 FROM dashboard_permissions dp
             WHERE dp.dashboard_id = dashboards.id
             AND dp.user_id = $3
             AND dp.permission = 'edit'
           ))`,
          [isActive, dashboardIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    // Log API request
    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/dashboards/bulk',
      200,
      undefined
    )

  return NextResponse.json({
    success: true,
    affected: affectedCount,
    message: `Successfully ${operation}d ${affectedCount} dashboard(s)`,
  })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/dashboards/bulk')

