import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Import ServiceDesk configuration
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { space_id, config_data, overwrite } = body

  if (!space_id || !config_data) {
    return NextResponse.json(
      { error: 'space_id and config_data are required' },
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

  const results = {
    field_mappings: 0,
    templates: 0,
    sync_schedule: false
  }

  // Import field mappings
  if (config_data.field_mappings && Array.isArray(config_data.field_mappings)) {
    for (const mapping of config_data.field_mappings) {
      if (overwrite) {
        // Delete existing with same name
        await query(
          `UPDATE servicedesk_field_mappings SET deleted_at = NOW()
           WHERE space_id = $1::uuid AND mapping_name = $2 AND deleted_at IS NULL`,
          [space_id, mapping.mapping_name]
        )
      }

      await query(
        `INSERT INTO servicedesk_field_mappings
         (space_id, mapping_name, mappings, is_default, created_at, updated_at)
         VALUES ($1::uuid, $2, $3::jsonb, $4, NOW(), NOW())
         ON CONFLICT (space_id, mapping_name) WHERE deleted_at IS NULL
         DO UPDATE SET
           mappings = EXCLUDED.mappings,
           is_default = EXCLUDED.is_default,
           updated_at = NOW()`,
        [
          space_id,
          mapping.mapping_name,
          JSON.stringify(mapping.mappings),
          mapping.is_default || false
        ]
      )
      results.field_mappings++
    }
  }

  // Import templates
  if (config_data.templates && Array.isArray(config_data.templates)) {
    for (const template of config_data.templates) {
      if (overwrite) {
        await query(
          `UPDATE servicedesk_ticket_templates SET deleted_at = NOW()
           WHERE space_id = $1::uuid AND name = $2 AND deleted_at IS NULL`,
          [space_id, template.name]
        )
      }

      await query(
        `INSERT INTO servicedesk_ticket_templates
         (space_id, name, description, template_config, created_at, updated_at)
         VALUES ($1::uuid, $2, $3, $4::jsonb, NOW(), NOW())
         ON CONFLICT (space_id, name) WHERE deleted_at IS NULL
         DO UPDATE SET
           description = EXCLUDED.description,
           template_config = EXCLUDED.template_config,
           updated_at = NOW()`,
        [
          space_id,
          template.name,
          template.description || null,
          JSON.stringify(template.template_config)
        ]
      )
      results.templates++
    }
  }

  // Import sync schedule
  if (config_data.sync_schedule) {
    const schedule = config_data.sync_schedule
    let nextRunAt: Date | null = null

    if (schedule.schedule_type === 'interval' && schedule.schedule_config?.interval_minutes) {
      nextRunAt = new Date(Date.now() + schedule.schedule_config.interval_minutes * 60 * 1000)
    } else if (schedule.schedule_type === 'hourly') {
      nextRunAt = new Date(Date.now() + 60 * 60 * 1000)
    } else if (schedule.schedule_type === 'daily' && schedule.schedule_config?.time) {
      const [hours, minutes] = schedule.schedule_config.time.split(':').map(Number)
      nextRunAt = new Date()
      nextRunAt.setHours(hours, minutes, 0, 0)
      if (nextRunAt <= new Date()) {
        nextRunAt.setDate(nextRunAt.getDate() + 1)
      }
    }

    await query(
      `INSERT INTO servicedesk_sync_schedules
       (space_id, schedule_type, schedule_config, is_active, next_run_at, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::jsonb, $4, $5, NOW(), NOW())
       ON CONFLICT (space_id) WHERE deleted_at IS NULL
       DO UPDATE SET
         schedule_type = EXCLUDED.schedule_type,
         schedule_config = EXCLUDED.schedule_config,
         is_active = EXCLUDED.is_active,
         next_run_at = EXCLUDED.next_run_at,
         updated_at = NOW()`,
      [
        space_id,
        schedule.schedule_type,
        JSON.stringify(schedule.schedule_config || {}),
        schedule.is_active !== false,
        nextRunAt
      ]
    )
    results.sync_schedule = true
  }

  return NextResponse.json({
    success: true,
    message: 'Configuration imported successfully',
    results
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/import-config')
