import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../utils'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check if user has access to collection
  const collectionResult = await query(
    `SELECT 
        kc.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator
      FROM ${schema}.knowledge_collections kc
      LEFT JOIN users u ON u.id::text = kc.created_by::text
      WHERE kc.id::text = $1 AND kc.deleted_at IS NULL`,
    [id]
  )

  if (collectionResult.rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const collection = collectionResult.rows[0]

  // Check if user is member or creator
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [id, session.user.id]
  )

  const isCreator = collection.created_by === session.user.id
  const isMember = memberCheck.rows.length > 0

  if (!isCreator && !isMember && collection.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get members
  const membersResult = await query(
    `SELECT 
        kcm.id,
        kcm.role,
        kcm.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as user
      FROM ${schema}.knowledge_collection_members kcm
      JOIN users u ON u.id::text = kcm.user_id::text
      WHERE kcm.collection_id::text = $1
      ORDER BY kcm.created_at ASC`,
    [id]
  )

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/knowledge/collections/${id}`,
    200
  )

  return NextResponse.json({
    collection: {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
      isPrivate: collection.is_private,
      spaceId: collection.space_id,
      createdBy: collection.created_by,
      creator: collection.creator,
      members: membersResult.rows.map((m: any) => ({
        id: m.id,
        role: m.role,
        user: m.user,
        createdAt: m.created_at,
      })),
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/collections/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  const body = await request.json()
  const { name, description, icon, color, isPrivate, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check if user is admin or creator
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [id, session.user.id]
  )

  const collectionCheck = await query(
    `SELECT created_by FROM ${schema}.knowledge_collections WHERE id::text = $1`,
    [id]
  )

  if (collectionCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const isCreator = collectionCheck.rows[0].created_by === session.user.id
  const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update collection
  const updateFields: string[] = []
  const updateValues: any[] = []
  let paramIndex = 1

  if (name !== undefined) {
    updateFields.push(`name = $${paramIndex}`)
    updateValues.push(name.trim())
    paramIndex++
  }
  if (description !== undefined) {
    updateFields.push(`description = $${paramIndex}`)
    updateValues.push(description?.trim() || null)
    paramIndex++
  }
  if (icon !== undefined) {
    updateFields.push(`icon = $${paramIndex}`)
    updateValues.push(icon || null)
    paramIndex++
  }
  if (color !== undefined) {
    updateFields.push(`color = $${paramIndex}`)
    updateValues.push(color || null)
    paramIndex++
  }
  if (isPrivate !== undefined) {
    updateFields.push(`is_private = $${paramIndex}::boolean`)
    updateValues.push(isPrivate)
    paramIndex++
  }

  if (updateFields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updateFields.push(`updated_at = NOW()`)
  updateValues.push(id)

  const result = await query(
    `UPDATE ${schema}.knowledge_collections
       SET ${updateFields.join(', ')}
       WHERE id::text = $${paramIndex}
       RETURNING *`,
    updateValues
  )

  await logAPIRequest(
    session.user.id,
    'PUT',
    `/api/knowledge/collections/${id}`,
    200
  )

  return NextResponse.json({
    collection: result.rows[0],
  })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/knowledge/collections/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check if user is admin or creator
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [id, session.user.id]
  )

  const collectionCheck = await query(
    `SELECT created_by FROM ${schema}.knowledge_collections WHERE id::text = $1`,
    [id]
  )

  if (collectionCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const isCreator = collectionCheck.rows[0].created_by === session.user.id
  const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  await query(
    `UPDATE ${schema}.knowledge_collections
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id::text = $1`,
    [id]
  )

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/knowledge/collections/${id}`,
    200
  )

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/collections/[id]')
