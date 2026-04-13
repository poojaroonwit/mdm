import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
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
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get document with collection info
  const documentResult = await query(
    `SELECT 
        kd.*,
        kc.is_private as collection_is_private,
        kc.created_by as collection_created_by,
        json_build_object(
          'id', u1.id,
          'name', u1.name,
          'email', u1.email,
          'avatar', u1.avatar
        ) as creator,
        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email,
          'avatar', u2.avatar
        ) as updater
      FROM ${schema}.knowledge_documents kd
      JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
      LEFT JOIN users u1 ON u1.id::text = kd.created_by::text
      LEFT JOIN users u2 ON u2.id::text = kd.updated_by::text
      WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [id]
  )

  if (documentResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = documentResult.rows[0]

  // Check access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isMember = memberCheck.rows.length > 0
  const isPublic = doc.is_public

  if (!isCollectionCreator && !isMember && doc.collection_is_private && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get children
  const childrenResult = await query(
    `SELECT id, title, "order", is_pinned, created_at
       FROM ${schema}.knowledge_documents
       WHERE parent_id::text = $1 AND deleted_at IS NULL
       ORDER BY is_pinned DESC, "order" ASC, created_at ASC`,
    [id]
  )

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/knowledge/documents/${id}`,
    200
  )

  return NextResponse.json({
    document: {
      id: doc.id,
      collectionId: doc.collection_id,
      title: doc.title,
      content: doc.content,
      contentHtml: doc.content_html,
      parentId: doc.parent_id,
      isTemplate: doc.is_template,
      isPublic: doc.is_public,
      isPinned: doc.is_pinned,
      publishedAt: doc.published_at,
      archivedAt: doc.archived_at,
      order: doc.order,
      createdBy: doc.created_by,
      updatedBy: doc.updated_by,
      creator: doc.creator,
      updater: doc.updater,
      children: childrenResult.rows,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]')

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
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const body = await request.json()
  const { title, content, contentHtml, parentId, isPublic, isPinned, order, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get document and check access
  const docResult = await query(
    `SELECT kd.collection_id, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [id]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Check write access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isEditor = memberCheck.rows.length > 0 && ['admin', 'editor'].includes(memberCheck.rows[0].role)

  if (!isCollectionCreator && !isEditor && doc.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build update query
  const updateFields: string[] = []
  const updateValues: any[] = []
  let paramIndex = 1

  if (title !== undefined) {
    updateFields.push(`title = $${paramIndex}`)
    updateValues.push(title.trim())
    paramIndex++
  }
  if (content !== undefined) {
    updateFields.push(`content = $${paramIndex}`)
    updateValues.push(content)
    paramIndex++
  }
  if (contentHtml !== undefined) {
    updateFields.push(`content_html = $${paramIndex}`)
    updateValues.push(contentHtml)
    paramIndex++
  }
  if (parentId !== undefined) {
    updateFields.push(`parent_id = $${paramIndex}::uuid`)
    updateValues.push(parentId || null)
    paramIndex++
  }
  if (isPublic !== undefined) {
    updateFields.push(`is_public = $${paramIndex}::boolean`)
    updateValues.push(isPublic)
    paramIndex++
  }
  if (isPinned !== undefined) {
    updateFields.push(`is_pinned = $${paramIndex}::boolean`)
    updateValues.push(isPinned)
    paramIndex++
  }
  if (order !== undefined) {
    updateFields.push(`"order" = $${paramIndex}::integer`)
    updateValues.push(order)
    paramIndex++
  }

  if (updateFields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updateFields.push(`updated_by = $${paramIndex}::uuid`)
  updateValues.push(session.user.id)
  paramIndex++

  updateFields.push(`updated_at = NOW()`)
  updateValues.push(id)

  const sql = `UPDATE ${schema}.knowledge_documents
       SET ${updateFields.join(', ')}
       WHERE id::text = $${paramIndex}
       RETURNING *`

  const result = await query(sql, updateValues)

  const updatedDoc = result.rows[0]

  // Create version if content changed
  if (content !== undefined || title !== undefined) {
    await query(
      `INSERT INTO ${schema}.knowledge_document_versions (
          id, document_id, title, content, content_html, created_by, created_at
        ) VALUES (
          gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid, NOW()
        )`,
      [
        updatedDoc.id,
        updatedDoc.title,
        updatedDoc.content,
        updatedDoc.content_html,
        session.user.id,
      ]
    )
  }

  await logAPIRequest(
    session.user.id,
    'PUT',
    `/api/knowledge/documents/${id}`,
    200
  )

  return NextResponse.json({
    document: updatedDoc,
  })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/knowledge/documents/[id]')

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
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get document and check access
  const docResult = await query(
    `SELECT kd.collection_id, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [id]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Check delete access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

  if (!isCollectionCreator && !isAdmin && doc.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  await query(
    `UPDATE ${schema}.knowledge_documents
       SET deleted_at = NOW(), updated_at = NOW()
       WHERE id::text = $1`,
    [id]
  )

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/knowledge/documents/${id}`,
    200
  )

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/documents/[id]')
