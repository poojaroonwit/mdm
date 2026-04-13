import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { triggerAssignmentNotification } from '@/lib/notification-triggers'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
      status: z.string().optional().default(''),
      assignedTo: commonSchemas.id.optional(),
    }))
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { page, limit = 10, status = '', assignedTo } = queryValidation.data
    logger.apiRequest('GET', '/api/assignments', { userId: session.user.id, page, limit, status })

    const offset = (page - 1) * limit
    const filters: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (status) { params.push(status); filters.push(`status = $${params.length}`) }
    if (assignedTo) { params.push(assignedTo); filters.push(`assigned_to = $${params.length}`) }
    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''
    const listSql = `SELECT * FROM assignments ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    const countSql = `SELECT COUNT(*)::int AS total FROM assignments ${where}`
    const [{ rows: assignments }, { rows: totals }] = await Promise.all([
      query(listSql, [...params, limit, offset]),
      query(countSql, params),
    ])
    const total = totals[0]?.total || 0
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/assignments', 200, duration, { total })
    return NextResponse.json({ assignments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
}

export const GET = withErrorHandling(getHandler, 'GET /api/assignments')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      status: z.string().optional().default('TODO'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
      dueDate: z.string().datetime().optional().nullable(),
      startDate: z.string().datetime().optional().nullable(),
      assignedTo: commonSchemas.id.optional().nullable(),
      customerIds: z.array(commonSchemas.id).optional().default([]),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const {
      title,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      dueDate,
      startDate,
      assignedTo,
      customerIds = [],
    } = bodyValidation.data
    logger.apiRequest('POST', '/api/assignments', { userId: session.user.id, title, status, priority })

    const { rows: insertRows } = await query(
      `INSERT INTO assignments (title, description, status, priority, due_date, start_date, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description ?? null, status || 'TODO', priority || 'MEDIUM', dueDate || null, startDate || null, assignedTo || null, session.user.id]
    )
    const assignment = insertRows[0]

    if (customerIds && customerIds.length > 0) {
      const values = customerIds.map((_: any, i: number) => `($1, $${i + 2})`).join(', ')
      await query(
        `INSERT INTO customer_assignments (assignment_id, customer_id) VALUES ${values}`,
        [assignment.id, ...customerIds]
      )
    }

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['CREATE', 'Assignment', assignment.id, assignment, session.user.id]
    )

    // Trigger notification for assignment creation
    if (assignedTo) {
      await triggerAssignmentNotification(
        assignment.id,
        assignedTo,
        session.user.id,
        title,
        description || '',
        'ASSIGNMENT_CREATED',
        priority || 'MEDIUM'
      );
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/assignments', 201, duration, { assignmentId: assignment.id })
    return NextResponse.json(assignment, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/assignments')
