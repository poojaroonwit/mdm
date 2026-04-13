import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    // Get services for this instance
    const result = await query(
      `SELECT 
        is.*,
        json_build_object(
          'id', sr.id,
          'name', sr.name,
          'slug', sr.slug
        ) as management_plugin
      FROM instance_services is
      LEFT JOIN service_registry sr ON sr.id = is.management_plugin_id
      WHERE is.instance_id = $1
      ORDER BY is.discovered_at DESC`,
      [id]
    )

    const services = result.rows.map((row: any) => ({
      id: row.id,
      instanceId: row.instance_id,
      name: row.name,
      type: row.type,
      status: row.status,
      serviceConfig: row.service_config,
      endpoints: row.endpoints,
      healthCheckUrl: row.health_check_url,
      managementPluginId: row.management_plugin_id,
      managementConfig: row.management_config,
      managementPlugin: row.management_plugin,
      discoveredAt: row.discovered_at,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/infrastructure/instances/${id}/services`,
      200
    )

    return NextResponse.json({ services })
}



export const GET = withErrorHandling(getHandler, 'GET /api/infrastructure/instances/[id]/services')

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult


    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      type, 
      serviceConfig = body.service_config, 
      endpoints, 
      healthCheckUrl = body.health_check_url,
      managementPluginId = body.management_plugin_id,
      managementConfig = body.management_config
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    // Create service
    const result = await query(
      `INSERT INTO instance_services (
        id, instance_id, name, type, service_config, endpoints, health_check_url,
        management_plugin_id, management_config,
        discovered_at, last_seen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW(), NOW()
      ) RETURNING id`,
      [
        id,
        name,
        type,
        serviceConfig ? JSON.stringify(serviceConfig) : '{}',
        endpoints ? JSON.stringify(endpoints) : '[]',
        healthCheckUrl || null,
        managementPluginId || null,
        managementConfig ? JSON.stringify(managementConfig) : '{}',
      ]
    )

    const serviceId = result.rows[0].id

    // Create management assignment if plugin is provided
    if (managementPluginId) {
      await query(
        `INSERT INTO service_management_assignments (
          id, instance_service_id, plugin_id, assigned_by, assigned_at, 
          config, credentials, is_active
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, NOW(), $4, '{}'::jsonb, true
        )
        ON CONFLICT (instance_service_id, plugin_id)
        DO UPDATE SET
          assigned_at = NOW(),
          config = EXCLUDED.config,
          is_active = true`,
        [
          serviceId,
          managementPluginId,
          session.user.id,
          managementConfig ? JSON.stringify(managementConfig) : '{}',
        ]
      )
    }

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/infrastructure/instances/${id}/services`,
      201
    )

    return NextResponse.json(
      { id: serviceId, message: 'Service created successfully' },
      { status: 201 }
    )
}

export const POST = withErrorHandling(postHandler, 'POST /api/infrastructure/instances/[id]/services')