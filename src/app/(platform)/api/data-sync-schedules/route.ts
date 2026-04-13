import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const rawSpaceId = searchParams.get('space_id') || searchParams.get('spaceId')
  const dataModelId = searchParams.get('data_model_id') || searchParams.get('dataModelId')

  if (!rawSpaceId) return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const spaceId = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(spaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [spaceId, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let sqlQuery = `
    SELECT 
      ds.*,
      ec.name as connection_name,
      ec.connection_type,
      dm.display_name as data_model_name
    FROM public.data_sync_schedules ds
    LEFT JOIN public.external_connections ec ON ec.id = ds.external_connection_id
    LEFT JOIN public.data_models dm ON dm.id = ds.data_model_id
    WHERE ds.space_id = $1::uuid AND ds.deleted_at IS NULL
  `
  const params: any[] = [spaceId]

  if (dataModelId) {
    sqlQuery += ' AND ds.data_model_id = $2'
    params.push(dataModelId)
  }

  sqlQuery += ' ORDER BY ds.created_at DESC'

  const { rows } = await query(sqlQuery, params)
  return NextResponse.json({ schedules: rows })
}













export const GET = withErrorHandling(getHandler, 'GET /api/data-sync-schedules')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    space_id,
    spaceId: sId,
    data_model_id,
    dataModelId: dmId,
    external_connection_id,
    externalConnectionId: ecId,
    name,
    description,
    schedule_type,
    scheduleType: sType,
    schedule_config,
    scheduleConfig: sConfig,
    sync_strategy,
    syncStrategy: syStrategy,
    incremental_key,
    incrementalKey: iKey,
    incremental_timestamp_column,
    incrementalTimestampColumn: iTimestampColumn,
    clear_existing_data,
    clearExistingData: cExistingData,
    source_query,
    sourceQuery: sQuery,
    data_mapping,
    dataMapping: dMapping,
    max_records_per_sync,
    maxRecordsPerSync: mRecordsPerSync,
    rate_limit_per_minute,
    rateLimitPerMinute: rLimitPerMinute,
    is_active,
    isActive: iActive,
    notify_on_success,
    notifyOnSuccess: nOnSuccess,
    notify_on_failure,
    notifyOnFailure: nOnFailure,
    notification_emails,
    notificationEmails: nEmails
  } = body

  const final_space_id = space_id || sId
  const final_data_model_id = data_model_id || dmId
  const final_external_connection_id = external_connection_id || ecId
  const final_schedule_type = schedule_type || sType || 'MANUAL'
  const final_schedule_config = schedule_config || sConfig
  const final_sync_strategy = sync_strategy || syStrategy || 'FULL_REFRESH'
  const final_incremental_key = incremental_key || iKey
  const final_incremental_timestamp_column = incremental_timestamp_column || iTimestampColumn
  const final_clear_existing_data = clear_existing_data !== undefined ? clear_existing_data : (cExistingData !== undefined ? cExistingData : true)
  const final_source_query = source_query || sQuery
  const final_data_mapping = data_mapping || dMapping
  const final_max_records_per_sync = max_records_per_sync || mRecordsPerSync
  const final_rate_limit_per_minute = rate_limit_per_minute || rLimitPerMinute
  const final_is_active = is_active !== undefined ? is_active : (iActive !== undefined ? iActive : true)
  const final_notify_on_success = notify_on_success !== undefined ? notify_on_success : (nOnSuccess !== undefined ? nOnSuccess : false)
  const final_notify_on_failure = notify_on_failure !== undefined ? notify_on_failure : (nOnFailure !== undefined ? nOnFailure : true)
  const final_notification_emails = notification_emails || nEmails || []

  if (!final_space_id || !final_data_model_id || !final_external_connection_id || !name) {
    return NextResponse.json({ 
      error: 'space_id, data_model_id, external_connection_id, and name are required' 
    }, { status: 400 })
  }

  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const normalizedSpaceId = final_space_id.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(normalizedSpaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [normalizedSpaceId, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Calculate next run time
  const nextRunAt = calculateNextRunTime(final_schedule_type, final_schedule_config)

  const { rows } = await query(
    `INSERT INTO public.data_sync_schedules
      (space_id, data_model_id, external_connection_id, name, description,
        schedule_type, schedule_config, sync_strategy, incremental_key,
        incremental_timestamp_column, clear_existing_data, source_query,
        data_mapping, max_records_per_sync, rate_limit_per_minute,
        is_active, notify_on_success, notify_on_failure, notification_emails,
        next_run_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
    [
      normalizedSpaceId, final_data_model_id, final_external_connection_id, name, description,
      final_schedule_type, final_schedule_config ? JSON.stringify(final_schedule_config) : null, final_sync_strategy,
      final_incremental_key || null, final_incremental_timestamp_column || null,
      final_clear_existing_data, final_source_query || null,
      final_data_mapping ? JSON.stringify(final_data_mapping) : null,
      final_max_records_per_sync || null, final_rate_limit_per_minute || null,
      final_is_active, final_notify_on_success, final_notify_on_failure, final_notification_emails,
      nextRunAt, session.user.id
    ]
  )

  return NextResponse.json({ schedule: rows[0] }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-sync-schedules')










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

