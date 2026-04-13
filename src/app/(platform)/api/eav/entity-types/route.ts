import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('space_id')
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let whereClause = 'WHERE et.is_active = TRUE'
    const params: any[] = []

    if (spaceId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM data_model_spaces dms WHERE dms.data_model_id = et.id AND dms.space_id = $1)'
      params.push(spaceId)
    }

    if (includeInactive) {
      whereClause = whereClause.replace('WHERE et.is_active = TRUE', 'WHERE 1=1')
    }

    const { rows } = await query(`
      SELECT 
        et.*,
        COUNT(ea.id) as attribute_count,
        COUNT(ee.id) as entity_count
      FROM public.entity_types et
      LEFT JOIN public.eav_attributes ea ON ea.entity_type_id = et.id AND ea.is_active = TRUE
      LEFT JOIN public.eav_entities ee ON ee.entity_type_id = et.id AND ee.is_active = TRUE
      ${whereClause}
      GROUP BY et.id, et.name, et.display_name, et.description, et.parent_id, 
               et.is_abstract, et.is_active, et.sort_order, et.metadata, 
               et.created_at, et.updated_at, et.deleted_at
      ORDER BY et.sort_order ASC, et.display_name ASC
    `, params)

    return NextResponse.json({ 
      entityTypes: rows,
      count: rows.length 
    })

  } catch (error) {
    console.error('Error fetching entity types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





export const GET = withErrorHandling(getHandler, 'GET GET /api/eav/entity-types')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { 
      name, 
      displayName, 
      description, 
      parentId, 
      isAbstract, 
      sortOrder, 
      metadata 
    } = body

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Name and display name are required' }, { status: 400 })
    }

    // Check if name already exists
    const { rows: existing } = await query(
      'SELECT id FROM public.entity_types WHERE name = $1',
      [name]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Entity type with this name already exists' }, { status: 409 })
    }

    const { rows } = await query(`
      INSERT INTO public.entity_types (
        name, display_name, description, parent_id, is_abstract, 
        sort_order, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      name,
      displayName,
      description || null,
      parentId || null,
      isAbstract || false,
      sortOrder || 0,
      JSON.stringify(metadata || {})
    ])

    return NextResponse.json({ entityType: rows[0] }, { status: 201 })

  } catch (error) {
    console.error('Error creating entity type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/eav/entity-types')