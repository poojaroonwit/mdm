import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Get sync schedule configuration
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const space_id = searchParams.get('space_id')

  if (!space_id) {
    return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get sync schedule configuration
  const { rows } = await query(
    `SELECT schedule_type, schedule_config, is_active, last_run_at, next_run_at
     FROM servicedesk_sync_schedules
     WHERE space_id = $1::uuid AND deleted_at IS NULL
     LIMIT 1`,
    [space_id]
  )

  if (rows.length === 0) {
    return NextResponse.json({
      schedule: null,
      message: 'No sync schedule configured'
    })
  }

  return NextResponse.json({
    schedule: rows[0]
  })
}

// Create or update sync schedule
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { space_id, schedule_type, schedule_config, is_active } = body

  if (!space_id || !schedule_type) {
    return NextResponse.json(
      { error: 'space_id and schedule_type are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Calculate next run time based on schedule type
  let nextRunAt: Date | null = null
  if (schedule_type === 'interval' && schedule_config?.interval_minutes) {
    nextRunAt = new Date(Date.now() + schedule_config.interval_minutes * 60 * 1000)
  } else if (schedule_type === 'daily' && schedule_config?.time) {
    const [hours, minutes] = schedule_config.time.split(':').map(Number)
    nextRunAt = new Date()
    nextRunAt.setHours(hours, minutes, 0, 0)
    if (nextRunAt <= new Date()) {
      nextRunAt.setDate(nextRunAt.getDate() + 1)
    }
  } else if (schedule_type === 'hourly') {
    nextRunAt = new Date(Date.now() + 60 * 60 * 1000)
  }

  // Check if schedule exists
  const { rows: existing } = await query(
    `SELECT id FROM servicedesk_sync_schedules
     WHERE space_id = $1::uuid AND deleted_at IS NULL
     LIMIT 1`,
    [space_id]
  )

  if (existing.length > 0) {
    // Update existing
    await query(
      `UPDATE servicedesk_sync_schedules SET
       schedule_type = $1,
       schedule_config = $2::jsonb,
       is_active = $3,
       next_run_at = $4,
       updated_at = NOW()
       WHERE id = $5`,
      [
        schedule_type,
        JSON.stringify(schedule_config || {}),
        is_active !== false,
        nextRunAt,
        existing[0].id
      ]
    )
  } else {
    // Create new
    await query(
      `INSERT INTO servicedesk_sync_schedules
       (space_id, schedule_type, schedule_config, is_active, next_run_at, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::jsonb, $4, $5, NOW(), NOW())`,
      [
        space_id,
        schedule_type,
        JSON.stringify(schedule_config || {}),
        is_active !== false,
        nextRunAt
      ]
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Sync schedule saved successfully',
    next_run_at: nextRunAt
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/sync-schedule')
export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/sync-schedule')
