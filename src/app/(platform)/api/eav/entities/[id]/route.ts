import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const includeValues = searchParams.get('include_values') !== 'false'

  // Get entity with basic info
  const { rows: entityRows } = await query(`
    SELECT 
      ee.*,
      et.name as entity_type_name,
      et.display_name as entity_type_display_name,
      u.name as creator_name,
      u.email as creator_email
    FROM public.eav_entities ee
    LEFT JOIN public.entity_types et ON et.id = ee.entity_type_id
    LEFT JOIN public.users u ON u.id = ee.created_by
    WHERE ee.id = $1
  `, [id])

  if (entityRows.length === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  const entity = entityRows[0]

  if (includeValues) {
    // Get all values for this entity
    const { rows: valueRows } = await query(`
      SELECT 
        ev.*,
        ea.name as attribute_name,
        ea.display_name as attribute_display_name,
        ea.data_type,
        ea.is_required,
        ea.is_unique,
        ag.name as attribute_group_name,
        ag.display_name as attribute_group_display_name
      FROM public.eav_values ev
      LEFT JOIN public.eav_attributes ea ON ea.id = ev.attribute_id
      LEFT JOIN public.attribute_groups ag ON ag.id = ea.attribute_group_id
      WHERE ev.entity_id = $1
      ORDER BY ea.sort_order ASC, ea.name ASC
    `, [id])

    entity.values = valueRows
  }

  return NextResponse.json({ entity })
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const { 
    externalId, 
    metadata,
    isActive,
    values 
  } = body

  // Check if entity exists
  const { rows: existing } = await query(
    'SELECT id FROM public.eav_entities WHERE id = $1',
    [id]
  )

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
  }

  // Update entity
    const { rows: entityRows } = await query(`
      UPDATE public.eav_entities SET
        external_id = COALESCE($2, external_id),
        metadata = COALESCE($3, metadata),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id,
      externalId,
      metadata ? JSON.stringify(metadata) : null,
      isActive
    ])

    const entity = entityRows[0]

    // Update values if provided
    if (values && Array.isArray(values)) {
      for (const value of values) {
        if (value.attributeId) {
          await query(`
            INSERT INTO public.eav_values (
              entity_id, attribute_id, text_value, number_value, boolean_value,
              date_value, datetime_value, json_value, blob_value
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
          `, [
            id,
            value.attributeId,
            value.textValue || null,
            value.numberValue || null,
            value.booleanValue || null,
            value.dateValue || null,
            value.datetimeValue || null,
            value.jsonValue ? JSON.stringify(value.jsonValue) : null,
            value.blobValue || null
          ])
        }
      }
    }

    return NextResponse.json({ entity })
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Soft delete entity
    const { rows } = await query(`
      UPDATE public.eav_entities SET
        is_active = FALSE,
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id])

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}


export const GET = withErrorHandling(getHandler, 'GET GET /api/eav/entities/[id]/route.ts')
export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/eav/entities/[id]/route.ts')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/eav/entities/[id]/route.ts')