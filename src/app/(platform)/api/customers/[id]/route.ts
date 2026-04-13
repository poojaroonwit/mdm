import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
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
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/customers/${id}`, { userId: session.user.id })
    const { rows } = await query(
      `SELECT * FROM public.customers WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [id]
    )

    const customer = rows[0]
    if (!customer) {
      logger.warn('Customer not found', { customerId: id })
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/customers/${id}`, 200, duration)
    return NextResponse.json(customer)
}

export const GET = withErrorHandling(getHandler, 'GET /api/customers/[id]')

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
    
    const { id } = paramValidation.data

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
    
    logger.apiRequest('PUT', `/api/customers/${id}`, { userId: session.user.id })

    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      logger.warn('Customer not found for update', { customerId: id })
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
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

    const finalFirstName = first_name || firstName || currentCustomer.first_name
    const finalLastName = last_name || lastName || currentCustomer.last_name
    const finalEmail = email || currentCustomer.email
    const finalPhone = phone !== undefined ? phone : currentCustomer.phone
    const finalCompanyId = company_id || companyId || currentCustomer.company_id
    const finalSourceId = source_id || sourceId || currentCustomer.source_id
    const finalIndustryId = industry_id || industryId || currentCustomer.industry_id
    const finalEventId = event_id || eventId || currentCustomer.event_id
    const finalPositionId = position_id || positionId || currentCustomer.position_id
    const finalBusinessProfileId = business_profile_id || businessProfileId || currentCustomer.business_profile_id
    const finalTitleId = title_id || titleId || currentCustomer.title_id
    const finalCallWorkflowStatusId = call_workflow_status_id || callWorkflowStatusId || currentCustomer.call_workflow_status_id

    if (finalEmail && finalEmail !== currentCustomer.email) {
      const { rows: existing } = await query(
        'SELECT id FROM public.customers WHERE email = $1 AND deleted_at IS NULL AND id <> $2 LIMIT 1',
        [finalEmail, id]
      )
      if (existing.length > 0) {
        logger.warn('Customer with this email already exists', { email, customerId: id })
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateSql = `
      UPDATE public.customers
      SET first_name = $1,
          last_name = $2,
          email = $3,
          phone = $4,
          company_id = $5,
          source_id = $6,
          industry_id = $7,
          event_id = $8,
          position_id = $9,
          business_profile_id = $10,
          title_id = $11,
          call_workflow_status_id = $12,
          updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `

    const paramsArr = [
      finalFirstName,
      finalLastName,
      finalEmail,
      finalPhone,
      finalCompanyId,
      finalSourceId,
      finalIndustryId,
      finalEventId,
      finalPositionId,
      finalBusinessProfileId,
      finalTitleId,
      finalCallWorkflowStatusId,
      id,
    ]

    const { rows } = await query(updateSql, paramsArr)
    const customer = rows[0]

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: id,
      oldValue: currentCustomer,
      newValue: customer,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/customers/${id}`, 200, duration)
    return NextResponse.json(customer)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/customers/[id]')

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
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/customers/${id}`, { userId: session.user.id })
    const { rows: currentRows } = await query(
      'SELECT * FROM public.customers WHERE id = $1 LIMIT 1',
      [id]
    )
    const currentCustomer = currentRows[0]
    if (!currentCustomer) {
      logger.warn('Customer not found for deletion', { customerId: id })
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    await query(
      'UPDATE public.customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    )

    await query(
      'INSERT INTO public.activities (action, entity_type, entity_id, old_value, user_id) VALUES ($1,$2,$3,$4,$5)',
      ['DELETE', 'Customer', id, currentCustomer, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/customers/${id}`, 200, duration)
    return NextResponse.json({ message: 'Customer deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/customers/[id]')