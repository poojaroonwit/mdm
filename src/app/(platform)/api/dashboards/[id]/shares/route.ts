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
    const { share_type = 'PUBLIC', password_hash, expires_at } = body

    // Check if user has permission to share this dashboard
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
    const canShare = dashboard.created_by === session.user.id || 
                    (dashboard.role && ['ADMIN', 'EDITOR'].includes(dashboard.role))

    if (!canShare) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate share token
    const { rows: tokenRows } = await query('SELECT public.generate_dashboard_public_link() as token')
    const shareToken = tokenRows[0]?.token

    // Create share record
    const { rows } = await query(`
      INSERT INTO dashboard_shares (
        dashboard_id, share_token, share_type, password_hash, expires_at, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      id,
      shareToken,
      share_type,
      password_hash || null,
      expires_at || null,
      session.user.id
    ])

    return NextResponse.json({ share: rows[0] })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/dashboards/[id]/shares/route.ts')