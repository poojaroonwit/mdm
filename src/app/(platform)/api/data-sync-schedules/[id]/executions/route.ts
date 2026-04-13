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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get existing schedule to check access
    const { rows: existing } = await query(
      'SELECT space_id FROM public.data_sync_schedules WHERE id = $1::uuid AND deleted_at IS NULL',
      [id]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Sync schedule not found' }, { status: 404 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [existing[0].space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Get executions
    const { rows } = await query(
      `SELECT * FROM public.data_sync_executions
       WHERE sync_schedule_id = $1::uuid
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    )

    // Get total count
    const { rows: countRows } = await query(
      `SELECT COUNT(*) as total FROM public.data_sync_executions
       WHERE sync_schedule_id = $1::uuid`,
      [id]
    )

    return NextResponse.json({
      executions: rows,
      total: parseInt(countRows[0].total),
      limit,
      offset
    })
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/data-sync-schedules/[id]/executions/route.ts')