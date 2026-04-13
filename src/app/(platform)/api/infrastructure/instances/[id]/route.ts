import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    const result = await query(
      `SELECT 
        ii.*,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM infrastructure_instances ii
      LEFT JOIN spaces s ON s.id = ii.space_id
      WHERE ii.id = $1 AND ii.deleted_at IS NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const instance = {
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
    }

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/infrastructure/instances/${id}`,
      200
    )

    return NextResponse.json({ instance })
}



export const GET = withErrorHandling(getHandler, 'GET /api/infrastructure/instances/[id]')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()

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

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(body.name)
      paramIndex++
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }
    const connectionConfig = body.connectionConfig ?? body.connection_config
    if (connectionConfig !== undefined) {
      updates.push(`connection_config = $${paramIndex}`)
      values.push(JSON.stringify(connectionConfig))
      paramIndex++
    }
    const healthStatus = body.healthStatus ?? body.health_status
    if (healthStatus !== undefined) {
      updates.push(`health_status = $${paramIndex}`)
      values.push(JSON.stringify(healthStatus))
      paramIndex++
    }
    const lastHealthCheck = body.lastHealthCheck ?? body.last_health_check
    if (lastHealthCheck !== undefined) {
      updates.push(`last_health_check = $${paramIndex}`)
      values.push(lastHealthCheck ? new Date(lastHealthCheck) : null)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE infrastructure_instances
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/infrastructure/instances/${id}`,
      200
    )

    return NextResponse.json({ message: 'Instance updated successfully' })
}



export const PUT = withErrorHandling(putHandler, 'PUT /api/infrastructure/instances/[id]')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    const permission = await checkPermission({
      resource: 'infrastructure',
      action: 'delete',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    const result = await query(
      `UPDATE infrastructure_instances
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/infrastructure/instances/${id}`,
      200
    )

    return NextResponse.json({ message: 'Instance deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/infrastructure/instances/[id]')

