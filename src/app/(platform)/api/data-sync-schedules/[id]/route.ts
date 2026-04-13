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

    const { rows } = await query(
      `SELECT 
        ds.*,
        ec.name as connection_name,
        ec.connection_type,
        dm.display_name as data_model_name
       FROM public.data_sync_schedules ds
       LEFT JOIN public.external_connections ec ON ec.id = ds.external_connection_id
       LEFT JOIN public.data_models dm ON dm.id = ds.data_model_id
       WHERE ds.id = $1::uuid AND ds.deleted_at IS NULL`,
      [id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sync schedule not found' }, { status: 404 })
    }

    // Check access
    const { rows: access } = await query(
      'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
      [rows[0].space_id, session.user.id]
    )
    if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ schedule: rows[0] })
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { ...updates } = body

    // Get existing schedule to check access
    const { rows: existing } = await query(
      'SELECT space_id FROM public.data_sync_schedules WHERE id = $1::uuid',
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

    // Build update query
    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    const fieldMapping: Record<string, string> = {
      spaceId: 'space_id',
      dataModelId: 'data_model_id',
      externalConnectionId: 'external_connection_id',
      scheduleType: 'schedule_type',
      scheduleConfig: 'schedule_config',
      syncStrategy: 'sync_strategy',
      incrementalKey: 'incremental_key',
      incrementalTimestampColumn: 'incremental_timestamp_column',
      clearExistingData: 'clear_existing_data',
      sourceQuery: 'source_query',
      dataMapping: 'data_mapping',
      maxRecordsPerSync: 'max_records_per_sync',
      rateLimitPerMinute: 'rate_limit_per_minute',
      isActive: 'is_active',
      notifyOnSuccess: 'notify_on_success',
      notifyOnFailure: 'notify_on_failure',
      notificationEmails: 'notification_emails'
    }

    for (const [rawKey, value] of Object.entries(updates)) {
      const key = fieldMapping[rawKey] || rawKey
      if (key === 'schedule_config' || key === 'data_mapping') {
        fields.push(`${key} = $${idx++}`)
        values.push(value ? JSON.stringify(value) : null)
      } else if (key === 'notification_emails' && Array.isArray(value)) {
        fields.push(`${key} = $${idx++}`)
        values.push(value)
      } else if (value !== undefined) {
        fields.push(`${key} = $${idx++}`)
        values.push(value)
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 500 })
    }

    // Recalculate next_run_at if schedule changed
    if (updates.schedule_type || updates.schedule_config) {
      const scheduleType = updates.schedule_type || existing[0].schedule_type
      const scheduleConfig = updates.schedule_config || existing[0].schedule_config
      const nextRunAt = calculateNextRunTime(scheduleType, scheduleConfig)
      if (nextRunAt) {
        fields.push(`next_run_at = $${idx++}`)
        values.push(nextRunAt)
      }
    }

    fields.push(`updated_at = NOW()`)
    values.push(id)

    const { rows } = await query(
      `UPDATE public.data_sync_schedules 
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    )

    return NextResponse.json({ schedule: rows[0] })
}

async function deleteHandler(
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
      'SELECT space_id FROM public.data_sync_schedules WHERE id = $1::uuid',
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

    await query(
      `UPDATE public.data_sync_schedules 
       SET deleted_at = NOW()
       WHERE id = $1::uuid`,
      [id]
    )

    return NextResponse.json({ success: true })
}

function calculateNextRunTime(scheduleType: string, scheduleConfig: any): Date | null {
  if (scheduleType === 'MANUAL') return null

  const now = new Date()
  const next = new Date(now)

  switch (scheduleType) {
    case 'HOURLY':
      next.setHours(next.getHours() + 1, 0, 0, 0)
      break
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      next.setHours(scheduleConfig?.hour || 0, scheduleConfig?.minute || 0, 0, 0)
      break
    default:
      return null
  }

  return next
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/data-sync-schedules/[id]/route.ts')
export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/data-sync-schedules/[id]/route.ts')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/data-sync-schedules/[id]/route.ts')