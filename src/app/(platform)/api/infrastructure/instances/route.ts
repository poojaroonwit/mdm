import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

async function getHandler(request: NextRequest) {
    // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 100,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const permission = await checkPermission({
      resource: 'infrastructure',
      action: 'read',
      spaceId: spaceId || null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let whereConditions = ['ii.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    if (spaceId) {
      whereConditions.push(`ii.space_id::text = $${paramIndex}`)
      queryParams.push(spaceId)
      paramIndex++
    } else {
      const userSpaces = await query(
        `SELECT id FROM spaces 
         WHERE (created_by::text = $1 OR id::text IN (
           SELECT space_id::text FROM space_members WHERE user_id::text = $1
         )) AND deleted_at IS NULL`,
        [session.user.id]
      )
      
      if (userSpaces.rows.length > 0) {
        const spaceIds = userSpaces.rows.map((r: any) => r.id)
        whereConditions.push(`ii.space_id::text = ANY($${paramIndex}::text[])`)
        queryParams.push(spaceIds)
        paramIndex++
      } else {
        return NextResponse.json({ instances: [], total: 0 })
      }
    }

    if (type) {
      whereConditions.push(`ii.type = $${paramIndex}`)
      queryParams.push(type)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`ii.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    const instancesQuery = `
      SELECT 
        ii.id,
        ii.name,
        ii.type,
        ii.host,
        ii.port,
        ii.protocol,
        ii.connection_type,
        ii.connection_config,
        ii.status,
        ii.last_health_check,
        ii.health_status,
        ii.os_type,
        ii.os_version,
        ii.resources,
        ii.tags,
        ii.space_id,
        ii.created_by,
        ii.created_at,
        ii.updated_at,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM infrastructure_instances ii
      LEFT JOIN spaces s ON s.id::text = ii.space_id::text
      WHERE ${whereClause}
      ORDER BY ii.created_at DESC
    `

    const result = await query(instancesQuery, queryParams)

    const instances = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      host: row.host,
      port: row.port,
      protocol: row.protocol,
      connectionType: row.connection_type,
      connectionConfig: row.connection_config,
      status: row.status,
      lastHealthCheck: row.last_health_check,
      healthStatus: row.health_status,
      osType: row.os_type,
      osVersion: row.os_version,
      resources: row.resources,
      tags: row.tags,
      spaceId: row.space_id,
      space: row.space,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/infrastructure/instances',
      200,
      spaceId || undefined
    )

  return NextResponse.json({ instances, total: instances.length })
}



export const GET = withErrorHandling(getHandler, 'GET /api/infrastructure/instances')
async function postHandler(request: NextRequest) {
    // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 50, // Lower limit for POST
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const body = await request.json()
    const {
      name,
      type,
      host,
      port,
      protocol,
      // Handle both camelCase and snake_case for compatibility
      connectionType = body.connection_type,
      connectionConfig = body.connection_config,
      spaceId = body.space_id,
      tags,
    } = body

    if (!name || !type || !host || !connectionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check permission
    const permission = await checkPermission({
      resource: 'infrastructure',
      action: 'create',
      spaceId: spaceId || null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    // Create instance
    const result = await query(
      `INSERT INTO infrastructure_instances (
        id, name, type, host, port, protocol, connection_type, connection_config,
        space_id, created_by, tags, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'unknown', NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        type,
        host,
        port || null,
        protocol || 'ssh',
        connectionType,
        connectionConfig ? JSON.stringify(connectionConfig) : '{}',
        spaceId || null,
        session.user.id,
        tags || [],
      ]
    )

    const instanceId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/infrastructure/instances',
      201,
      spaceId || undefined
    )

    return NextResponse.json(
      { id: instanceId, message: 'Instance created successfully' },
      { status: 201 }
    )
}

export const POST = withErrorHandling(postHandler, 'POST /api/infrastructure/instances')

