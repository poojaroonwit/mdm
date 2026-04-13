import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

/**
 * Create a remote service (service without a VM)
 * Uses a special "remote-services" infrastructure instance as a container
 */
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { 
      name, 
      type, 
      managementPluginId = body.management_plugin_id, 
      managementConfig = body.management_config, 
      endpoints,
      spaceId = body.space_id
    } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      )
    }

    // Get or create a special "remote-services" infrastructure instance
    // This acts as a container for all remote services
    let remoteInstanceId: string
    
    const instanceResult = await query(
      `SELECT id FROM infrastructure_instances 
       WHERE name = 'Remote Services' AND type = 'cloud_instance' AND deleted_at IS NULL
       LIMIT 1`,
      []
    )

    if (instanceResult.rows.length > 0) {
      remoteInstanceId = instanceResult.rows[0].id
    } else {
      // Create the remote services container instance
      const createInstanceResult = await query(
        `INSERT INTO infrastructure_instances (
          id, name, type, host, protocol, connection_type, connection_config,
          status, space_id, created_by, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), 'Remote Services', 'cloud_instance', 'remote', 'http',
          'http', '{}'::jsonb, 'online', 
          CAST($1 AS uuid), 
          CAST($2 AS uuid), 
          NOW(), NOW()
        ) RETURNING id`,
        [spaceId || null, session.user.id]
      )
      remoteInstanceId = createInstanceResult.rows[0].id
    }

    // Create the remote service
    const result = await query(
      `INSERT INTO instance_services (
        id, instance_id, name, type, service_config, endpoints, 
        management_plugin_id, management_config,
        discovered_at, last_seen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, '{}'::jsonb, $4, $5, $6, NOW(), NOW(), NOW(), NOW()
      ) RETURNING id`,
      [
        remoteInstanceId,
        name,
        type,
        endpoints ? JSON.stringify(endpoints) : '[]',
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
      '/api/infrastructure/services/remote',
      201
    )

    return NextResponse.json(
      { id: serviceId, message: 'Remote service created successfully' },
      { status: 201 }
    )
}

export const POST = withErrorHandling(postHandler, 'POST /api/infrastructure/services/remote')

