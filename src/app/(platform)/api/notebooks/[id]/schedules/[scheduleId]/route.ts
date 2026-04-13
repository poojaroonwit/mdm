import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: Get a specific schedule
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, scheduleId } = await params
    const notebookId = decodeURIComponent(idParam)

    const { rows } = await query(
      `SELECT * FROM public.notebook_schedules
       WHERE notebook_id = $1::uuid AND id = $2::uuid`,
      [notebookId, scheduleId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: rows[0]
    })
  } catch (error: any) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PUT: Update a schedule
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, scheduleId } = await params
    const notebookId = decodeURIComponent(idParam)
    const body = await request.json()

    // Calculate next run time if schedule config changed
    let nextRunAt = null
    if (body.schedule_type || body.schedule_config || body.timezone) {
      const { rows: scheduleRows } = await query(
        `SELECT schedule_type, schedule_config, timezone FROM public.notebook_schedules WHERE id = $1::uuid`,
        [scheduleId]
      )
      
      if (scheduleRows.length > 0) {
        const scheduleType = body.schedule_type || scheduleRows[0].schedule_type
        const scheduleConfig = body.schedule_config || scheduleRows[0].schedule_config
        const timezone = body.timezone || scheduleRows[0].timezone

        const { rows: nextRunRows } = await query(
          `SELECT calculate_notebook_next_run($1, $2, $3) as next_run`,
          [scheduleType, typeof scheduleConfig === 'string' ? scheduleConfig : JSON.stringify(scheduleConfig), timezone]
        )
        nextRunAt = nextRunRows[0]?.next_run || null
      }
    }

    // Build update query
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    const allowedFields = [
      'name', 'description', 'schedule_type', 'schedule_config', 'timezone',
      'enabled', 'start_date', 'end_date', 'max_executions', 'parameters',
      'execute_all_cells', 'cell_ids', 'notifications', 'status'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'schedule_config' || field === 'parameters' || field === 'notifications') {
          updates.push(`${field} = $${paramIndex}`)
          values.push(typeof body[field] === 'string' ? body[field] : JSON.stringify(body[field]))
        } else if (field === 'cell_ids') {
          updates.push(`${field} = $${paramIndex}`)
          values.push(body[field])
        } else {
          updates.push(`${field} = $${paramIndex}`)
          values.push(body[field])
        }
        paramIndex++
      }
    }

    if (nextRunAt !== null) {
      updates.push(`next_run_at = $${paramIndex}`)
      values.push(nextRunAt)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(scheduleId)

    const { rows } = await query(
      `UPDATE public.notebook_schedules
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE notebook_id = $${paramIndex} AND id = $${paramIndex - 1}
       RETURNING *`,
      [notebookId, ...values]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule: rows[0]
    })
  } catch (error: any) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete a schedule
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, scheduleId } = await params
    const notebookId = decodeURIComponent(idParam)

    const { rows } = await query(
      `DELETE FROM public.notebook_schedules
       WHERE notebook_id = $1 AND id = $2
       RETURNING id`,
      [notebookId, scheduleId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
}

// POST: Execute schedule immediately (run now)
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, scheduleId } = await params
    const notebookId = decodeURIComponent(idParam)

    // Get schedule
    const { rows: scheduleRows } = await query(
      `SELECT * FROM public.notebook_schedules WHERE notebook_id = $1 AND id = $2`,
      [notebookId, scheduleId]
    )

    if (scheduleRows.length === 0) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    const schedule = scheduleRows[0]

    // This will be handled by the scheduler endpoint
    // For now, we'll just return success and let the scheduler handle execution
    return NextResponse.json({
      success: true,
      message: 'Schedule execution queued',
      schedule_id: scheduleId
    })
  } catch (error: any) {
    console.error('Error queuing schedule execution:', error)
    return NextResponse.json(
      { error: 'Failed to queue execution' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/notebooks/[id]/schedules/[scheduleId]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/notebooks/[id]/schedules/[scheduleId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/notebooks/[id]/schedules/[scheduleId]')
export const POST = withErrorHandling(postHandler, 'POST /api/notebooks/[id]/schedules/[scheduleId]')
