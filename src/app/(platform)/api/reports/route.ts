import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireAnySpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { reportSchema } from '@/lib/validation/report-schemas'
import { auditLogger } from '@/lib/utils/audit-logger'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  // Note: space_id may have colon suffix (e.g., "uuid:1"), so we normalize it
  const queryValidation = validateQuery(request, z.object({
    source: z.string().optional(),
    space_id: z.string().optional().transform((val) => val ? val.split(':')[0] : undefined).pipe(commonSchemas.id.optional()),
    spaceId: z.string().optional().transform((val) => val ? val.split(':')[0] : undefined).pipe(commonSchemas.id.optional()),
    search: z.string().optional().default(''),
    category_id: commonSchemas.id.optional(),
    status: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }))

  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { source, space_id, spaceId: querySpaceId, search = '', category_id: categoryId, status, date_from: dateFrom, date_to: dateTo } = queryValidation.data
  const spaceId = space_id || querySpaceId
  logger.apiRequest('GET', '/api/reports', { userId: session.user.id, source, spaceId, search })

  const params: any[] = [session.user.id]
  const filters: string[] = ['r.deleted_at IS NULL']

  if (source) {
    params.push(source.toUpperCase().replace('-', '_'))
    filters.push('r.source = $' + params.length)
  }

  if (spaceId) {
    params.push(spaceId)
    filters.push('rs.space_id::text = $' + params.length)
  }

  if (categoryId) {
    params.push(categoryId)
    filters.push('r.category_id::text = $' + params.length)
  }

  if (status) {
    params.push(status === 'active')
    filters.push('r.is_active = $' + params.length + '::boolean')
  }

  if (dateFrom) {
    params.push(dateFrom)
    filters.push('r.created_at >= $' + params.length + '::date')
  }

  if (dateTo) {
    params.push(dateTo)
    filters.push('r.created_at <= $' + params.length + '::date')
  }

  if (search) {
    params.push(`%${search}%`, `%${search}%`)
    filters.push('(r.name ILIKE $' + (params.length - 1) + ' OR r.description ILIKE $' + params.length + ')')
  }

  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : ''

  const reportsSql = `
      SELECT DISTINCT r.*,
             c.name as category_name,
             f.name as folder_name
      FROM reports r
      LEFT JOIN report_spaces rs ON rs.report_id = r.id
      LEFT JOIN report_permissions rp ON rp.report_id = r.id AND (
        rp.user_id::text = $1 
        -- OR rp.group_id::text IN (SELECT group_id::text FROM user_group_members WHERE user_id::text = $1)
      )
      LEFT JOIN report_categories c ON c.id = r.category_id
      LEFT JOIN report_folders f ON f.id = r.folder_id
      WHERE (
        r.created_by::text = $1 OR
        rp.id IS NOT NULL OR
        (rs.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id::text = $1
        )) OR
        r.is_public = true
      )
      ${where.replace('WHERE', 'AND')}
      ORDER BY r.created_at DESC
    `

  const categoriesSql = `
      SELECT * FROM report_categories
      WHERE deleted_at IS NULL
      ORDER BY name
    `

  const foldersSql = `
      SELECT * FROM report_folders
      WHERE deleted_at IS NULL
      ORDER BY name
    `

  const [{ rows: reports }, { rows: categories }, { rows: folders }] = await Promise.all([
    query(reportsSql, params),
    query(categoriesSql, []),
    query(foldersSql, [])
  ])

  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/reports', 200, duration, {
    reportsCount: reports.length,
    categoriesCount: categories.length,
    foldersCount: folders.length
  })
  return NextResponse.json({
    reports: reports || [],
    categories: categories || [],
    folders: folders || []
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    source: z.string().min(1, 'Source is required'),
    category_id: commonSchemas.id.optional(),
    categoryId: commonSchemas.id.optional(),
    folder_id: commonSchemas.id.optional(),
    folderId: commonSchemas.id.optional(),
    owner: z.string().optional(),
    link: z.string().url().optional(),
    workspace: z.string().optional(),
    embed_url: z.string().url().optional(),
    embedUrl: z.string().url().optional(),
    metadata: z.any().optional(),
    space_ids: z.array(commonSchemas.id).optional(),
    spaceIds: z.array(commonSchemas.id).optional(),
  }))

  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const {
    name,
    description,
    source,
    category_id,
    categoryId,
    folder_id,
    folderId,
    owner,
    link,
    workspace,
    embed_url,
    embedUrl,
    metadata,
    space_ids,
    spaceIds
  } = bodyValidation.data

  const final_category_id = category_id || categoryId
  const final_folder_id = folder_id || folderId
  const final_embed_url = embed_url || embedUrl
  const final_space_ids = space_ids || spaceIds || []

  logger.apiRequest('POST', '/api/reports', { userId: session.user.id, name, source })

  const insertSql = `
      INSERT INTO reports (
        name, description, source, category_id, folder_id,
        owner, link, workspace, embed_url, metadata,
        created_by, is_active, is_public
      ) VALUES ($1, $2, $3, $4::uuid, $5::uuid, $6, $7, $8, $9, $10::jsonb, $11::uuid, $12::boolean, $13::boolean)
      RETURNING *
    `

  const result = await query(insertSql, [
    name,
    description || null,
    source,
    final_category_id || null,
    final_folder_id || null,
    owner || null,
    link || null,
    workspace || null,
    final_embed_url || null,
    metadata ? JSON.stringify(metadata) : null,
    session.user.id,
    true,
    false
  ])

  const report = result.rows[0]

  // Log audit event
  auditLogger.reportCreated(report.id, { source: source })

  // Associate with spaces
  if (final_space_ids && final_space_ids.length > 0) {
    for (const spaceId of final_space_ids) {
      await query(
        'INSERT INTO report_spaces (report_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [report.id, spaceId]
      )
    }
  }

  const duration = Date.now() - startTime
  logger.apiResponse('POST', '/api/reports', 201, duration, { reportId: report.id })
  return NextResponse.json({ report }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports')

