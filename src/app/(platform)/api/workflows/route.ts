import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      data_model_id: commonSchemas.id.optional(),
      dataModelId: commonSchemas.id.optional(),
      status: z.string().optional(),
      trigger_type: z.string().optional(),
      triggerType: z.string().optional(),
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '20')).pipe(z.number().int().positive().max(100)).optional().default(20),
    }))
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { 
      data_model_id, 
      dataModelId: queryDataModelId, 
      status, 
      trigger_type, 
      triggerType: queryTriggerType, 
      page, 
      limit = 20 
    } = queryValidation.data
    const dataModelId = data_model_id || queryDataModelId
    const triggerType = trigger_type || queryTriggerType
    logger.apiRequest('GET', '/api/workflows', { userId: session.user.id, page, limit, dataModelId, status, triggerType })

    const offset = (page - 1) * limit

    // Build query with filters
    let whereConditions = ['w.is_active = true']
    let params: any[] = []
    let paramIndex = 1

    if (dataModelId) {
      whereConditions.push(`w.data_model_id = $${paramIndex}`)
      params.push(dataModelId)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`w.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (triggerType) {
      whereConditions.push(`w.trigger_type = $${paramIndex}`)
      params.push(triggerType)
      paramIndex++
    }

    const whereClause = whereConditions.join(' AND ')

    // Get workflows with related data
    const workflowsQuery = `
      SELECT 
        w.id,
        w.name,
        w.description,
        w.trigger_type,
        w.status,
        w.is_active,
        w.created_at,
        w.updated_at,
        dm.name as data_model_name,
        dm.display_name as data_model_display_name,
        u.name as created_by_name,
        COUNT(we.id) as execution_count,
        COUNT(CASE WHEN we.status = 'COMPLETED' THEN 1 END) as successful_executions,
        COUNT(CASE WHEN we.status = 'FAILED' THEN 1 END) as failed_executions
      FROM workflows w
      LEFT JOIN data_models dm ON w.data_model_id = dm.id
      LEFT JOIN users u ON w.created_by = u.id
      LEFT JOIN workflow_executions we ON w.id = we.workflow_id
      WHERE ${whereClause}
      GROUP BY w.id, w.name, w.description, w.trigger_type, w.status, w.is_active, 
               w.created_at, w.updated_at, dm.name, dm.display_name, u.name
      ORDER BY w.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(limit, offset)

    const { rows: workflows } = await query(workflowsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM workflows w
      WHERE ${whereClause}
    `
    const { rows: countRows } = await query(countQuery, params.slice(0, -2))
    const total = parseInt(countRows[0].total)

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/workflows', 200, duration, { total })
    return NextResponse.json({
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/workflows')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      data_model_id: commonSchemas.id.optional(),
      dataModelId: commonSchemas.id.optional(),
      trigger_type: z.enum(['SCHEDULED', 'EVENT_BASED', 'MANUAL']).optional(),
      triggerType: z.enum(['SCHEDULED', 'EVENT_BASED', 'MANUAL']).optional(),
      status: z.string().optional().default('ACTIVE'),
      conditions: z.array(z.any()).optional().default([]),
      actions: z.array(z.any()).optional().default([]),
      schedule: z.any().optional().nullable().default(null),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const {
      name,
      description,
      data_model_id,
      dataModelId: bodyDataModelId,
      trigger_type,
      triggerType: bodyTriggerType,
      status = 'ACTIVE',
      conditions = [],
      actions = [],
      schedule = null
    } = bodyValidation.data

    const finalDataModelId = data_model_id || bodyDataModelId
    const finalTriggerType = trigger_type || bodyTriggerType

    if (!finalDataModelId) {
      return NextResponse.json({ error: 'data_model_id is required' }, { status: 400 })
    }
    if (!finalTriggerType) {
      return NextResponse.json({ error: 'trigger_type is required' }, { status: 400 })
    }
    logger.apiRequest('POST', '/api/workflows', { userId: session.user.id, name, trigger_type: finalTriggerType })

    // Create workflow
    const { rows: workflowRows } = await query(
      `INSERT INTO workflows (name, description, data_model_id, trigger_type, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, finalDataModelId, finalTriggerType, status, session.user.id]
    )
    const workflow = workflowRows[0]

    // Create conditions
    if (conditions.length > 0) {
      for (const condition of conditions) {
        await query(
          `INSERT INTO workflow_conditions 
           (workflow_id, attribute_id, operator, value, logical_operator, condition_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflow.id,
            condition.attribute_id,
            condition.operator,
            condition.value,
            condition.logical_operator || 'AND',
            condition.condition_order || 0
          ]
        )
      }
    }

    // Create actions
    if (actions.length > 0) {
      for (const action of actions) {
        await query(
          `INSERT INTO workflow_actions 
           (workflow_id, target_attribute_id, action_type, new_value, calculation_formula, 
            source_attribute_id, action_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            workflow.id,
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

    // Create schedule if provided (for SCHEDULED workflows) or integration config (for EVENT_BASED)
    if (schedule) {
      if (finalTriggerType === 'SCHEDULED') {
        // Scheduled workflow with time-based schedule
        await query(
          `INSERT INTO workflow_schedules 
           (workflow_id, schedule_type, schedule_config, start_date, end_date, timezone)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflow.id,
            schedule.schedule_type,
            JSON.stringify(schedule.schedule_config || {}),
            schedule.start_date || null,
            schedule.end_date || null,
            schedule.timezone || 'UTC'
          ]
        )
      } else if (finalTriggerType === 'EVENT_BASED' && schedule.schedule_config?.trigger_on_sync) {
        // Event-based workflow triggered by data syncs
        await query(
          `INSERT INTO workflow_schedules 
           (workflow_id, schedule_type, schedule_config, trigger_on_sync, trigger_on_sync_schedule_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            workflow.id,
            'CUSTOM_CRON', // Use as placeholder for event-based
            JSON.stringify(schedule.schedule_config || {}),
            true,
            schedule.schedule_config?.trigger_on_sync_schedule_id || null
          ]
        )
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/workflows', 201, duration, { workflowId: workflow.id })
    return NextResponse.json({ workflow }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/workflows')
