import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { name, space_ids } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if user has access to the original dashboard
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
    const canAccess = dashboard.created_by === session.user.id || 
                     dashboard.role || 
                     true // Allow access for now, can be restricted later

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Use the database function to duplicate the dashboard
    const { rows } = await query(
      'SELECT public.duplicate_dashboard($1, $2, $3) as new_dashboard_id',
      [id, name, session.user.id]
    )

    const newDashboardId = rows[0]?.new_dashboard_id

    if (!newDashboardId) {
      return NextResponse.json({ error: 'Failed to duplicate dashboard' }, { status: 500 })
    }

    // Update space associations if provided
    if (space_ids && Array.isArray(space_ids) && space_ids.length > 0) {
      // Check if user has access to all spaces
      const placeholders = space_ids.map((_, i) => `$${i + 1}`).join(',')
      const { rows: spaceAccess } = await query(
        `SELECT space_id, role FROM space_members WHERE space_id IN (${placeholders}) AND user_id = $${space_ids.length + 1}`,
        [...space_ids, session.user.id]
      )

      if (spaceAccess.length !== space_ids.length) {
        return NextResponse.json({ error: 'Access denied to one or more spaces' }, { status: 403 })
      }

      // Remove existing associations
      await query('DELETE FROM dashboard_spaces WHERE dashboard_id = $1', [newDashboardId])

      // Add new associations
      for (const spaceId of space_ids) {
        await query(
          'INSERT INTO dashboard_spaces (dashboard_id, space_id) VALUES ($1, $2)',
          [newDashboardId, spaceId]
        )
      }
    }

    // Get the duplicated dashboard
    const { rows: newDashboard } = await query(`
      SELECT * FROM dashboards WHERE id = $1
    `, [newDashboardId])

    return NextResponse.json({ dashboard: newDashboard[0] }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/dashboards/[id]/duplicate/route.ts')