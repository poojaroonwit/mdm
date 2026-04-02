import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { buildSearchClause } from '@/shared/lib/api/filtering'
import { getKnowledgeSchema } from '../utils'

async function getHandler(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const searchParams = request.nextUrl.searchParams
  const collectionId = searchParams.get('collectionId') || searchParams.get('collection_id')
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
  const parentId = searchParams.get('parentId') || searchParams.get('parent_id')
  const search = searchParams.get('search')

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const { sortBy, sortOrder } = parseSortParams(request)

  if (!collectionId) {
    return NextResponse.json(
      { error: 'collectionId is required' },
      { status: 400 }
    )
  }

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check if user has access to collection
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
     WHERE collection_id::text = $1 AND user_id::text = $2`,
    [collectionId, session.user.id]
  )

  const collectionCheck = await query(
    `SELECT created_by, is_private FROM ${schema}.knowledge_collections WHERE id::text = $1 AND deleted_at IS NULL`,
    [collectionId]
  )

  if (collectionCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const collection = collectionCheck.rows[0]
  const isCreator = collection.created_by === session.user.id
  const isMember = memberCheck.rows.length > 0

  if (!isCreator && !isMember && collection.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Build query
  let whereConditions = ['kd.deleted_at IS NULL', 'kd.collection_id::text = $1']
  const queryParams: any[] = [collectionId]
  let paramIndex = 2

  if (parentId) {
    whereConditions.push(`kd.parent_id::text = $${paramIndex}`)
    queryParams.push(parentId)
    paramIndex++
  }

  // Search
  if (search) {
    const searchClause = buildSearchClause(search, ['kd.title', 'kd.content'], '', paramIndex)
    if (searchClause.clause) {
      whereConditions.push(searchClause.clause)
      queryParams.push(...searchClause.params)
      paramIndex = searchClause.paramIndex
    }
  }

  const whereClause = whereConditions.join(' AND ')

  // Get documents
  const documentsQuery = `
      SELECT 
        kd.id,
        kd.title,
        kd.content,
        kd.content_html,
        kd.parent_id,
        kd.is_template,
        kd.is_public,
        kd.is_pinned,
        kd.published_at,
        kd.archived_at,
        kd.order,
        kd.created_by,
        kd.updated_by,
        kd.created_at,
        kd.updated_at,
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
        ) as updater,
        (
          SELECT COUNT(*)::int
          FROM ${schema}.knowledge_documents kd2
          WHERE kd2.parent_id = kd.id
          AND kd2.deleted_at IS NULL
        ) as child_count
      FROM ${schema}.knowledge_documents kd
      LEFT JOIN public.users u1 ON u1.id = kd.created_by
      LEFT JOIN public.users u2 ON u2.id = kd.updated_by
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy, sortOrder || 'desc', { field: '"order"', order: 'asc' }, 'kd')}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
  queryParams.push(limit, offset)

  const documentsResult = await query(documentsQuery, queryParams)

  // Get total count
  const countQuery = `
      SELECT COUNT(*) as total
      FROM ${schema}.knowledge_documents kd
      WHERE ${whereClause}
    `
  const countResult = await query(countQuery, queryParams.slice(0, -2))
  const total = parseInt(countResult.rows[0]?.total || '0')

  const documents = documentsResult.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentHtml: row.content_html,
    parentId: row.parent_id,
    isTemplate: row.is_template,
    isPublic: row.is_public,
    isPinned: row.is_pinned,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    order: row.order,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    creator: row.creator,
    updater: row.updater,
    childCount: row.child_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  await logAPIRequest(
    session.user.id,
    'GET',
    '/api/knowledge/documents',
    200
  )

  const response = createPaginationResponse(documents, total, page, limit)
  return NextResponse.json({
    documents: response.data,
    ...response,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents')
async function postHandler(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  console.log('[API] POST /documents payload:', body)
  const { 
    collectionId, 
    collection_id,
    spaceId, 
    space_id,
    title, 
    content, 
    contentHtml, 
    content_html,
    parentId, 
    parent_id,
    isTemplate, 
    is_template,
    isPublic, 
    is_public,
    isPinned, 
    is_pinned,
    order 
  } = body

  const finalCollectionId = collectionId || collection_id
  const finalSpaceId = spaceId || space_id
  const finalContentHtml = contentHtml || content_html
  const finalParentId = parentId || parent_id
  const finalIsTemplate = isTemplate !== undefined ? isTemplate : is_template
  const finalIsPublic = isPublic !== undefined ? isPublic : is_public
  const finalIsPinned = isPinned !== undefined ? isPinned : is_pinned

  console.log('[API] User:', session.user.id)

  if (!finalCollectionId || !title || !title.trim()) {
    return NextResponse.json(
      { error: 'collectionId and title are required' },
      { status: 400 }
    )
  }

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(finalSpaceId)

  // Check if user has write access to collection
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
     WHERE collection_id::text = $1 AND user_id::text = $2`,
    [finalCollectionId, session.user.id]
  )

  const collectionCheck = await query(
    `SELECT created_by, is_private FROM ${schema}.knowledge_collections WHERE id::text = $1 AND deleted_at IS NULL`,
    [finalCollectionId]
  )

  if (collectionCheck.rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const collection = collectionCheck.rows[0]
  const isCreator = collection.created_by === session.user.id
  const isEditor = memberCheck.rows.length > 0 && ['admin', 'editor'].includes(memberCheck.rows[0].role)

  if (!isCreator && !isEditor && collection.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get max order for parent
  let documentOrder = order
  if (!documentOrder && finalParentId) {
    const orderResult = await query(
      `SELECT COALESCE(MAX("order"), 0) + 1 as next_order
       FROM ${schema}.knowledge_documents
       WHERE collection_id::text = $1 AND parent_id::text = $2 AND deleted_at IS NULL`,
      [finalCollectionId, finalParentId]
    )
    documentOrder = orderResult.rows[0]?.next_order || 0
  } else if (!documentOrder) {
    const orderResult = await query(
      `SELECT COALESCE(MAX("order"), 0) + 1 as next_order
       FROM ${schema}.knowledge_documents
       WHERE collection_id::text = $1 AND parent_id IS NULL AND deleted_at IS NULL`,
      [finalCollectionId]
    )
    documentOrder = orderResult.rows[0]?.next_order || 0
  }

  // Create document
  const result = await query(
    `INSERT INTO ${schema}.knowledge_documents (
        id, collection_id, title, content, content_html, parent_id, is_template,
        is_public, is_pinned, "order", created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid, $6, $7, $8, $9, $10::uuid, NOW(), NOW()
      ) RETURNING *`,
    [
      finalCollectionId,
      title.trim(),
      content || '',
      finalContentHtml || null,
      finalParentId || null,
      finalIsTemplate || false,
      finalIsPublic || false,
      finalIsPinned || false,
      documentOrder,
      session.user.id,
    ]
  )

  const document = result.rows[0]

  // Create initial version
  await query(
    `INSERT INTO ${schema}.knowledge_document_versions (
        id, document_id, title, content, content_html, created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2, $3, $4, $5::uuid, NOW()
      )`,
    [
      document.id,
      document.title,
      document.content,
      document.content_html,
      session.user.id,
    ]
  )

  await logAPIRequest(
    session.user.id,
    'POST',
    '/api/knowledge/documents',
    201
  )

  return NextResponse.json({
    document: {
      id: document.id,
      title: document.title,
      content: document.content,
      contentHtml: document.content_html,
      parentId: document.parent_id,
      isTemplate: document.is_template,
      isPublic: document.is_public,
      isPinned: document.is_pinned,
      order: document.order,
      createdBy: document.created_by,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    },
  }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents')

