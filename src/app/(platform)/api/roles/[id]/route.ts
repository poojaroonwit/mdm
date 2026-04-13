import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// PUT /api/roles/[id] - update role (name/description, ADMIN+)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/roles/${id}`)

    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, description } = bodyValidation.data
    const sets: string[] = []
    const values: any[] = []
    if (name) { values.push(name); sets.push(`name = $${values.length}`) }
    if (description !== undefined) { values.push(description); sets.push(`description = $${values.length}`) }
    if (!sets.length) {
      logger.warn('Nothing to update for role', { roleId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Nothing to update' }, { status: 400 }))
    }
    values.push(id)
    const { rows } = await query(`UPDATE public.roles SET ${sets.join(', ') } WHERE id = $${values.length} RETURNING id, name, description`, values)
    if (!rows.length) {
      logger.warn('Role not found for update', { roleId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/roles/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ role: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Roles API PUT')
  }
}

// DELETE /api/roles/[id] - delete role (ADMIN+)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/roles/${id}`)

    const { rows } = await query('DELETE FROM public.roles WHERE id = $1 RETURNING id', [id])
    if (!rows.length) {
      logger.warn('Role not found for deletion', { roleId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/roles/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Roles API DELETE')
  }
}


