import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()
    const { pluginId = body.plugin_id, config, credentials } = body

    if (!pluginId) {
      return NextResponse.json(
        { error: 'pluginId is required' },
        { status: 400 }
      )
    }

    // Update service with management plugin
    const result = await query(
      `UPDATE instance_services
       SET management_plugin_id = $1,
           management_config = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [
        pluginId,
        config ? JSON.stringify(config) : '{}',
        id,
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Create management assignment record
    await query(
      `INSERT INTO service_management_assignments (
        id, instance_service_id, plugin_id, assigned_by, assigned_at, config, credentials, is_active
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, NOW(), $4, $5, true
      )
      ON CONFLICT (instance_service_id, plugin_id)
      DO UPDATE SET
        assigned_at = NOW(),
        config = EXCLUDED.config,
        credentials = EXCLUDED.credentials,
        is_active = true`,
      [
        id,
        pluginId,
        session.user.id,
        config ? JSON.stringify(config) : '{}',
        credentials ? JSON.stringify(credentials) : '{}',
      ]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/infrastructure/services/${id}/assign-plugin`,
      200
    )

    return NextResponse.json({ message: 'Plugin assigned successfully' })
}

export const POST = withErrorHandling(postHandler, 'POST /api/infrastructure/services/[id]/assign-plugin')

