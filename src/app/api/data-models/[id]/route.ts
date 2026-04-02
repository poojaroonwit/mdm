import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'
import { assignResourceFolder, clearResourceFolderAssignments, getFolderState } from '@/lib/folder-state'

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
  logger.apiRequest('GET', `/api/data-models/${id}`, { userId: session.user.id })

  const { rows } = await query(
    'SELECT * FROM public.data_models WHERE id::text = $1 AND deleted_at IS NULL',
    [id]
  )
  if (!rows[0]) {
    logger.warn('Data model not found', { dataModelId: id })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const duration = Date.now() - startTime
  logger.apiResponse('GET', `/api/data-models/${id}`, 200, duration)
  return NextResponse.json({ dataModel: rows[0] })
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-models/[id]')

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
  logger.apiRequest('PUT', `/api/data-models/${id}`, { userId: session.user.id })

  const bodySchema = z.object({
    name: z.string().min(1).optional(),
    display_name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    is_active: z.boolean().optional(),
    isActive: z.boolean().optional(),
    icon: z.string().optional().nullable(),
    sort_order: z.number().int().optional(),
    sortOrder: z.number().int().optional(),
    is_pinned: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    source_type: z.string().optional().nullable(),
    sourceType: z.string().optional().nullable(),
    external_connection_id: z.string().uuid().optional().nullable(),
    externalConnectionId: z.string().uuid().optional().nullable(),
    external_schema: z.string().optional().nullable(),
    externalSchema: z.string().optional().nullable(),
    external_table: z.string().optional().nullable(),
    externalTable: z.string().optional().nullable(),
    external_primary_key: z.string().optional().nullable(),
    externalPrimaryKey: z.string().optional().nullable(),
    slug: z.string().optional(),
    folder_id: commonSchemas.id.optional().nullable(),
    folderId: commonSchemas.id.optional().nullable(),
    folder_space_id: commonSchemas.id.optional().nullable(),
    folderSpaceId: commonSchemas.id.optional().nullable(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return addSecurityHeaders(bodyValidation.response)
  }

  const { 
    name, 
    description, 
    icon, 
    slug: slugInput 
  } = bodyValidation.data
  
  const display_name = bodyValidation.data.displayName ?? bodyValidation.data.display_name
  const is_active = bodyValidation.data.isActive ?? bodyValidation.data.is_active
  const sort_order = bodyValidation.data.sortOrder ?? bodyValidation.data.sort_order
  const is_pinned = bodyValidation.data.isPinned ?? bodyValidation.data.is_pinned
  const source_type = bodyValidation.data.sourceType ?? bodyValidation.data.source_type
  const external_connection_id = bodyValidation.data.externalConnectionId ?? bodyValidation.data.external_connection_id
  const external_schema = bodyValidation.data.externalSchema ?? bodyValidation.data.external_schema
  const external_table = bodyValidation.data.externalTable ?? bodyValidation.data.external_table
  const external_primary_key = bodyValidation.data.externalPrimaryKey ?? bodyValidation.data.external_primary_key
  const folder_id = bodyValidation.data.folderId ?? bodyValidation.data.folder_id
  const folder_space_id = bodyValidation.data.folderSpaceId ?? bodyValidation.data.folder_space_id

  let slug = slugInput

  if (!name && !display_name && description === undefined && is_active === undefined && icon === undefined && sort_order === undefined && is_pinned === undefined && source_type === undefined && external_connection_id === undefined && external_schema === undefined && external_table === undefined && external_primary_key === undefined && slug === undefined && folder_id === undefined && folder_space_id === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  if (folder_id && folder_space_id) {
    const folderState = await getFolderState(folder_space_id, 'data_model')
    if (!folderState.folders.some((folder) => folder.id === folder_id)) {
      return NextResponse.json({ error: 'Selected folder was not found in the active space' }, { status: 400 })
    }
  }

  const fields: string[] = []
  const values: any[] = []
  let idx = 1
  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name) }
  if (display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(display_name) }
  if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description) }
  if (is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(!!is_active) }
  if (icon !== undefined) { fields.push(`icon = $${idx++}`); values.push(icon) }
  if (sort_order !== undefined) {
    const sortOrderNum = typeof sort_order === 'string' ? parseInt(sort_order) || 0 : sort_order || 0
    fields.push(`sort_order = $${idx++}`)
    values.push(String(sortOrderNum))
  }
  if (is_pinned !== undefined) { fields.push(`is_pinned = $${idx++}`); values.push(!!is_pinned) }
  if (source_type !== undefined) { fields.push(`source_type = $${idx++}`); values.push(source_type) }
  if (external_connection_id !== undefined && external_connection_id !== null) { fields.push(`external_connection_id = $${idx++}`); values.push(external_connection_id) }
  if (external_schema !== undefined) { fields.push(`external_schema = $${idx++}`); values.push(external_schema) }
  if (external_table !== undefined) { fields.push(`external_table = $${idx++}`); values.push(external_table) }
  if (external_primary_key !== undefined) { fields.push(`external_primary_key = $${idx++}`); values.push(external_primary_key) }

  // Handle slug update if provided
  if (slug !== undefined) {
    const toSlug = (text: string) => (
      text || ''
    ).toString().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
    slug = toSlug(slug)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    // Ensure unique (excluding current record)
    const { rows: conflict } = await query(
      'SELECT id FROM public.data_models WHERE slug = $1 AND id::text <> $2 AND deleted_at IS NULL LIMIT 1',
      [slug, id]
    )
    if (conflict.length > 0) {
      logger.warn('Slug already in use', { dataModelId: id, slug })
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
    fields.push(`slug = $${idx++}`)
    values.push(slug)
  }

  // Get current data for audit log
  const currentDataResult = await query('SELECT * FROM public.data_models WHERE id::text = $1', [id])
  const currentData = currentDataResult.rows[0]

  const sql = `UPDATE public.data_models SET ${fields.join(', ')} WHERE id::text = $${idx} RETURNING *`
  values.push(id)
  const { rows } = await query(sql, values)
  if (!rows[0]) {
    logger.warn('Data model not found for update', { dataModelId: id })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Create audit log
  await createAuditLog({
    action: 'UPDATE',
    entityType: 'DataModel',
    entityId: id,
    oldValue: currentData,
    newValue: rows[0],
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  })

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', `/api/data-models/${id}`, 200, duration)
  if (folder_space_id !== undefined) {
    await assignResourceFolder(folder_space_id, 'data_model', id, folder_id ?? null)
  }
  return NextResponse.json({ dataModel: rows[0] })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/data-models/[id]')

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
  logger.apiRequest('DELETE', `/api/data-models/${id}`, { userId: session.user.id })

  // Get current data for audit log
  const currentDataResult = await query('SELECT * FROM public.data_models WHERE id::text = $1', [id])
  const currentData = currentDataResult.rows[0]

  const { rows } = await query(
    'UPDATE public.data_models SET deleted_at = NOW() WHERE id::text = $1 AND deleted_at IS NULL RETURNING id',
    [id]
  )
  if (!rows[0]) {
    logger.warn('Data model not found for deletion', { dataModelId: id })
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Create audit log
  await createAuditLog({
    action: 'DELETE',
    entityType: 'DataModel',
    entityId: id,
    oldValue: currentData,
    newValue: null,
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  })

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/data-models/${id}`, 200, duration)
  await clearResourceFolderAssignments('data_model', id)
  return NextResponse.json({ ok: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/data-models/[id]')
