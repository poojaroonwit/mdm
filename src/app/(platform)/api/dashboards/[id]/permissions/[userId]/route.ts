import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, userId } = await params
    // Check if user has permission to manage this dashboard
    const { rows: accessCheck } = await query(`
      SELECT d.created_by, dp.role
      FROM dashboards d
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $2
      WHERE d.id = $1 AND d.deleted_at IS NULL
    `, [id, session.user.id])

    if (accessCheck.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const dashboard = accessCheck[0]
    const canManage = dashboard.created_by === session.user.id || 
                     (dashboard.role && dashboard.role === 'ADMIN')

    if (!canManage) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Remove permission
    await query(`
      DELETE FROM dashboard_permissions 
      WHERE dashboard_id = $1 AND user_id = $2
    `, [id, userId])

    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/dashboards/[id]/permissions/[userId]/route.ts')