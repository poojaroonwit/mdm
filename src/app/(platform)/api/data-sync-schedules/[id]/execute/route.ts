import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { DataSyncExecutor } from '@/lib/data-sync-executor'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

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

    // Check if sync is already running
    const { rows: running } = await query(
      `SELECT id FROM public.data_sync_schedules 
       WHERE id = $1::uuid AND last_run_status = 'RUNNING'`,
      [id]
    )

    if (running.length > 0) {
      return NextResponse.json({ 
        error: 'Sync is already running',
        status: 'RUNNING'
       })
    }

    // Execute sync
    const executor = new DataSyncExecutor()
    const result = await executor.executeSync(id)

    return NextResponse.json({
      success: result.success,
      result: {
        records_fetched: result.records_fetched,
        records_processed: result.records_processed,
        records_inserted: result.records_inserted,
        records_updated: result.records_updated,
        records_deleted: result.records_deleted,
        records_failed: result.records_failed,
        duration_ms: result.duration_ms
      },
      error: result.error
    })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/data-sync-schedules/[id]/execute/route.ts')