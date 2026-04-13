import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
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
    logger.apiRequest('GET', `/api/companies/${id}`, { userId: session.user.id })

    const res = await query(
      `SELECT c.*,
              COALESCE(
                (
                  SELECT json_agg(cu ORDER BY cu.created_at DESC)
                  FROM customers cu
                  WHERE cu.company_id = c.id AND cu.deleted_at IS NULL
                ), '[]'::json
              ) AS customers
       FROM companies c
       WHERE c.id::text = $1 AND c.deleted_at IS NULL
       LIMIT 1`,
      [id]
    )

    const company = res.rows[0]
    if (!company) {
      logger.warn('Company not found', { companyId: id })
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/companies/${id}`, 200, duration)
    return NextResponse.json(company)
}

export const GET = withErrorHandling(getHandler, 'GET /api/companies/[id]')

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
      name: z.string().optional(),
      description: z.string().optional(),
      is_active: z.boolean().optional(),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const { name, description, is_active } = bodyValidation.data
    logger.apiRequest('PUT', `/api/companies/${id}`, { userId: session.user.id })

    const current = await query('SELECT * FROM companies WHERE id::text = $1 LIMIT 1', [id])
    const currentCompany = current.rows[0]
    if (!currentCompany) {
      logger.warn('Company not found for update', { companyId: id })
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (name && name !== currentCompany.name) {
      const existing = await query(
        'SELECT id FROM companies WHERE name = $1 AND deleted_at IS NULL AND id::text <> $2 LIMIT 1',
        [name, id]
      )
      if (existing.rows[0]) {
        logger.warn('Company with this name already exists', { name, companyId: id })
        return NextResponse.json(
          { error: 'Company with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updated = await query(
      'UPDATE companies SET name = $1, description = $2, is_active = $3, updated_at = NOW() WHERE id::text = $4 RETURNING *',
      [name ?? currentCompany.name, description ?? currentCompany.description, typeof is_active === 'boolean' ? is_active : currentCompany.is_active, id]
    )

    const updatedCompany = updated.rows[0]

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, old_value, new_value, user_id) VALUES ($1,$2,$3,$4,$5,$6)',
      ['UPDATE', 'Company', id, currentCompany, updatedCompany, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/companies/${id}`, 200, duration)
    return NextResponse.json(updatedCompany)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/companies/[id]')

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
    logger.apiRequest('DELETE', `/api/companies/${id}`, { userId: session.user.id })

    const cnt = await query(
      'SELECT COUNT(*)::int AS total FROM customers WHERE company_id::text = $1 AND deleted_at IS NULL',
      [id]
    )
    if ((cnt.rows[0]?.total || 0) > 0) {
      logger.warn('Cannot delete company with associated customers', { companyId: id, customerCount: cnt.rows[0]?.total })
      return NextResponse.json(
        { error: 'Cannot delete company with associated customers' },
        { status: 400 }
      )
    }

    await query(
      'UPDATE companies SET deleted_at = NOW(), updated_at = NOW() WHERE id::text = $1',
      [id]
    )

    await query(
      'INSERT INTO activities (action, entity_type, entity_id, user_id) VALUES ($1,$2,$3,$4)',
      ['DELETE', 'Company', id, session.user.id]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/companies/${id}`, 200, duration)
    return NextResponse.json({ message: 'Company deleted successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/companies/[id]')
