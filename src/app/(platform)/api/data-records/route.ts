import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createExternalClient } from '@/lib/external-db'
import { isUuid } from '@/lib/validation'
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
      data_model_id: commonSchemas.id.optional(),
      dataModelId: commonSchemas.id.optional(),
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '20')).pipe(z.number().int().positive().max(100)).optional().default(20),
      sort_by: z.string().optional(),
      sort_direction: z.enum(['asc', 'desc']).optional().default('desc'),
    }).passthrough()) // Allow filter_* params to pass through
    
    if (!queryValidation.success) {
      return queryValidation.response
    }
    
    const { 
      data_model_id, 
      dataModelId: dmId, 
      page, 
      limit = 20, 
      sort_by: sortBy, 
      sort_direction: sortDirectionRaw 
    } = queryValidation.data
    const dataModelId = data_model_id || dmId
    if (!dataModelId) {
      return NextResponse.json({ error: 'data_model_id is required' }, { status: 400 })
    }
    logger.apiRequest('GET', '/api/data-records', { userId: session.user.id, dataModelId, page, limit })

    const offset = (page - 1) * limit

    // Load data model and potential external configuration
    const { rows: modelRows } = await query(
      `SELECT dm.id, dm.source_type, dm.external_connection_id, dm.external_schema, dm.external_table, dm.external_primary_key
             , ec.id as conn_id, ec.db_type, ec.host, ec.port, ec.database, ec.username, ec.password, ec.options
       FROM public.data_models dm
       LEFT JOIN public.external_connections ec ON ec.id = dm.external_connection_id AND ec.deleted_at IS NULL AND ec.is_active = TRUE
       WHERE dm.id = $1::uuid AND dm.deleted_at IS NULL`,
      [dataModelId]
    )
    const model = modelRows[0]
    if (!model) {
      logger.warn('Data model not found', { dataModelId })
      return NextResponse.json({ error: 'data_model not found' }, { status: 404 })
    }
    
    // Extract filters from search params
    const { searchParams } = new URL(request.url)
    const filters: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (key.startsWith('filter_')) {
        const attributeName = key.replace('filter_', '')
        filters[attributeName] = value
      }
    })

    // Sort params
    const sortDirection = sortDirectionRaw === 'asc' ? 'ASC' : 'DESC'
    
    logger.debug('Fetching records for model', { dataModelId, page, limit, offset, filters, sortBy, sortDirection })
    
    // If EXTERNAL model, query external database
    if (model.source_type === 'EXTERNAL' && model.conn_id && model.external_table) {
      // Load attribute mappings
      const { rows: attrs } = await query(
        `SELECT name, external_column FROM public.data_model_attributes WHERE data_model_id = $1::uuid AND deleted_at IS NULL ORDER BY "order" ASC` as any,
        [dataModelId]
      )

      // Build select list mapping
      const nameToColumn: Record<string, string> = {}
      for (const a of attrs) {
        if (a.external_column) nameToColumn[a.name] = a.external_column
      }

      // Quoting helpers
      const isPg = model.db_type === 'postgres'
      const q = (id: string) => (isPg ? `"${id}"` : `\`${id}\``)
      const qualify = (schema: string | null, table: string) => {
        if (!schema) return isPg ? q(table) : q(table)
        return isPg ? `${q(schema)}.${q(table)}` : `${q(schema)}.${q(table)}`
      }

      const tableRef = qualify(model.external_schema, model.external_table)

      // Build WHERE from filters
      const whereClauses: string[] = []
      const extParams: any[] = []
      for (const [attrName, filterValue] of Object.entries(filters)) {
        const col = nameToColumn[attrName]
        if (!col) continue
        if (typeof filterValue === 'string' && filterValue.includes(',')) {
          const values = filterValue.split(',').map(v => v.trim()).filter(Boolean)
          if (values.length) {
            const placeholders = values.map(() => '?').join(',')
            whereClauses.push(`${q(col)} IN (${placeholders})`)
            extParams.push(...values)
          }
        } else {
          whereClauses.push(`${q(col)} LIKE ?`)
          extParams.push(`%${filterValue}%`)
        }
      }

      // Sorting
      let orderClause = ''
      if (sortBy) {
        const sortCol = nameToColumn[sortBy] || sortBy
        orderClause = `ORDER BY ${q(sortCol)} ${sortDirection}`
      }

      // Pagination
      const limitClause = isPg ? 'LIMIT $1 OFFSET $2' : 'LIMIT ? OFFSET ?'

      // Build select columns
      const selectCols = Object.entries(nameToColumn).map(([attr, col]) => `${q(col)} AS ${isPg ? '"' + attr + '"' : '`' + attr + '`'}`)
      const pkCol = model.external_primary_key ? q(model.external_primary_key) : (isPg ? 'NULL::text' : 'NULL')
      const selectSql = `SELECT ${pkCol} AS id${selectCols.length ? ', ' + selectCols.join(', ') : ''} FROM ${tableRef}`
      const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : ''
      const finalSql = `${selectSql}${whereSql} ${orderClause} ${limitClause}`.trim()

      // Prepare parameter placeholders for pg vs mysql
      let runSql = finalSql
      let paramsAny: any[] = []
      if (isPg) {
        // Replace '?' with $n
        let counter = 1
        runSql = finalSql.replace(/\?/g, () => `$${counter++}`)
        paramsAny = [...extParams, limit, offset]
      } else {
        paramsAny = [...extParams, limit, offset]
      }

      // Count query
      const countBase = `SELECT COUNT(1) as total FROM ${tableRef}${whereSql}`
      let countSql = countBase
      let countParams: any[] = []
      if (isPg) {
        let counter = 1
        countSql = countBase.replace(/\?/g, () => `$${counter++}`)
        countParams = [...extParams]
      } else {
        countParams = [...extParams]
      }

      // Create external client with Vault credential retrieval
      const { createExternalClientWithCredentials } = await import('@/lib/external-connection-helper')
      const client = await createExternalClientWithCredentials({
        id: model.conn_id,
        db_type: model.db_type,
        host: model.host,
        port: model.port,
        database: model.database,
        username: model.username,
        password: model.password,
        options: model.options,
      })
      try {
        const [{ rows: extRows }, { rows: countRows }]: any = await Promise.all([
          client.query(runSql, paramsAny),
          client.query(countSql, countParams),
        ])

        const total = (countRows?.[0]?.total as number) || 0
        const mapped = (extRows || []).map((r: any) => ({
          id: String(r.id ?? ''),
          data_model_id: dataModelId,
          is_active: true,
          created_at: null,
          updated_at: null,
          deleted_at: null,
          values: Object.fromEntries(
            Object.entries(nameToColumn).map(([attr]) => [attr, r[attr] ?? null])
          ),
        }))

        const duration = Date.now() - startTime
        logger.apiResponse('GET', '/api/data-records', 200, duration, { total, recordsCount: mapped.length, sourceType: 'EXTERNAL' })
        return NextResponse.json({
          records: mapped,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        })
      } finally {
        await client.close()
      }
    }

    // INTERNAL: Build dynamic query with filters
    let whereConditions = ['dr.data_model_id = $1::uuid', 'dr.is_active = TRUE']
    let params: any[] = [dataModelId]
    let paramIndex = 2
    
    // Add filter conditions
    Object.entries(filters).forEach(([attributeName, filterValue]) => {
      if (filterValue && filterValue.trim() !== '') {
        // Check if it's a comma-separated value (could be multi-select or range)
        if (filterValue.includes(',')) {
          const values = filterValue.split(',').map(v => v.trim()).filter(v => v)
          
          if (values.length > 0) {
            // Check if it's a range (2 values, both numeric or date-like)
            const isRange = values.length === 2 && (
              (!isNaN(Number(values[0])) && !isNaN(Number(values[1]))) || // Number range
              (values[0].includes('-') && values[1].includes('-')) || // Date range
              (values[0].includes('T') && values[1].includes('T')) // DateTime range
            )
            
            if (isRange) {
              // Range filter: min <= value <= max
              whereConditions.push(`EXISTS (
                SELECT 1 FROM public.data_record_values drv2 
                JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
                WHERE drv2.data_record_id = dr.id 
                AND dma2.name = $${paramIndex} 
                AND (
                  ($${paramIndex + 1} = '' OR drv2.value >= $${paramIndex + 1}) 
                  AND ($${paramIndex + 2} = '' OR drv2.value <= $${paramIndex + 2})
                )
              )`)
              params.push(attributeName, values[0] || '', values[1] || '')
              paramIndex += 3
            } else {
              // Multi-select: check if any of the values match
              const valueConditions = values.map((_, index) => `drv2.value = $${paramIndex + index + 1}`).join(' OR ')
              whereConditions.push(`EXISTS (
                SELECT 1 FROM public.data_record_values drv2 
                JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
                WHERE drv2.data_record_id = dr.id 
                AND dma2.name = $${paramIndex} 
                AND (${valueConditions})
              )`)
              params.push(attributeName, ...values)
              paramIndex += values.length + 1
            }
          }
        } else {
          // Single value: use ILIKE for partial matching
          whereConditions.push(`EXISTS (
            SELECT 1 FROM public.data_record_values drv2 
            JOIN public.data_model_attributes dma2 ON drv2.attribute_id = dma2.id 
            WHERE drv2.data_record_id = dr.id 
            AND dma2.name = $${paramIndex} 
            AND drv2.value ILIKE $${paramIndex + 1}
          )`)
          params.push(attributeName, `%${filterValue}%`)
          paramIndex += 2
        }
      }
    })

    // Capture number of WHERE params before adding sort/limit/offset
    const whereParamCount = params.length

    // Determine ORDER BY clause
    let orderClause = ''
    if (sortBy) {
      if (['created_at','updated_at','id'].includes(sortBy)) {
        orderClause = `ORDER BY dr.${sortBy} ${sortDirection}`
      } else {
        // Sort by attribute value
        orderClause = `ORDER BY MAX(CASE WHEN dma.name = $${paramIndex} THEN drv.value END) ${sortDirection} NULLS LAST`
        params.push(sortBy)
        paramIndex += 1
      }
    } else {
      orderClause = 'ORDER BY dr.created_at DESC'
    }
    
    const baseQuery = `
      SELECT 
        dr.id,
        dr.data_model_id,
        dr.is_active,
        dr.created_at,
        dr.updated_at,
        dr.deleted_at,
        COALESCE(
          jsonb_object_agg(
            dma.name, 
            drv.value
          ) FILTER (WHERE drv.attribute_id IS NOT NULL), 
          '{}'::jsonb
        ) as values
      FROM public.data_records dr
      LEFT JOIN public.data_record_values drv ON dr.id = drv.data_record_id
      LEFT JOIN public.data_model_attributes dma ON drv.attribute_id = dma.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY dr.id, dr.data_model_id, dr.is_active, dr.created_at, dr.updated_at, dr.deleted_at
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    
    params.push(limit, offset)
    
    // Count query with same filters
    const countQuery = `
      SELECT COUNT(DISTINCT dr.id)::int AS total 
      FROM public.data_records dr
      WHERE ${whereConditions.join(' AND ')}
    `
    
    const countParams = params.slice(0, whereParamCount)
    
    logger.debug('Executing data records query', { 
      query: baseQuery.substring(0, 200), 
      paramCount: params.length,
      countQuery: countQuery.substring(0, 200)
    })

    const [{ rows: records }, { rows: totalRows }] = await Promise.all([
      query(baseQuery, params),
      query(countQuery, countParams),
    ])
    
    const total = totalRows[0]?.total || 0
    
    logger.debug('Records query completed', { 
      recordsFound: records.length, 
      total,
      sampleRecordId: records.length > 0 ? records[0].id : null
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/data-records', 200, duration, { total, recordsCount: records.length })
    return NextResponse.json({
      records: records || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-records')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      data_model_id: commonSchemas.id.optional(),
      dataModelId: commonSchemas.id.optional(),
      values: z.array(z.object({
        attribute_id: commonSchemas.id.optional(),
        attributeId: commonSchemas.id.optional(),
        value: z.any().optional().nullable(),
      })),
    }))
    
    if (!bodyValidation.success) {
      return bodyValidation.response
    }
    
    const data_model_id = bodyValidation.data.data_model_id || bodyValidation.data.dataModelId
    if (!data_model_id) {
      return NextResponse.json({ error: 'data_model_id is required' }, { status: 400 })
    }
    const values = bodyValidation.data.values.map(v => ({
      attribute_id: v.attribute_id || v.attributeId,
      value: v.value
    }))
    
    // Ensure all values have attribute_id
    if (values.some(v => !v.attribute_id)) {
      return NextResponse.json({ error: 'attribute_id is required for all values' }, { status: 400 })
    }
    logger.apiRequest('POST', '/api/data-records', { userId: session.user.id, dataModelId: data_model_id, valuesCount: values.length })

    const { rows: recordRows } = await query(
      'INSERT INTO public.data_records (data_model_id) VALUES ($1) RETURNING *',
      [data_model_id]
    )
    const record = recordRows[0]

    if (values.length) {
      const insertValuesSql = `
        INSERT INTO public.data_record_values (data_record_id, attribute_id, value)
        VALUES ${values.map((_, idx) => `($1, $${idx * 2 + 2}, $${idx * 2 + 3})`).join(', ')}
      `
      const flatParams: any[] = [record.id]
      for (const v of values) {
        flatParams.push(v.attribute_id, v.value ?? null)
      }
      await query(insertValuesSql, flatParams)
    }

    const { rows: fullRows } = await query(
      'SELECT * FROM public.data_records WHERE id = $1::uuid',
      [record.id]
    )
    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/data-records', 201, duration, { recordId: record.id })
    return NextResponse.json({ record: fullRows[0]  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-records')


