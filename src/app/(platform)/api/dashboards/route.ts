import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireAnySpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
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
      space_id: commonSchemas.id.optional(),
      spaceId: commonSchemas.id.optional(),
      type: z.string().optional().default(''),
      visibility: z.string().optional().default(''),
    }))
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { page, limit = 10, search = '', space_id, spaceId: querySpaceId, type = '', visibility = '' } = queryValidation.data
    const spaceId = space_id || querySpaceId
    logger.apiRequest('GET', '/api/dashboards', { userId: session.user.id, page, limit, search })

    const offset = (page - 1) * limit
    const params: any[] = [session.user.id]
    const filters: string[] = ['d.deleted_at IS NULL']
    

    if (search) {
      params.push(`%${search}%`, `%${search}%`)
      filters.push('(d.name ILIKE $' + (params.length - 1) + ' OR d.description ILIKE $' + params.length + ')')
    }

    if (spaceId) {
      params.push(spaceId)
      filters.push('ds.space_id = $' + params.length)
    }

    if (type) {
      params.push(type)
      filters.push('d.type = $' + params.length)
    }

    if (visibility) {
      params.push(visibility)
      filters.push('d.visibility = $' + params.length)
    }

    const where = filters.length ? 'AND ' + filters.join(' AND ') : ''
    
    const listSql = `
      SELECT DISTINCT d.*, 
             ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as space_names,
             ARRAY_AGG(DISTINCT s.slug) FILTER (WHERE s.slug IS NOT NULL) as space_slugs,
             COUNT(DISTINCT de.id) as element_count,
             COUNT(DISTINCT dds.id) as datasource_count
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $1
      LEFT JOIN spaces s ON s.id = ds.space_id
      LEFT JOIN dashboard_elements de ON de.dashboard_id = d.id
      LEFT JOIN dashboard_datasources dds ON dds.dashboard_id = d.id
      WHERE (
        d.created_by = $1 OR
        dp.user_id = $1 OR
        (ds.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        d.visibility = 'PUBLIC'
      )
      ${where}
      GROUP BY d.id
      ORDER BY d.is_default DESC, d.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    
    const countSql = `
      SELECT COUNT(DISTINCT d.id)::int AS total 
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN dashboard_permissions dp ON dp.dashboard_id = d.id AND dp.user_id = $1
      WHERE (
        d.created_by = $1 OR
        dp.user_id = $1 OR
        (ds.space_id IN (
          SELECT sm.space_id FROM space_members sm WHERE sm.user_id = $1
        )) OR
        d.visibility = 'PUBLIC'
      )
      ${where}
    `
    
    const [{ rows: dashboards }, { rows: totalRows }] = await Promise.all([
      query(listSql, [...params, limit, offset]),
      query(countSql, params),
    ])
    
    const total = totalRows[0]?.total || 0
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/dashboards', 200, duration, { total })
    return NextResponse.json({
      dashboards: dashboards || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/dashboards')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      type: z.string().optional().default('CUSTOM'),
      visibility: z.enum(['PRIVATE', 'PUBLIC', 'SHARED']).optional().default('PRIVATE'),
      space_ids: z.array(commonSchemas.id).optional(),
      spaceIds: z.array(commonSchemas.id).optional(),
      refresh_rate: z.number().int().positive().optional(),
      refreshRate: z.number().int().positive().optional(),
      is_realtime: z.boolean().optional(),
      isRealtime: z.boolean().optional(),
      background_color: z.string().optional(),
      backgroundColor: z.string().optional(),
      font_family: z.string().optional(),
      fontFamily: z.string().optional(),
      font_size: z.number().int().positive().optional(),
      fontSize: z.number().int().positive().optional(),
      grid_size: z.number().int().positive().optional(),
      gridSize: z.number().int().positive().optional(),
      layout_config: z.any().optional(),
      layoutConfig: z.any().optional(),
      style_config: z.any().optional(),
      styleConfig: z.any().optional(),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const { 
      name, 
      description, 
      type = 'CUSTOM',
      visibility = 'PRIVATE',
      space_ids,
      spaceIds,
      refresh_rate,
      refreshRate,
      is_realtime,
      isRealtime,
      background_color,
      backgroundColor,
      font_family,
      fontFamily,
      font_size,
      fontSize,
      grid_size,
      gridSize,
      layout_config,
      layoutConfig,
      style_config,
      styleConfig
    } = bodyValidation.data

    const final_space_ids = space_ids || spaceIds
    if (!final_space_ids || final_space_ids.length === 0) {
      return NextResponse.json({ error: 'At least one space ID is required' }, { status: 400 })
    }

    const final_refresh_rate = refresh_rate !== undefined ? refresh_rate : (refreshRate !== undefined ? refreshRate : 300)
    const final_is_realtime = is_realtime !== undefined ? is_realtime : (isRealtime !== undefined ? isRealtime : false)
    const final_background_color = background_color || backgroundColor || '#ffffff'
    const final_font_family = font_family || fontFamily || 'Inter'
    const final_font_size = font_size !== undefined ? font_size : (fontSize !== undefined ? fontSize : 14)
    const final_grid_size = grid_size !== undefined ? grid_size : (gridSize !== undefined ? gridSize : 12)
    const final_layout_config = layout_config || layoutConfig || {}
    const final_style_config = style_config || styleConfig || {}

    logger.apiRequest('POST', '/api/dashboards', { userId: session.user.id, name, type, visibility })

    // Check if user has access to all spaces
    const accessResult = await requireAnySpaceAccess(final_space_ids, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Generate public link if visibility is PUBLIC
    let publicLink = null
    if (visibility === 'PUBLIC') {
      const { rows: linkRows } = await query('SELECT public.generate_dashboard_public_link() as link')
      publicLink = linkRows[0]?.link
    }

    // Create the dashboard
    const insertSql = `
      INSERT INTO public.dashboards (
        name, description, type, visibility, is_default, is_active,
        refresh_rate, is_realtime, public_link, background_color,
        font_family, font_size, grid_size, layout_config, style_config, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `
    
    const { rows } = await query(insertSql, [
      name,
      description || null,
      type,
      visibility,
      false, // is_default
      true,  // is_active
      final_refresh_rate,
      final_is_realtime,
      publicLink,
      final_background_color,
      final_font_family,
      final_font_size,
      final_grid_size,
      JSON.stringify(final_layout_config),
      JSON.stringify(final_style_config),
      session.user.id
    ])

    const dashboard = rows[0]

    // Associate the dashboard with spaces
    for (const spaceId of final_space_ids) {
      await query(
        'INSERT INTO dashboard_spaces (dashboard_id, space_id) VALUES ($1, $2)',
        [dashboard.id, spaceId]
      )
    }

    // Add creator as admin permission
    await query(
      'INSERT INTO dashboard_permissions (dashboard_id, user_id, role) VALUES ($1, $2, $3)',
      [dashboard.id, session.user.id, 'ADMIN']
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/dashboards', 201, duration, { dashboardId: dashboard.id })
    return NextResponse.json({ dashboard }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/dashboards')
