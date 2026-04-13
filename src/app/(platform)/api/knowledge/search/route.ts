import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { getKnowledgeSchema } from '../utils'

async function getHandler(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q')
  const collectionId = searchParams.get('collectionId')
  const spaceId = searchParams.get('spaceId')
  const { page, limit, offset } = parsePaginationParams(request)

  if (!searchQuery || !searchQuery.trim()) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    )
  }

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Build search query using PostgreSQL full-text search
  // First, get accessible collections
  let collectionWhere = `kc.deleted_at IS NULL`
  const collectionParams: any[] = []
  let paramIndex = 1

  if (collectionId) {
    collectionWhere += ` AND kc.id::text = $${paramIndex}`
    collectionParams.push(collectionId)
    paramIndex++
  } else if (spaceId) {
    collectionWhere += ` AND kc.space_id::text = $${paramIndex}`
    collectionParams.push(spaceId)
    paramIndex++
  }

  // Get accessible collections
  const accessibleCollections = await query(
    `SELECT kc.id
       FROM ${schema}.knowledge_collections kc
       WHERE ${collectionWhere}
       AND (
         kc.created_by::text = $${paramIndex} OR
         EXISTS (
           SELECT 1 FROM ${schema}.knowledge_collection_members kcm
           WHERE kcm.collection_id = kc.id
           AND kcm.user_id::text = $${paramIndex}
         ) OR
         kc.is_private = false
       )`,
    [...collectionParams, session.user.id]
  )

  const collectionIds = accessibleCollections.rows.map((r: any) => r.id)

  if (collectionIds.length === 0) {
    return NextResponse.json({
      documents: [],
      collections: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    })
  }

  // Search documents using full-text search
  const searchTerm = searchQuery.trim().split(/\s+/).map((term: string) => `${term}:*`).join(' & ')

  const documentsQuery = `
      SELECT 
        kd.id,
        kd.title,
        kd.content,
        kd.collection_id,
        kd.created_at,
        kd.updated_at,
        kc.name as collection_name,
        kc.icon as collection_icon,
        kc.color as collection_color,
        ts_rank(
          to_tsvector('english', COALESCE(kd.title, '') || ' ' || COALESCE(kd.content, '')),
          plainto_tsquery('english', $1)
        ) as rank,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator
      FROM ${schema}.knowledge_documents kd
      JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
      LEFT JOIN users u ON u.id::text = kd.created_by::text
      WHERE kd.deleted_at IS NULL
      AND kd.collection_id = ANY($2::uuid[])
      AND (
        kd.is_public = true OR
        kc.created_by::text = $3 OR
        EXISTS (
          SELECT 1 FROM ${schema}.knowledge_collection_members kcm
          WHERE kcm.collection_id = kc.id
          AND kcm.user_id::text = $3
        )
      )
      AND (
        to_tsvector('english', COALESCE(kd.title, '') || ' ' || COALESCE(kd.content, ''))
        @@ plainto_tsquery('english', $1)
      )
      ORDER BY rank DESC, kd.updated_at DESC
      LIMIT $4 OFFSET $5
    `

  const documentsResult = await query(documentsQuery, [
    searchQuery,
    collectionIds,
    session.user.id,
    limit,
    offset,
  ])

  // Get total count
  const countQuery = `
      SELECT COUNT(*) as total
      FROM ${schema}.knowledge_documents kd
      JOIN ${schema}.knowledge_collections kc ON kc.id = kd.collection_id
      WHERE kd.deleted_at IS NULL
      AND kd.collection_id = ANY($1::uuid[])
      AND (
        kd.is_public = true OR
        kc.created_by::text = $2 OR
        EXISTS (
          SELECT 1 FROM ${schema}.knowledge_collection_members kcm
          WHERE kcm.collection_id = kc.id
          AND kcm.user_id::text = $2
        )
      )
      AND (
        to_tsvector('english', COALESCE(kd.title, '') || ' ' || COALESCE(kd.content, ''))
        @@ plainto_tsquery('english', $3)
      )
    `

  const countResult = await query(countQuery, [
    collectionIds,
    session.user.id,
    searchQuery,
  ])

  const total = parseInt(countResult.rows[0]?.total || '0')

  const documents = documentsResult.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content?.substring(0, 200) + (row.content?.length > 200 ? '...' : ''),
    collectionId: row.collection_id,
    collection: {
      name: row.collection_name,
      icon: row.collection_icon,
      color: row.collection_color,
    },
    creator: row.creator,
    rank: parseFloat(row.rank),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  await logAPIRequest(
    session.user.id,
    'GET',
    '/api/knowledge/search',
    200
  )

  const response = createPaginationResponse(documents, total, page, limit)
  return NextResponse.json({
    documents: response.data,
    ...response,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/search')

