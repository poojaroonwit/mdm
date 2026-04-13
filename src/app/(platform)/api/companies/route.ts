import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody } from '@/lib/api-validation'
import { handleApiError, requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
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
      search: z.string().optional().default(''),
    }))
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { page, limit = 10, search = '' } = queryValidation.data
    logger.apiRequest('GET', '/api/companies', { userId: session.user.id, page, limit, search })

    const offset = (page - 1) * limit

    const whereClauses: string[] = ['deleted_at IS NULL']
    const params: any[] = []
    if (search) {
      whereClauses.push('(name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 2) + ')')
      params.push(`%${search}%`, `%${search}%`)
    }
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const companiesSql = `
      SELECT c.*,
             (
               SELECT COUNT(*)::int
               FROM customers cu
               WHERE cu.company_id::text = c.id::text AND cu.deleted_at IS NULL
             ) AS customers_count
      FROM companies c
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM companies c
      ${whereSql}
    `

    const companiesRes = await query(companiesSql, [...params, limit, offset])
    const countRes = await query(countSql, params)
    const companies = companiesRes.rows
    const total = countRes.rows[0]?.total || 0
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/companies', 200, duration, { total })
    return NextResponse.json({
      companies: companies || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/companies')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Company name is required'),
      description: z.string().optional(),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const { name, description } = bodyValidation.data
    logger.apiRequest('POST', '/api/companies', { userId: session.user.id, name })

    // Check if company already exists
    const existing = await query(
      'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL LIMIT 1',
      [name]
    )

    if (existing.rows[0]) {
      logger.warn('Company with this name already exists', { name })
      return NextResponse.json(
        { error: 'Company with this name already exists' },
        { status: 400 }
      )
    }

    const inserted = await query(
      'INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *',
      [name, description ?? null]
    )
    const company = inserted.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['CREATE', 'Company', company.id, company, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/companies', 201, duration, { companyId: company.id })
    return NextResponse.json(company, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/companies')
