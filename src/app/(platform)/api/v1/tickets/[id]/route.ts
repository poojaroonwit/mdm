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
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.start_date,
        t.estimate,
        t.created_at,
        t.updated_at,
        json_agg(DISTINCT jsonb_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        )) FILTER (WHERE u.id IS NOT NULL) as assignees,
        json_agg(DISTINCT jsonb_build_object(
          'space', jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'slug', s.slug
          )
        )) FILTER (WHERE s.id IS NOT NULL) as spaces
      FROM tickets t
      LEFT JOIN ticket_assignees ta ON ta.ticket_id = t.id
      LEFT JOIN users u ON u.id = ta.user_id
      LEFT JOIN ticket_spaces ts2 ON ts2.ticket_id = t.id
      LEFT JOIN spaces s ON s.id = ts2.space_id
      WHERE t.id = $1 AND t.deleted_at IS NULL
      GROUP BY t.id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const ticket = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      startDate: row.start_date,
      estimate: row.estimate,
      assignee: row.assignees?.[0] || null,
      assignees: row.assignees || [],
      spaces: row.spaces || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/v1/tickets/${id}`,
      200
    )

    return NextResponse.json({ ticket })
  } catch (error: any) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket', details: error.message },
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
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimate,
      spaceId = body.space_id,
      assignedTo = body.assigned_to,
    } = body

    // Check permission
    const permission = await checkPermission({
      resource: 'tickets',
      action: 'update',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      values.push(title)
      paramIndex++
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(description)
      paramIndex++
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex}`)
      values.push(priority)
      paramIndex++
    }
    if (dueDate !== undefined) {
      updates.push(`due_date = $${paramIndex}`)
      values.push(dueDate ? new Date(dueDate) : null)
      paramIndex++
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`)
      values.push(startDate ? new Date(startDate) : null)
      paramIndex++
    }
    if (estimate !== undefined) {
      updates.push(`estimate = $${paramIndex}`)
      values.push(estimate)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const updateQuery = `
      UPDATE tickets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING id
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Update space association if provided
    if (spaceId !== undefined) {
      await query(
        `DELETE FROM ticket_spaces WHERE ticket_id = $1`,
        [id]
      )
      if (spaceId) {
        await query(
          `INSERT INTO ticket_spaces (id, ticket_id, space_id, created_at)
           VALUES (gen_random_uuid(), $1, $2, NOW())
           ON CONFLICT DO NOTHING`,
          [id, spaceId]
        )
      }
    }

    // Update assignees if provided
    if (assignedTo !== undefined) {
      await query(
        `DELETE FROM ticket_assignees WHERE ticket_id = $1`,
        [id]
      )
      if (assignedTo) {
        await query(
          `INSERT INTO ticket_assignees (id, ticket_id, user_id, role, created_at)
           VALUES (gen_random_uuid(), $1, $2, 'ASSIGNEE', NOW())
           ON CONFLICT DO NOTHING`,
          [id, assignedTo]
        )
      }
    }

    await logAPIRequest(
      session.user.id,
      'PUT',
      `/api/v1/tickets/${id}`,
      200
    )

    return NextResponse.json({ message: 'Ticket updated successfully' })
  } catch (error: any) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket', details: error.message },
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

    // Check permission
    const permission = await checkPermission({
      resource: 'tickets',
      action: 'delete',
      resourceId: id,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    // Soft delete
    const result = await query(
      `UPDATE tickets
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    await logAPIRequest(
      session.user.id,
      'DELETE',
      `/api/v1/tickets/${id}`,
      200
    )

    return NextResponse.json({ message: 'Ticket deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/v1/tickets/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/v1/tickets/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/v1/tickets/[id]')
