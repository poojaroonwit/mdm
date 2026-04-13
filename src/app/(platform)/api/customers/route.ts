import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { triggerCustomerNotification } from '@/lib/notification-triggers'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate query parameters - use passthrough for complex filters
    const queryValidation = validateQuery(request, z.object({
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
      search: z.string().optional().default(''),
      status: z.string().optional().default(''),
      sort: z.string().optional().default(''),
      order: z.enum(['asc', 'desc']).optional().default('asc'),
    }).passthrough())
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { searchParams } = new URL(request.url)
    const { page, limit = 10, search = '', status: statusParam = '', sort = '', order = 'asc' } = queryValidation.data
    
    // Multi-select filters
    const companies = searchParams.get('companies')?.split(',').filter(Boolean) || []
    const industries = searchParams.get('industries')?.split(',').filter(Boolean) || []
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || []
    const events = searchParams.get('events')?.split(',').filter(Boolean) || []
    const positions = searchParams.get('positions')?.split(',').filter(Boolean) || []
    const businessProfiles = (searchParams.get('businessProfiles') || searchParams.get('business_profiles'))?.split(',').filter(Boolean) || []
    const titles = searchParams.get('titles')?.split(',').filter(Boolean) || []
    const callStatuses = (searchParams.get('callStatuses') || searchParams.get('call_statuses'))?.split(',').filter(Boolean) || []
    
    // Date filters
    const dateFrom = searchParams.get('dateFrom') || searchParams.get('date_from') || ''
    const dateTo = searchParams.get('dateTo') || searchParams.get('date_to') || ''
    
    // Column-specific filters
    const name = searchParams.get('name') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''
    const company = searchParams.get('company') || ''
    const position = searchParams.get('position') || ''
    const source = searchParams.get('source') || ''
    const industry = searchParams.get('industry') || ''
    const statusFilter = statusParam || ''
    const lastContactFrom = searchParams.get('lastContactFrom') || searchParams.get('last_contact_from') || ''
    const lastContactTo = searchParams.get('lastContactTo') || searchParams.get('last_contact_to') || ''
    
    logger.apiRequest('GET', '/api/customers', { userId: session.user.id, page, limit, search })

    const offset = (page - 1) * limit

    const filters: string[] = ['c.deleted_at IS NULL']
    const params: any[] = []

    // Search filter
    if (search) {
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
      filters.push('(c.first_name ILIKE $' + (params.length - 3) + ' OR c.last_name ILIKE $' + (params.length - 2) + ' OR c.email ILIKE $' + (params.length - 1) + ' OR c.phone ILIKE $' + params.length + ')')
    }

    // Status filter
    if (statusFilter) {
      params.push(statusFilter === 'active')
      filters.push('c.is_active = $' + params.length)
    }

    // Column-specific text filters
    if (name) {
      params.push(`%${name}%`)
      filters.push('(c.first_name ILIKE $' + params.length + ' OR c.last_name ILIKE $' + params.length + ')')
    }

    if (email) {
      params.push(`%${email}%`)
      filters.push('c.email ILIKE $' + params.length)
    }

    if (phone) {
      params.push(`%${phone}%`)
      filters.push('c.phone ILIKE $' + params.length)
    }

    // Multi-select filters
    if (companies.length > 0) {
      params.push(companies)
      filters.push('comp.name = ANY($' + params.length + ')')
    }

    if (industries.length > 0) {
      params.push(industries)
      filters.push('ind.name = ANY($' + params.length + ')')
    }

    if (sources.length > 0) {
      params.push(sources)
      filters.push('src.name = ANY($' + params.length + ')')
    }

    if (positions.length > 0) {
      params.push(positions)
      filters.push('pos.name = ANY($' + params.length + ')')
    }

    // Single value filters
    if (company) {
      params.push(`%${company}%`)
      filters.push('comp.name ILIKE $' + params.length)
    }

    if (industry) {
      params.push(`%${industry}%`)
      filters.push('ind.name ILIKE $' + params.length)
    }

    if (source) {
      params.push(`%${source}%`)
      filters.push('src.name ILIKE $' + params.length)
    }

    if (position) {
      params.push(`%${position}%`)
      filters.push('pos.name ILIKE $' + params.length)
    }

    // Date filters
    if (dateFrom) {
      params.push(dateFrom)
      filters.push('c.created_at >= $' + params.length)
    }

    if (dateTo) {
      params.push(dateTo + ' 23:59:59')
      filters.push('c.created_at <= $' + params.length)
    }

    if (lastContactFrom) {
      params.push(lastContactFrom)
      filters.push('c.updated_at >= $' + params.length)
    }

    if (lastContactTo) {
      params.push(lastContactTo + ' 23:59:59')
      filters.push('c.updated_at <= $' + params.length)
    }

    const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

    // Build ORDER BY clause
    let orderBy = 'c.created_at DESC'
    if (sort) {
      const validSortFields: Record<string, string> = {
        'first_name': 'c.first_name',
        'last_name': 'c.last_name',
        'email': 'c.email',
        'phone': 'c.phone',
        'company': 'comp.name',
        'position': 'pos.name',
        'source': 'src.name',
        'industry': 'ind.name',
        'is_active': 'c.is_active',
        'updated_at': 'c.updated_at',
        'created_at': 'c.created_at'
      }
      
      const sortField = validSortFields[sort] || 'c.created_at'
      orderBy = `${sortField} ${order.toUpperCase()}`
    }

    const customersSql = `
      SELECT c.*,
             comp.name as company_name,
             pos.name as position_name,
             src.name as source_name,
             ind.name as industry_name
      FROM public.customers c
      LEFT JOIN public.companies comp ON c.company_id = comp.id
      LEFT JOIN public.positions pos ON c.position_id = pos.id
      LEFT JOIN public.sources src ON c.source_id = src.id
      LEFT JOIN public.industries ind ON c.industry_id = ind.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `

    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM public.customers c
      LEFT JOIN public.companies comp ON c.company_id = comp.id
      LEFT JOIN public.positions pos ON c.position_id = pos.id
      LEFT JOIN public.sources src ON c.source_id = src.id
      LEFT JOIN public.industries ind ON c.industry_id = ind.id
      ${whereClause}
    `

    const [{ rows: customers }, { rows: countRows }] = await Promise.all([
      query(customersSql, params),
      query(countSql, params),
    ])

    const total = countRows[0]?.count || 0

    // Transform the data to match the expected format
    const transformedCustomers = (customers || []).map((customer: any) => ({
      ...customer,
      companies: customer.company_name ? { name: customer.company_name } : null,
      positions: customer.position_name ? { name: customer.position_name } : null,
      sources: customer.source_name ? { name: customer.source_name } : null,
      industries: customer.industry_name ? { name: customer.industry_name } : null,
    }))

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/customers', 200, duration, { total })
    return NextResponse.json({
      customers: transformedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/customers')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      first_name: z.string().optional(),
      firstName: z.string().optional(),
      last_name: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company_id: commonSchemas.id.optional(),
      companyId: commonSchemas.id.optional(),
      source_id: commonSchemas.id.optional(),
      sourceId: commonSchemas.id.optional(),
      industry_id: commonSchemas.id.optional(),
      industryId: commonSchemas.id.optional(),
      event_id: commonSchemas.id.optional(),
      eventId: commonSchemas.id.optional(),
      position_id: commonSchemas.id.optional(),
      positionId: commonSchemas.id.optional(),
      business_profile_id: commonSchemas.id.optional(),
      businessProfileId: commonSchemas.id.optional(),
      title_id: commonSchemas.id.optional(),
      titleId: commonSchemas.id.optional(),
      call_workflow_status_id: commonSchemas.id.optional(),
      callWorkflowStatusId: commonSchemas.id.optional(),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const {
      first_name,
      firstName,
      last_name,
      lastName,
      email,
      phone,
      company_id,
      companyId,
      source_id,
      sourceId,
      industry_id,
      industryId,
      event_id,
      eventId,
      position_id,
      positionId,
      business_profile_id,
      businessProfileId,
      title_id,
      titleId,
      call_workflow_status_id,
      callWorkflowStatusId,
    } = bodyValidation.data

    const finalFirstName = first_name || firstName
    const finalLastName = last_name || lastName
    const finalCompanyId = company_id || companyId
    const finalSourceId = source_id || sourceId
    const finalIndustryId = industry_id || industryId
    const finalEventId = event_id || eventId
    const finalPositionId = position_id || positionId
    const finalBusinessProfileId = business_profile_id || businessProfileId
    const finalTitleId = title_id || titleId
    const finalCallWorkflowStatusId = call_workflow_status_id || callWorkflowStatusId

    if (!finalFirstName || !finalLastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    logger.apiRequest('POST', '/api/customers', { userId: session.user.id, first_name: finalFirstName, last_name: finalLastName, email })

    if (email) {
      const { rows: existing } = await query(
        'SELECT id FROM public.customers WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
        [email]
      )
      if (existing.length > 0) {
        logger.warn('Customer with this email already exists', { email })
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const insertSql = `
      INSERT INTO public.customers (
        first_name, last_name, email, phone,
        company_id, source_id, industry_id, event_id,
        position_id, business_profile_id, title_id, call_workflow_status_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      ) RETURNING *
    `

    const params = [
      finalFirstName,
      finalLastName,
      email,
      phone,
      finalCompanyId,
      finalSourceId,
      finalIndustryId,
      finalEventId,
      finalPositionId,
      finalBusinessProfileId,
      finalTitleId,
      finalCallWorkflowStatusId,
    ]

    const { rows } = await query(insertSql, params)
    const customer = rows[0]

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, new_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['CREATE', 'Customer', customer.id, customer, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/customers', 201, duration, { customerId: customer.id })
    return NextResponse.json(customer, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/customers')