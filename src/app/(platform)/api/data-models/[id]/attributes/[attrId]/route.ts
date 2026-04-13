import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attrId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      attrId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: dataModelId, attrId } = paramValidation.data
    logger.apiRequest('GET', `/api/data-models/${dataModelId}/attributes/${attrId}`, { userId: session.user.id })

    const { rows } = await query(
      'SELECT * FROM public.data_model_attributes WHERE id = $1::uuid AND data_model_id = $2::uuid AND is_active = TRUE',
      [attrId, dataModelId]
    )

    if (rows.length === 0) {
      logger.warn('Attribute not found', { dataModelId, attrId })
      return addSecurityHeaders(NextResponse.json({ error: 'Attribute not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-models/${dataModelId}/attributes/${attrId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ attribute: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Attribute API GET')
  }
}



export const GET = withErrorHandling(getHandler, 'GET /api/data-models/[id]/attributes/[attrId]/route.ts')
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attrId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      attrId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: dataModelId, attrId } = paramValidation.data
    logger.apiRequest('PUT', `/api/data-models/${dataModelId}/attributes/${attrId}`, { userId: session.user.id })

    // Check if user has permission to edit attributes in this space
    const spaceCheck = await query(`
      SELECT sm.role, s.created_by
      FROM data_models dm
      JOIN data_model_spaces dms ON dm.id = dms.data_model_id
      JOIN spaces s ON dms.space_id = s.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $1::uuid
      WHERE dm.id = $2::uuid
    `, [session.user.id, dataModelId])

    if (spaceCheck.rows.length === 0) {
      logger.warn('Data model not found', { dataModelId })
      return addSecurityHeaders(NextResponse.json({ error: 'Data model not found' }, { status: 404 }))
    }

    const spaceData = spaceCheck.rows[0]
    const userRole = spaceData.role
    const isOwner = spaceData.created_by === session.user.id
    const canEdit = userRole === 'ADMIN' || userRole === 'MEMBER' || isOwner

    if (!canEdit) {
      logger.warn('Insufficient permissions to edit attribute', { dataModelId, attrId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions to edit attributes' }, { status: 403 }))
    }
    
    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      display_name: z.string().min(1).optional(),
      type: z.string().optional(),
      is_required: z.boolean().optional(),
      is_unique: z.boolean().optional(),
      is_primary_key: z.boolean().optional(),
      is_foreign_key: z.boolean().optional(),
      referenced_table: z.string().optional().nullable(),
      referenced_column: z.string().optional().nullable(),
      default_value: z.any().optional().nullable(),
      options: z.array(z.any()).optional().nullable(),
      validation: z.any().optional().nullable(),
      order: z.number().int().nonnegative().optional(),
    })
    
    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }
    
    const { 
      name, 
      display_name, 
      type, 
      is_required, 
      is_unique, 
      is_primary_key,
      is_foreign_key,
      referenced_table,
      referenced_column,
      default_value, 
      options, 
      validation, 
      order 
    } = bodyValidation.data

    // Map type to uppercase for database enum
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON'
    }
    const mappedType = type ? (typeMapping[type.toLowerCase()] || type.toUpperCase() || 'TEXT') : 'TEXT'

    const updateSql = `
      UPDATE public.data_model_attributes
      SET name = $1, display_name = $2, type = $3, is_required = $4, is_unique = $5,
          is_primary_key = $6, is_foreign_key = $7, referenced_table = $8, referenced_column = $9,
          default_value = $10, options = $11, validation = $12, "order" = $13, updated_at = NOW()
      WHERE id = $14::uuid AND data_model_id = $15::uuid AND is_active = TRUE
      RETURNING *
    `
    
    const { rows } = await query(updateSql, [
      name,
      display_name,
      mappedType,
      !!is_required,
      !!is_unique,
      !!is_primary_key,
      !!is_foreign_key,
      referenced_table || null,
      referenced_column || null,
      default_value || null,
      options ? JSON.stringify(options) : null,
      validation ? JSON.stringify(validation) : null,
      order || 0,
      attrId,
      dataModelId
    ])

    if (rows.length === 0) {
      logger.warn('Attribute not found for update', { dataModelId, attrId })
      return addSecurityHeaders(NextResponse.json({ error: 'Attribute not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/data-models/${dataModelId}/attributes/${attrId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ attribute: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Attribute API PUT')
  }
}



export const PUT = withErrorHandling(putHandler, 'PUT /api/data-models/[id]/attributes/[attrId]/route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attrId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }


    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      attrId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: dataModelId, attrId } = paramValidation.data
    logger.apiRequest('DELETE', `/api/data-models/${dataModelId}/attributes/${attrId}`, { userId: session.user.id })

    // Check if user has permission to delete attributes in this space
    const spaceCheck = await query(`
      SELECT sm.role, s.created_by
      FROM data_models dm
      JOIN data_model_spaces dms ON dm.id = dms.data_model_id
      JOIN spaces s ON dms.space_id = s.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $1::uuid
      WHERE dm.id = $2::uuid
    `, [session.user.id, dataModelId])

    if (spaceCheck.rows.length === 0) {
      logger.warn('Data model not found', { dataModelId })
      return addSecurityHeaders(NextResponse.json({ error: 'Data model not found' }, { status: 404 }))
    }

    const spaceData = spaceCheck.rows[0]
    const userRole = spaceData.role
    const isOwner = spaceData.created_by === session.user.id
    const canDelete = userRole === 'ADMIN' || isOwner

    if (!canDelete) {
      logger.warn('Insufficient permissions to delete attribute', { dataModelId, attrId, userId: session.user.id })
      return addSecurityHeaders(NextResponse.json({ error: 'Insufficient permissions to delete attributes' }, { status: 403 }))
    }

    const { rows } = await query(
      'UPDATE public.data_model_attributes SET is_active = FALSE, deleted_at = NOW() WHERE id = $1::uuid AND data_model_id = $2::uuid RETURNING *',
      [attrId, dataModelId]
    )

    if (rows.length === 0) {
      logger.warn('Attribute not found for deletion', { dataModelId, attrId })
      return addSecurityHeaders(NextResponse.json({ error: 'Attribute not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/data-models/${dataModelId}/attributes/${attrId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ message: 'Attribute deleted successfully' }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Attribute API DELETE')
  }
}


export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/data-models/[id]/attributes/[attrId]/route.ts')