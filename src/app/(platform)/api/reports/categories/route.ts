import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response'
import { categorySchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('GET', '/api/reports/categories', { userId: session.user.id })

  const sql = `
    SELECT * FROM report_categories
    WHERE deleted_at IS NULL
    ORDER BY name
  `

  const result = await query(sql, [])
  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/reports/categories', 200, duration, {
    categoryCount: result.rows.length
  })
  return addSecurityHeaders(NextResponse.json(createSuccessResponse({ categories: result.rows || [] })))
}


async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('POST', '/api/reports/categories', { userId: session.user.id })

  const bodyValidation = await validateBody(request, categorySchema)
  if (!bodyValidation.success) {
    return addSecurityHeaders(bodyValidation.response)
  }

  const { name, description, parent_id } = bodyValidation.data

  const sql = `
    INSERT INTO report_categories (name, description, parent_id, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `

  const result = await query(sql, [
    name,
    description || null,
    parent_id || null,
    session.user.id
  ])

  // Log audit event
  auditLogger.categoryCreated(result.rows[0].id)

  const duration = Date.now() - startTime
  logger.apiResponse('POST', '/api/reports/categories', 201, duration, {
    categoryId: result.rows[0].id
  })
  return addSecurityHeaders(NextResponse.json(createSuccessResponse({ category: result.rows[0] }), { status: 201 }))
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/categories')

async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('PUT', '/api/reports/categories', { userId: session.user.id })

  const bodySchema = z.object({
    id: z.string().min(1),
  }).merge(categorySchema)

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return addSecurityHeaders(bodyValidation.response)
  }

  const { id, ...categoryData } = bodyValidation.data
  const { name, description, parent_id } = categoryData

  const sql = `
    UPDATE report_categories
    SET name = $1, description = $2, parent_id = $3, updated_at = NOW()
    WHERE id = $4 AND created_by = $5
    RETURNING *
  `

  const result = await query(sql, [
    name,
    description || null,
    parent_id || null,
    id,
    session.user.id
  ])

  if (result.rows.length === 0) {
    logger.warn('Category not found for update', { categoryId: id, userId: session.user.id })
    return addSecurityHeaders(NextResponse.json(createErrorResponse('Category not found', 'NOT_FOUND'), { status: 404 }))
  }

  // Log audit event
  auditLogger.categoryUpdated(id)

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', '/api/reports/categories', 200, duration, { categoryId: id })
  return addSecurityHeaders(NextResponse.json(createSuccessResponse({ category: result.rows[0] })))
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/reports/categories')

async function deleteHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('DELETE', '/api/reports/categories', { userId: session.user.id })

  const querySchema = z.object({
    id: z.string().min(1),
  })

  const queryValidation = validateQuery(request, querySchema)
  if (!queryValidation.success) {
    return addSecurityHeaders(queryValidation.response)
  }

  const { id } = queryValidation.data

  const sql = `
    UPDATE report_categories
    SET deleted_at = NOW()
    WHERE id = $1 AND created_by = $2
    RETURNING *
  `

  const result = await query(sql, [id, session.user.id])

  if (result.rows.length === 0) {
    logger.warn('Category not found for deletion', { categoryId: id, userId: session.user.id })
    return addSecurityHeaders(NextResponse.json(createErrorResponse('Category not found', 'NOT_FOUND'), { status: 404 }))
  }

  // Log audit event
  auditLogger.categoryDeleted(id)

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', '/api/reports/categories', 200, duration, { categoryId: id })
  return addSecurityHeaders(NextResponse.json(createSuccessResponse({ deleted: true })))
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/reports/categories')


export const GET = withErrorHandling(getHandler, 'GET GET /api/reports/categories')