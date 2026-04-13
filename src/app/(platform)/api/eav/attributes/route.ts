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
  const attributeGroupId = searchParams.get('attribute_group_id')
  const includeInactive = searchParams.get('include_inactive') === 'true'

  let whereClause = 'WHERE ea.is_active = TRUE'
  const params: any[] = []
  let paramCount = 0

  if (entityTypeId) {
    paramCount++
    whereClause += ` AND ea.entity_type_id = $${paramCount}`
    params.push(entityTypeId)
  }

  if (attributeGroupId) {
    paramCount++
    whereClause += ` AND ea.attribute_group_id = $${paramCount}`
    params.push(attributeGroupId)
  }

  if (includeInactive) {
    whereClause = whereClause.replace('WHERE ea.is_active = TRUE', 'WHERE 1=1')
  }

  const { rows } = await query(`
      SELECT 
        ea.*,
        et.name as entity_type_name,
        et.display_name as entity_type_display_name,
        ag.name as attribute_group_name,
        ag.display_name as attribute_group_display_name,
        ret.name as reference_entity_type_name,
        ret.display_name as reference_entity_type_display_name
      FROM public.eav_attributes ea
      LEFT JOIN public.entity_types et ON et.id = ea.entity_type_id
      LEFT JOIN public.attribute_groups ag ON ag.id = ea.attribute_group_id
      LEFT JOIN public.entity_types ret ON ret.id = ea.reference_entity_type_id
      ${whereClause}
      ORDER BY ea.sort_order ASC, ea.name ASC
  `, params)

  return NextResponse.json({ 
    attributes: rows,
    count: rows.length 
  })
}





export const GET = withErrorHandling(getHandler, 'GET /api/eav/attributes')
async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { 
    name, 
    displayName, 
    description,
    entityTypeId,
    attributeGroupId,
    dataType,
    cardinality,
    scope,
    isRequired,
    isUnique,
    isIndexed,
    isSearchable,
    isAuditable,
    defaultValue,
    options,
    validationRules,
    sortOrder,
    isVisible,
    isEditable,
    helpText,
    placeholder,
    referenceEntityTypeId,
    referenceDisplayField,
    isAutoIncrement,
    autoIncrementPrefix,
    autoIncrementSuffix,
    autoIncrementStart,
    autoIncrementPadding,
    externalColumn,
    externalMapping,
    metadata
  } = body

  if (!name || !displayName || !entityTypeId || !dataType) {
    return NextResponse.json({ 
      error: 'Name, display name, entity type ID, and data type are required' 
    }, { status: 400 })
  }

  // Check if attribute name already exists for this entity type
  const { rows: existing } = await query(
    'SELECT id FROM public.eav_attributes WHERE entity_type_id = $1 AND name = $2',
    [entityTypeId, name]
  )

  if (existing.length > 0) {
    return NextResponse.json({ 
      error: 'Attribute with this name already exists for this entity type' 
    }, { status: 409 })
  }

  // Validate reference entity type if provided
  if (referenceEntityTypeId) {
    const { rows: refEntityType } = await query(
      'SELECT id FROM public.entity_types WHERE id = $1',
      [referenceEntityTypeId]
    )

    if (refEntityType.length === 0) {
      return NextResponse.json({ 
        error: 'Reference entity type not found' 
      }, { status: 400 })
    }
  }

  const { rows } = await query(`
      INSERT INTO public.eav_attributes (
        name, display_name, description, entity_type_id, attribute_group_id,
        data_type, cardinality, scope, is_required, is_unique, is_indexed,
        is_searchable, is_auditable, default_value, options, validation_rules,
        sort_order, is_visible, is_editable, help_text, placeholder,
        reference_entity_type_id, reference_display_field, is_auto_increment,
        auto_increment_prefix, auto_increment_suffix, auto_increment_start,
        auto_increment_padding, external_column, external_mapping, metadata,
        created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, NOW(), NOW()
      )
    RETURNING *
  `, [
    name,
    displayName,
    description || null,
    entityTypeId,
    attributeGroupId || null,
    dataType,
    cardinality || 'SINGLE',
    scope || 'INSTANCE',
    isRequired || false,
    isUnique || false,
    isIndexed || false,
    isSearchable !== false,
    isAuditable !== false,
    defaultValue || null,
    JSON.stringify(options || {}),
    JSON.stringify(validationRules || {}),
    sortOrder || 0,
    isVisible !== false,
    isEditable !== false,
    helpText || null,
    placeholder || null,
    referenceEntityTypeId || null,
    referenceDisplayField || null,
    isAutoIncrement || false,
    autoIncrementPrefix || '',
    autoIncrementSuffix || '',
    autoIncrementStart || 1,
    autoIncrementPadding || 3,
    externalColumn || null,
    JSON.stringify(externalMapping || {}),
    JSON.stringify(metadata || {})
  ])

  return NextResponse.json({ attribute: rows[0] }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/eav/attributes')
