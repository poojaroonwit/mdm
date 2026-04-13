import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate query parameters - use passthrough for complex filters
  const queryValidation = validateQuery(request, z.object({
    q: z.string().optional().default(''),
    spaceId: commonSchemas.id.optional(),
    space_id: commonSchemas.id.optional(),
    fileType: z.string().optional(),
    file_type: z.string().optional(),
    category: z.string().optional(),
    tag: z.string().optional(),
    dateFrom: z.string().optional(),
    date_from: z.string().optional(),
    dateTo: z.string().optional(),
    date_to: z.string().optional(),
    sizeMin: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    size_min: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    sizeMax: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    size_max: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    uploadedBy: commonSchemas.id.optional(),
    uploaded_by: commonSchemas.id.optional(),
    sortBy: z.enum(['name', 'size', 'type', 'uploaded_at', 'uploaded_at']).optional().default('uploaded_at'),
    sort_by: z.enum(['name', 'size', 'type', 'uploaded_at', 'uploaded_at']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    sort_order: z.enum(['asc', 'desc']).optional(),
    page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
    limit: z.string().optional().transform((val) => parseInt(val || '20')).pipe(z.number().int().positive().max(100)).optional().default(20),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
  
  const { 
    q = '', 
    spaceId, 
    space_id, 
    fileType, 
    file_type, 
    category, 
    tag, 
    dateFrom, 
    date_from, 
    dateTo, 
    date_to, 
    sizeMin, 
    size_min, 
    sizeMax, 
    size_max, 
    uploadedBy, 
    uploaded_by, 
    sortBy, 
    sort_by, 
    sortOrder, 
    sort_order, 
    page, 
    limit = 20 
  } = queryValidation.data

  const finalSpaceId = spaceId || space_id
  if (!finalSpaceId) {
    return NextResponse.json({ error: 'spaceId is required' }, { status: 400 })
  }

  const finalFileType = fileType || file_type
  const finalDateFrom = dateFrom || date_from
  const finalDateTo = dateTo || date_to
  const finalSizeMin = sizeMin ?? size_min
  const finalSizeMax = sizeMax ?? size_max
  const finalUploadedBy = uploadedBy || uploaded_by
  const finalSortBy = sortBy || sort_by || 'uploaded_at'
  const finalSortOrder = sortOrder || sort_order || 'desc'
  const offset = (page - 1) * limit
  logger.apiRequest('GET', '/api/files/search', { userId, spaceId: finalSpaceId, q, page, limit })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(finalSpaceId, userId)
  if (!accessResult.success) return accessResult.response

  // Build the search query
  let whereConditions = ['af.space_id = $1', 'af.deleted_at IS NULL']
  let queryParams: any[] = [finalSpaceId]
  let paramIndex = 2

  // Text search
  if (q) {
    whereConditions.push(`fsi.search_text ILIKE $${paramIndex}`)
    queryParams.push(`%${q}%`)
    paramIndex++
  }

  // File type filter
  if (finalFileType) {
    const types = finalFileType.split(',').map(t => t.trim())
    const typeConditions = types.map(() => {
      const condition = `af.mime_type ILIKE $${paramIndex}`
      queryParams.push(`%${types[queryParams.length - paramIndex + 1]}%`)
      paramIndex++
      return condition
    })
    whereConditions.push(`(${typeConditions.join(' OR ')})`)
  }

  // Category filter
  if (category) {
    whereConditions.push(`fc.name = $${paramIndex}`)
    queryParams.push(category)
    paramIndex++
  }

  // Tag filter
  if (tag) {
    whereConditions.push(`ft.name = $${paramIndex}`)
    queryParams.push(tag)
    paramIndex++
  }

  // Date range filter
  if (finalDateFrom) {
    whereConditions.push(`af.uploaded_at >= $${paramIndex}`)
    queryParams.push(finalDateFrom)
    paramIndex++
  }

  if (finalDateTo) {
    whereConditions.push(`af.uploaded_at <= $${paramIndex}`)
    queryParams.push(finalDateTo)
    paramIndex++
  }

  // Size range filter
  if (finalSizeMin) {
    whereConditions.push(`af.file_size >= $${paramIndex}`)
    queryParams.push(String(finalSizeMin))
    paramIndex++
  }

  if (finalSizeMax) {
    whereConditions.push(`af.file_size <= $${paramIndex}`)
    queryParams.push(String(finalSizeMax))
    paramIndex++
  }

  // Uploaded by filter
  if (finalUploadedBy) {
    whereConditions.push(`af.uploaded_by = $${paramIndex}`)
    queryParams.push(finalUploadedBy)
    paramIndex++
  }

  // Build the main query
  const baseQuery = `
    FROM attachment_files af
    LEFT JOIN file_search_index fsi ON af.id = fsi.file_id
    LEFT JOIN file_categorizations fc_rel ON af.id = fc_rel.file_id
    LEFT JOIN file_categories fc ON fc_rel.category_id = fc.id
    LEFT JOIN file_tag_assignments fta ON af.id = fta.file_id
    LEFT JOIN file_tags ft ON fta.tag_id = ft.id
    WHERE ${whereConditions.join(' AND ')}
  `

  // Get total count
  const countQuery = `SELECT COUNT(DISTINCT af.id) as total ${baseQuery}`
  const countResult = await query(countQuery, queryParams)
  const total = parseInt((countResult.rows[0] as any).total)

  // Get files with pagination
  const orderBy = finalSortBy === 'name' ? 'af.file_name' :
                 finalSortBy === 'size' ? 'af.file_size' :
                 finalSortBy === 'type' ? 'af.mime_type' :
                 'af.uploaded_at'

  const filesQuery = `
    SELECT DISTINCT
      af.id,
      af.file_name,
      af.file_path,
      af.file_size,
      af.mime_type,
      af.uploaded_by,
      af.uploaded_at,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', fc.id,
            'name', fc.name,
            'color', fc.color,
            'icon', fc.icon
          )
        ) FILTER (WHERE fc.id IS NOT NULL),
        '[]'::json
      ) as categories,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ft.id,
            'name', ft.name,
            'color', ft.color
          )
        ) FILTER (WHERE ft.id IS NOT NULL),
        '[]'::json
      ) as tags
    ${baseQuery}
    GROUP BY af.id, af.file_name, af.file_path, af.file_size, af.mime_type, af.uploaded_by, af.uploaded_at
    ORDER BY ${orderBy} ${finalSortOrder.toUpperCase()}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  queryParams.push(limit, offset)
  const filesResult = await query(filesQuery, queryParams)

  // Get available filters for the response
  const filtersQuery = `
    SELECT 
      json_agg(DISTINCT af.mime_type) as file_types,
      json_agg(DISTINCT fc.name) FILTER (WHERE fc.name IS NOT NULL) as categories,
      json_agg(DISTINCT ft.name) FILTER (WHERE ft.name IS NOT NULL) as tags,
      MIN(af.uploaded_at) as earliest_date,
      MAX(af.uploaded_at) as latest_date,
      MIN(af.file_size) as min_size,
      MAX(af.file_size) as max_size
    FROM attachment_files af
    LEFT JOIN file_categorizations fc_rel ON af.id = fc_rel.file_id
    LEFT JOIN file_categories fc ON fc_rel.category_id = fc.id
    LEFT JOIN file_tag_assignments fta ON af.id = fta.file_id
    LEFT JOIN file_tags ft ON fta.tag_id = ft.id
    WHERE af.space_id = $1 AND af.deleted_at IS NULL
  `

  const filtersResult = await query(filtersQuery, [finalSpaceId])
  const filters = filtersResult.rows[0] as any

  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/files/search', 200, duration, { total, filesCount: filesResult.rows.length })
  
  return NextResponse.json({
    files: filesResult.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    filters: {
      fileTypes: filters.file_types || [],
      categories: filters.categories || [],
      tags: filters.tags || [],
      dateRange: {
        from: filters.earliest_date,
        to: filters.latest_date
      },
      sizeRange: {
        min: filters.min_size,
        max: filters.max_size
      }
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/files/search')
