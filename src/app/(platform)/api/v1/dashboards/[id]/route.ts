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
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await query(
      `SELECT 
        d.*,
        json_build_object(
          'id', s.id,
          'name', s.name,
          'slug', s.slug
        ) as space
      FROM dashboards d
      LEFT JOIN spaces s ON s.id = d.space_id
      WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const dashboard = {
      id: row.id,
      name: row.name,
      description: row.description,
      spaceId: row.space_id,
      space: row.space,
      layout: row.layout,
      widgets: row.widgets,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/v1/dashboards/${id}`,
      200
    )

    return NextResponse.json({ dashboard })
  } catch (error: any) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard', details: error.message },
      { status: 500 }
    )
  }
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const permission = await checkPermission({
      resource: 'dashboards',
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
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(body.description)
      paramIndex++
    }
    if (body.layout !== undefined) {
      updates.push(`layout = $${paramIndex}`)
      values.push(JSON.stringify(body.layout))
      paramIndex++
    }
    if (body.widgets !== undefined) {
      updates.push(`widgets = $${paramIndex}`)
      values.push(JSON.stringify(body.widgets))
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE dashboards
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/v1/dashboards/${id}`,
      200
    )

    return NextResponse.json({ message: 'Dashboard updated successfully' })
  } catch (error: any) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
      { status: 500 }
    )
  }
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const permission = await checkPermission({
      resource: 'dashboards',
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
      `UPDATE dashboards
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/v1/dashboards/${id}`,
      200
    )

    return NextResponse.json({ message: 'Dashboard deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/v1/dashboards/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/v1/dashboards/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/v1/dashboards/[id]')
