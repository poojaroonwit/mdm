import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskConfig } from '@/lib/manageengine-servicedesk-helper'

// Export ServiceDesk configuration
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

  const config = await getServiceDeskConfig()

  // Get field mappings
  const { rows: mappingRows } = await query(
    `SELECT mapping_name, mappings, is_default
     FROM servicedesk_field_mappings
     WHERE space_id = $1::uuid AND deleted_at IS NULL`,
    [space_id]
  )

  // Get templates
  const { rows: templateRows } = await query(
    `SELECT name, description, template_config
     FROM servicedesk_ticket_templates
     WHERE space_id = $1::uuid AND deleted_at IS NULL`,
    [space_id]
  )

  // Get sync schedule
  const { rows: scheduleRows } = await query(
    `SELECT schedule_type, schedule_config, is_active
     FROM servicedesk_sync_schedules
     WHERE space_id = $1::uuid AND deleted_at IS NULL
     LIMIT 1`,
    [space_id]
  )

  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    space_id,
    config: config ? {
      name: config.name,
      baseUrl: config.baseUrl,
      isActive: config.isActive
    } : null,
    field_mappings: mappingRows,
    templates: templateRows,
    sync_schedule: scheduleRows[0] || null
  }

  return NextResponse.json(exportData, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="servicedesk-config-${space_id}-${Date.now()}.json"`
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/export-config')
