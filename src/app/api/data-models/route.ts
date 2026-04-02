import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'
import { requireAnySpaceAccess } from '@/lib/space-access'
import { createAuditLog } from '@/lib/audit'
import { assignResourceFolder, getFolderState } from '@/lib/folder-state'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  // Note: space_id may have colon suffix (e.g., "uuid:1"), so we normalize it
  const queryValidation = validateQuery(request, z.object({
    page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
    limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(1000)).optional().default(10),
    search: z.string().optional().default(''),
    space_id: z.string().optional().transform((val) => val ? val.split(':')[0] : undefined).pipe(commonSchemas.id.optional()).or(z.string().optional().transform((val) => val ? val.split(':')[0] : undefined).pipe(commonSchemas.id.optional())),
    spaceId: z.string().optional().transform((val) => val ? val.split(':')[0] : undefined).pipe(commonSchemas.id.optional()),
  }))

  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { page, limit, search = '', space_id, spaceId: sId } = queryValidation.data
  let spaceId = space_id || sId

  if (!spaceId) {
    // Fallback to user's default space
    try {
      const { rows: defaultSpace } = await query(
        `SELECT s.id FROM public.spaces s 
           JOIN public.space_members sm ON sm.space_id = s.id AND sm.user_id::text = $1
           WHERE s.is_default = true AND s.deleted_at IS NULL
           ORDER BY s.created_at DESC LIMIT 1`,
        [session.user.id]
      )
      spaceId = defaultSpace[0]?.id || null
    } catch (error: any) {
      logger.error('Failed to fetch default space', error, { userId: session.user.id })
      // Continue execution, we'll check if spaceId is null below
    }

    if (!spaceId) {
      logger.warn('No default space found, returning empty data models', { userId: session.user.id })
      return NextResponse.json({ dataModels: [], pagination: { page, limit, total: 0, pages: 0 } })
    }
  }

  logger.apiRequest('GET', '/api/data-models', { userId: session.user.id, page, limit, search, spaceId })

  const offset = (page - 1) * limit
  const params: any[] = [spaceId]
  const filters: string[] = ['dm.deleted_at IS NULL', 'dms.space_id::text = $1']

  if (search) {
    params.push(`%${search}%`, `%${search}%`)
    filters.push('(dm.name ILIKE $' + (params.length - 1) + ' OR dm.description ILIKE $' + params.length + ')')
  }

  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

  const listSql = `
      SELECT DISTINCT dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
             dm.is_active, dm.sort_order, dm.created_by,
             ARRAY_AGG(s.slug) as space_slugs,
             ARRAY_AGG(s.name) as space_names
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
      JOIN public.spaces s ON s.id = dms.space_id
      ${where}
      GROUP BY dm.id, dm.name, dm.description, dm.created_at, dm.updated_at, dm.deleted_at,
               dm.is_active, dm.sort_order, dm.created_by
      ORDER BY dm.sort_order ASC, dm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

  const countSql = `
      SELECT COUNT(DISTINCT dm.id)::int AS total 
      FROM public.data_models dm
      JOIN public.data_model_spaces dms ON dms.data_model_id = dm.id
      ${where}
    `

  try {
    const folderState = await getFolderState(spaceId, 'data_model')
    const assignments = folderState.assignments || {}
    const [{ rows: dataModels }, { rows: totalRows }] = await Promise.all([
      query(listSql, params),
      query(countSql, params),
    ])

    const total = totalRows[0]?.total || 0
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/data-models', 200, duration, { total })
    return NextResponse.json({
      dataModels: (dataModels || []).map((model: any) => ({
        ...model,
        folder_id: assignments[model.id] || null,
      })),
      spaceId,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    logger.error('Failed to fetch data models', error, {
      userId: session.user.id,
      spaceId,
      query: listSql,
      params
    })
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-models')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    display_name: z.string().optional(),
    displayName: z.string().optional(),
    description: z.string().optional(),
    slug: z.string().optional(),
    space_ids: z.array(commonSchemas.id).optional(),
    spaceIds: z.array(commonSchemas.id).optional(),
    folder_id: commonSchemas.id.optional().nullable(),
    folderId: commonSchemas.id.optional().nullable(),
    folder_space_id: commonSchemas.id.optional().nullable(),
    folderSpaceId: commonSchemas.id.optional().nullable(),
  }))

  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { name, description, space_ids, spaceIds, displayName } = bodyValidation.data
  const finalSpaceIds = spaceIds || space_ids || []
  const finalDisplayName = displayName || bodyValidation.data.display_name
  const folderId = bodyValidation.data.folderId ?? bodyValidation.data.folder_id ?? null
  const folderSpaceId =
    bodyValidation.data.folderSpaceId ??
    bodyValidation.data.folder_space_id ??
    finalSpaceIds[0] ??
    null

  // Generate slug from name if not provided
  const toSlug = (text: string) => (text || '').toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  let slug = bodyValidation.data.slug ? toSlug(bodyValidation.data.slug) : toSlug(name)
  if (!slug) slug = `model-${Date.now()}`

  // Ensure slug uniqueness
  const { rows: slugConflict } = await query(
    'SELECT id FROM public.data_models WHERE slug = $1 AND deleted_at IS NULL LIMIT 1',
    [slug]
  )
  if (slugConflict.length > 0) {
    slug = `${slug}-${Date.now()}`
  }
  
  if (finalSpaceIds.length === 0) {
    return NextResponse.json({ error: 'At least one space ID is required' }, { status: 400 })
  }

  if (folderId && folderSpaceId) {
    const folderState = await getFolderState(folderSpaceId, 'data_model')
    if (!folderState.folders.some((folder) => folder.id === folderId)) {
      return NextResponse.json({ error: 'Selected folder was not found in the active space' }, { status: 400 })
    }
  }

  logger.apiRequest('POST', '/api/data-models', { userId: session.user.id, name, spaceIds: finalSpaceIds })

  // Check if user has access to all spaces
  const accessResult = await requireAnySpaceAccess(finalSpaceIds, session.user.id!)
  if (!accessResult.success) {
    logger.warn('Access denied to one or more spaces', { userId: session.user.id, spaceIds: finalSpaceIds })
    return accessResult.response
  }

  // Create the data model within a try-catch for better error reporting
  try {
    // Create the data model with ID generation
    const insertSql = `INSERT INTO public.data_models (id, name, display_name, slug, description, created_by, is_active, sort_order)
                         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7) RETURNING *`
    const { rows } = await query(insertSql, [
      name,
      finalDisplayName ?? name,
      slug,
      description ?? null,
      session.user.id,
      true,
      0
    ])

    const dataModel = rows[0]

    // Associate the data model with all specified spaces
    for (const spaceId of finalSpaceIds) {
      await query(
        'INSERT INTO public.data_model_spaces (id, data_model_id, space_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())',
        [dataModel.id, spaceId]
      )
    }

    if (folderSpaceId) {
      await assignResourceFolder(folderSpaceId, 'data_model', dataModel.id, folderId)
    }

    // Audit Log
    await createAuditLog({
      action: 'CREATE',
      entityType: 'DataModel',
      entityId: dataModel.id,
      oldValue: null,
      newValue: { ...dataModel, spaceIds: finalSpaceIds, folder_id: folderId, folder_space_id: folderSpaceId },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/data-models', 201, duration, { dataModelId: dataModel.id })
    return NextResponse.json({ dataModel }, { status: 201 })
  } catch (error: any) {
    logger.error('Failed to create data model', error, { userId: session.user.id, name })
    return handleApiError(error, 'POST /api/data-models')
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-models')


