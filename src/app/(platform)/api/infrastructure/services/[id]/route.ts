import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

async function patchHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()

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
    const serviceConfig = body.serviceConfig ?? body.service_config
    if (serviceConfig !== undefined) {
      updates.push(`service_config = $${paramIndex}`)
      values.push(JSON.stringify(serviceConfig))
      paramIndex++
    }
    if (body.endpoints !== undefined) {
      updates.push(`endpoints = $${paramIndex}`)
      values.push(JSON.stringify(body.endpoints))
      paramIndex++
    }
    const healthCheckUrl = body.healthCheckUrl ?? body.health_check_url
    if (healthCheckUrl !== undefined) {
      updates.push(`health_check_url = $${paramIndex}`)
      values.push(healthCheckUrl)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE instance_services
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'PATCH',
      `/api/infrastructure/services/${id}`,
      200
    )

    return NextResponse.json({ message: 'Service updated successfully' })
}



export const PATCH = withErrorHandling(patchHandler, 'PATCH /api/infrastructure/services/[id]')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

    const result = await query(
      `UPDATE instance_services
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/infrastructure/services/${id}`,
      200
    )

    return NextResponse.json({ message: 'Service deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/infrastructure/services/[id]')

