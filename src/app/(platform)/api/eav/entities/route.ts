import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
    const entityTypeId = searchParams.get('entity_type_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeInactive = searchParams.get('include_inactive') === 'true'

  let whereClause = 'WHERE ee.is_active = TRUE'
  const params: any[] = []
  let paramCount = 0

  if (entityTypeId) {
    paramCount++
    whereClause += ` AND ee.entity_type_id = $${paramCount}`
    params.push(entityTypeId)
  }

  if (includeInactive) {
    whereClause = whereClause.replace('WHERE ee.is_active = TRUE', 'WHERE 1=1')
  }

  // Add pagination parameters
  paramCount++
  params.push(limit)
  paramCount++
  params.push(offset)

  const { rows } = await query(`
      SELECT 
        ee.*,
        et.name as entity_type_name,
        et.display_name as entity_type_display_name,
        u.name as creator_name,
        u.email as creator_email
      FROM public.eav_entities ee
      LEFT JOIN public.entity_types et ON et.id = ee.entity_type_id
      LEFT JOIN public.users u ON u.id = ee.created_by
      ${whereClause}
      ORDER BY ee.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `, params)

  // Get total count
  const { rows: countRows } = await query(`
    SELECT COUNT(*) as total
    FROM public.eav_entities ee
    ${whereClause.replace('LIMIT $' + (paramCount - 1) + ' OFFSET $' + paramCount, '')}
  `, params.slice(0, -2))

  return NextResponse.json({ 
    entities: rows,
    count: rows.length,
    total: parseInt(countRows[0].total)
  })
}





export const GET = withErrorHandling(getHandler, 'GET /api/eav/entities')
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { 
    entityTypeId, 
    externalId, 
    metadata,
    values 
  } = body

  if (!entityTypeId) {
    return NextResponse.json({ error: 'Entity type ID is required' }, { status: 400 })
  }

  // Check if entity type exists
  const { rows: entityType } = await query(
    'SELECT id FROM public.entity_types WHERE id = $1 AND is_active = TRUE',
    [entityTypeId]
  )

  if (entityType.length === 0) {
    return NextResponse.json({ error: 'Entity type not found' }, { status: 404 })
  }

  // Check if external ID already exists for this entity type
  if (externalId) {
    const { rows: existing } = await query(
      'SELECT id FROM public.eav_entities WHERE entity_type_id = $1 AND external_id = $2',
      [entityTypeId, externalId]
    )

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Entity with this external ID already exists for this entity type' 
      }, { status: 409 })
    }
  }

  // Create entity
  const { rows: entityRows } = await query(`
    INSERT INTO public.eav_entities (
      entity_type_id, external_id, metadata, created_by, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *
  `, [
    entityTypeId,
    externalId || null,
    JSON.stringify(metadata || {}),
    session.user.id
  ])

  const entity = entityRows[0]

  // Create values if provided
  if (values && Array.isArray(values) && values.length > 0) {
    const valueInserts = values.map((value: any, index: number) => {
      const baseIndex = index * 8 + 5 // Start after entity parameters
      return `($1, $${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`
    }).join(', ')

    const valueParams = [entity.id]
    values.forEach((value: any) => {
      valueParams.push(
        value.attributeId,
        value.textValue || null,
        value.numberValue || null,
        value.booleanValue || null,
        value.dateValue || null,
        value.datetimeValue || null,
        value.jsonValue ? JSON.stringify(value.jsonValue) : null,
        value.blobValue || null
      )
    })

    await query(`
      INSERT INTO public.eav_values (
        entity_id, attribute_id, text_value, number_value, boolean_value,
        date_value, datetime_value, json_value, blob_value
      )
      VALUES ${valueInserts}
      ON CONFLICT (entity_id, attribute_id) 
      DO UPDATE SET
        text_value = EXCLUDED.text_value,
        number_value = EXCLUDED.number_value,
        boolean_value = EXCLUDED.boolean_value,
        date_value = EXCLUDED.date_value,
        datetime_value = EXCLUDED.datetime_value,
        json_value = EXCLUDED.json_value,
        blob_value = EXCLUDED.blob_value,
        updated_at = NOW()
    `, valueParams)
  }

  return NextResponse.json({ entity }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/eav/entities')
