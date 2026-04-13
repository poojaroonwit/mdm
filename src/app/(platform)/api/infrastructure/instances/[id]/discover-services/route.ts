import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { DockerConnector } from '@/features/infrastructure/lib/instance-connectors/docker-connector'
import { SSHConnector } from '@/features/infrastructure/lib/instance-connectors/ssh-connector'
import { DockerDiscovery } from '@/features/infrastructure/lib/service-discovery/docker-discovery'
import { SystemdDiscovery } from '@/features/infrastructure/lib/service-discovery/systemd-discovery'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    // Get instance
    const instanceResult = await query(
      'SELECT * FROM infrastructure_instances WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (instanceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const instance = instanceResult.rows[0]

    // Check permission
    const permission = await checkPermission({
      resource: 'infrastructure',
      action: 'update',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let discoveredServices: any[] = []

    // Discover services based on instance type
    if (instance.type === 'docker_host') {
      const connector = new DockerConnector({
        host: instance.host,
        port: instance.port,
        protocol: instance.connection_config?.protocol || 'http',
        socketPath: instance.connection_config?.socketPath,
      })

      const discovery = new DockerDiscovery(connector)
      discoveredServices = await discovery.discoverServices()
    } else if (instance.type === 'vm') {
      const connector = new SSHConnector({
        host: instance.host,
        port: instance.port || 22,
        username: instance.connection_config?.username || 'root',
        password: instance.connection_config?.password,
        privateKey: instance.connection_config?.privateKey,
        passphrase: instance.connection_config?.passphrase,
      })

      const discovery = new SystemdDiscovery(connector)
      discoveredServices = await discovery.discoverServices()
    }

    // Save discovered services to database
    const savedServices = []
    for (const service of discoveredServices) {
      try {
        const result = await query(
          `INSERT INTO instance_services (
            id, instance_id, name, type, status, service_config, endpoints,
            discovered_at, last_seen, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW(), NOW()
          )
          ON CONFLICT (instance_id, name, type)
          DO UPDATE SET
            status = EXCLUDED.status,
            service_config = EXCLUDED.service_config,
            endpoints = EXCLUDED.endpoints,
            last_seen = NOW(),
            updated_at = NOW()
          RETURNING id`,
          [
            id,
            service.name,
            service.type,
            service.status,
            JSON.stringify(service.serviceConfig || {}),
            JSON.stringify(service.endpoints || []),
          ]
        )

        savedServices.push({
          id: result.rows[0].id,
          ...service,
        })
      } catch (error) {
        console.error('Error saving service:', error)
      }
    }

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/infrastructure/instances/${id}/discover-services`,
      200
    )

    return NextResponse.json({
      services: savedServices,
      count: savedServices.length,
      message: `Discovered ${savedServices.length} services`,
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/infrastructure/instances/[id]/discover-services')

