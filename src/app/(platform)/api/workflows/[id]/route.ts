import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: workflowId } = paramValidation.data
    logger.apiRequest('GET', `/api/workflows/${workflowId}`, { userId: session.user.id })

    // Get workflow details
    const { rows: workflowRows } = await query(
      `SELECT 
        w.*,
        dm.name as data_model_name,
        dm.display_name as data_model_display_name,
        u.name as created_by_name
       FROM workflows w
       LEFT JOIN data_models dm ON w.data_model_id = dm.id
       LEFT JOIN users u ON w.created_by = u.id
       WHERE w.id::text = $1`,
      [workflowId]
    )

    if (workflowRows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = workflowRows[0]

    // Get conditions
    const { rows: conditions } = await query(
      `SELECT 
        wc.*,
        dma.name as attribute_name,
        dma.display_name as attribute_display_name,
        dma.type as attribute_type
       FROM workflow_conditions wc
       JOIN data_model_attributes dma ON wc.attribute_id = dma.id
       WHERE wc.workflow_id::text = $1
       ORDER BY wc.condition_order`,
      [workflowId]
    )

    // Get actions
    const { rows: actions } = await query(
      `SELECT 
        wa.*,
        dma.name as target_attribute_name,
        dma.display_name as target_attribute_display_name,
        dma.type as target_attribute_type,
        source_dma.name as source_attribute_name,
        source_dma.display_name as source_attribute_display_name
       FROM workflow_actions wa
       JOIN data_model_attributes dma ON wa.target_attribute_id = dma.id
       LEFT JOIN data_model_attributes source_dma ON wa.source_attribute_id = source_dma.id
       WHERE wa.workflow_id::text = $1
       ORDER BY wa.action_order`,
      [workflowId]
    )

    // Get schedule
    const { rows: scheduleRows } = await query(
      `SELECT * FROM workflow_schedules 
       WHERE workflow_id::text = $1 AND is_active = true`,
      [workflowId]
    )

    // Get recent executions
    const { rows: executions } = await query(
      `SELECT 
        id, execution_type, status, started_at, completed_at,
        records_processed, records_updated, error_message
       FROM workflow_executions 
       WHERE workflow_id::text = $1
       ORDER BY started_at DESC
       LIMIT 10`,
      [workflowId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/workflows/${workflowId}`, 200, duration, {
      conditionCount: conditions.length,
      actionCount: actions.length,
      executionCount: executions.length,
    })
    return NextResponse.json({
      workflow,
      conditions,
      actions,
      schedule: scheduleRows[0] || null,
      recent_executions: executions
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/workflows/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: workflowId } = paramValidation.data
    logger.apiRequest('PUT', `/api/workflows/${workflowId}`, { userId: session.user.id })

    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      trigger_type: z.enum(['MANUAL', 'SCHEDULED', 'EVENT_BASED']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      conditions: z.array(z.any()).optional().default([]),
      actions: z.array(z.any()).optional().default([]),
      schedule: z.any().optional().nullable().default(null),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const {
      name,
      description,
      trigger_type,
      status,
      conditions = [],
      actions = [],
      schedule = null
    } = bodyValidation.data

    // Update workflow
    const { rows: workflowRows } = await query(
      `UPDATE workflows 
       SET name = $1, description = $2, trigger_type = $3, status = $4, updated_at = NOW()
       WHERE id::text = $5
       RETURNING *`,
      [name, description, trigger_type, status, workflowId]
    )

    if (workflowRows.length === 0) {
      logger.warn('Workflow not found for update', { workflowId })
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = workflowRows[0]

    // Delete existing conditions and actions
    await query('DELETE FROM workflow_conditions WHERE workflow_id::text = $1', [workflowId])
    await query('DELETE FROM workflow_actions WHERE workflow_id::text = $1', [workflowId])
    await query('DELETE FROM workflow_schedules WHERE workflow_id::text = $1', [workflowId])

    // Create new conditions
    if (conditions.length > 0) {
      for (const condition of conditions) {
        await query(
          `INSERT INTO workflow_conditions 
           (workflow_id, attribute_id, operator, value, logical_operator, condition_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflowId,
            condition.attribute_id,
            condition.operator,
            condition.value,
            condition.logical_operator || 'AND',
            condition.condition_order || 0
          ]
        )
      }
    }

    // Create new actions
    if (actions.length > 0) {
      for (const action of actions) {
        await query(
          `INSERT INTO workflow_actions 
           (workflow_id, target_attribute_id, action_type, new_value, calculation_formula, 
            source_attribute_id, action_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            workflowId,
            action.target_attribute_id,
            action.action_type,
            action.new_value,
            action.calculation_formula,
            action.source_attribute_id,
            action.action_order || 0
          ]
        )
      }
    }

    // Create new schedule if provided (for SCHEDULED workflows) or integration config (for EVENT_BASED)
    if (schedule) {
      if (trigger_type === 'SCHEDULED') {
        // Scheduled workflow with time-based schedule
        await query(
          `INSERT INTO workflow_schedules 
           (workflow_id, schedule_type, schedule_config, start_date, end_date, timezone)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflowId,
            schedule.schedule_type,
            JSON.stringify(schedule.schedule_config || {}),
            schedule.start_date || null,
            schedule.end_date || null,
            schedule.timezone || 'UTC'
          ]
        )
      } else if (trigger_type === 'EVENT_BASED' && schedule.schedule_config?.trigger_on_sync) {
        // Event-based workflow triggered by data syncs
        await query(
          `INSERT INTO workflow_schedules 
           (workflow_id, schedule_type, schedule_config, trigger_on_sync, trigger_on_sync_schedule_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            workflowId,
            'CUSTOM_CRON', // Use as placeholder for event-based
            JSON.stringify(schedule.schedule_config || {}),
            true,
            schedule.schedule_config?.trigger_on_sync_schedule_id || null
          ]
        )
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/workflows/${workflowId}`, 200, duration, {
      conditionCount: conditions.length,
      actionCount: actions.length,
    })
    return NextResponse.json({ workflow })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/workflows/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: workflowId } = paramValidation.data
    logger.apiRequest('DELETE', `/api/workflows/${workflowId}`, { userId: session.user.id })

    // Soft delete workflow
    const { rows } = await query(
      `UPDATE workflows 
       SET is_active = false, deleted_at = NOW()
       WHERE id::text = $1
       RETURNING *`,
      [workflowId]
    )

    if (rows.length === 0) {
      logger.warn('Workflow not found for deletion', { workflowId })
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/workflows/${workflowId}`, 200, duration)
    return NextResponse.json({ message: 'Workflow deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/workflows/[id]')
