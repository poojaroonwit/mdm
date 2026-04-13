import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Get dashboard datasources
    const { rows: datasources } = await query(`
      SELECT * FROM dashboard_datasources 
      WHERE dashboard_id = $1 AND is_active = true
      ORDER BY created_at ASC
    `, [id])

    // Get available data models for this space
    const { rows: dataModels } = await query(`
      SELECT dm.*, s.name as space_name
      FROM data_models dm
      JOIN data_model_spaces dms ON dms.data_model_id = dm.id
      JOIN spaces s ON s.id = dms.space_id
      JOIN dashboard_spaces ds ON ds.space_id = s.id
      WHERE ds.dashboard_id = $1 AND dm.deleted_at IS NULL
      ORDER BY dm.name
    `, [id])

    // Get available assignments for this space
    const { rows: assignments } = await query(`
      SELECT a.*, s.name as space_name
      FROM assignments a
      JOIN spaces s ON s.id = a.space_id
      JOIN dashboard_spaces ds ON ds.space_id = s.id
      WHERE ds.dashboard_id = $1 AND a.deleted_at IS NULL
      ORDER BY a.title
    `, [id])

    return NextResponse.json({
      datasources,
      availableDataModels: dataModels,
      availableAssignments: assignments
    })
}

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
    const { name, source_type, source_id, config, query_config } = body

    if (!name || !source_type) {
      return NextResponse.json({ error: 'Name and source_type are required' }, { status: 400 })
    }

    // Check if user has access to this dashboard
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
    const canEdit = dashboard.created_by === session.user.id || 
                   (dashboard.role && ['ADMIN', 'EDITOR'].includes(dashboard.role))

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create datasource
    const { rows } = await query(`
      INSERT INTO dashboard_datasources (
        dashboard_id, name, source_type, source_id, config, query_config, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      id,
      name,
      source_type,
      source_id || null,
      JSON.stringify(config || {}),
      JSON.stringify(query_config || {}),
      true
    ])

    return NextResponse.json({ datasource: rows[0] }, { status: 201 })
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/dashboards/[id]/datasources/route.ts')
export const POST = withErrorHandling(postHandler, 'POST POST /api/dashboards/[id]/datasources/route.ts')