import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { parsePaginationParams, createPaginationResponse } from '@/shared/lib/api/pagination'
import { parseSortParams, buildOrderByClause } from '@/shared/lib/api/sorting'
import { parseFilterParams, buildSearchClause } from '@/shared/lib/api/filtering'
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
  const spaceId = searchParams.get('spaceId')
  const searchQuery = searchParams.get('search')

  const { page, limit, offset } = parsePaginationParams(request)
  const { sortBy, sortOrder } = parseSortParams(request)

  // Check permission
  const permission = await checkPermission({
    resource: 'knowledge',
    action: 'read',
    spaceId: spaceId || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Build query
  let whereConditions = ['kc.deleted_at IS NULL']
  const queryParams: any[] = []
  let paramIndex = 1

  const schema = await getKnowledgeSchema(spaceId)

  // Space filtering
  if (spaceId) {
    whereConditions.push(`kc.space_id::text = $${paramIndex}`)
    queryParams.push(spaceId)
    paramIndex++
  } else {
    // Get collections user has access to (member or creator)
    whereConditions.push(`(
        kc.created_by::text = $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM ${schema}.knowledge_collection_members kcm
          WHERE kcm.collection_id = kc.id
          AND kcm.user_id::text = $${paramIndex}
        )
      )`)
    queryParams.push(session.user.id)
    paramIndex++
  }

  // Search
  if (searchQuery) {
    const searchClause = buildSearchClause(searchQuery, ['kc.name', 'kc.description'], '', paramIndex)
    if (searchClause.clause) {
      whereConditions.push(searchClause.clause)
      queryParams.push(...searchClause.params)
      paramIndex = searchClause.paramIndex
    }
  }

  const whereClause = whereConditions.join(' AND ')

  // Get collections
  const collectionsQuery = `
      SELECT 
        kc.id,
        kc.name,
        kc.description,
        kc.icon,
        kc.color,
        kc.is_private,
        kc.space_id,
        kc.created_by,
        kc.created_at,
        kc.updated_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator,
        (
          SELECT COUNT(*)::int
          FROM ${schema}.knowledge_documents kd
          WHERE kd.collection_id = kc.id
          AND kd.deleted_at IS NULL
        ) as document_count,
        (
          SELECT COUNT(*)::int
          FROM ${schema}.knowledge_collection_members kcm
          WHERE kcm.collection_id = kc.id
        ) as member_count
      FROM ${schema}.knowledge_collections kc
      LEFT JOIN public.users u ON u.id = kc.created_by
      WHERE ${whereClause}
      ${buildOrderByClause(sortBy || 'created_at', sortOrder || 'desc', { field: 'created_at', order: 'desc' }, 'kc')}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
  queryParams.push(limit, offset)

  let collectionsResult
  let total = 0

  try {
    collectionsResult = await query(collectionsQuery, queryParams)

    // Get total count
    const countQuery = `
        SELECT COUNT(*) as total
        FROM ${schema}.knowledge_collections kc
        WHERE ${whereClause}
      `
    const countResult = await query(countQuery, queryParams.length > 2 ? queryParams.slice(0, -2) : queryParams)
    total = parseInt(countResult.rows[0]?.total || '0')
  } catch (dbError: any) {
    // Handle case where knowledge_collections table doesn't exist yet
    // PostgreSQL error codes: 42P01 = undefined_table, 42703 = undefined_column
    const isTableMissing =
      dbError?.code === 'P2010' ||
      dbError?.code === '42P01' ||
      dbError?.code === '42703' ||
      dbError?.message?.includes('does not exist') ||
      dbError?.message?.includes('relation') ||
      dbError?.message?.includes('undefined_table')

    if (isTableMissing) {
      console.warn('Knowledge collections table does not exist. Please run migrations.')
      return NextResponse.json({
        collections: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      })
    }
    throw dbError
  }

  const collections = collectionsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    isPrivate: row.is_private,
    spaceId: row.space_id,
    createdBy: row.created_by,
    creator: row.creator,
    documentCount: row.document_count || 0,
    memberCount: row.member_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  await logAPIRequest(
    session.user.id,
    'GET',
    '/api/knowledge/collections',
    200,
    spaceId || undefined
  )

  const response = createPaginationResponse(collections, total, page, limit)
  return NextResponse.json({
    collections: response.data,
    ...response,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/collections')

async function postHandler(request: NextRequest) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  const body = await request.json()
  const { name, description, icon, color, isPrivate, spaceId } = body

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: 'Collection name is required' },
      { status: 400 }
    )
  }

  // Check permission
  const permission = await checkPermission({
    resource: 'knowledge',
    action: 'create',
    spaceId: spaceId || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  const schema = await getKnowledgeSchema(spaceId)

  // Create collection
  const result = await query(
    `INSERT INTO ${schema}.knowledge_collections (
        id, name, description, icon, color, is_private, space_id, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6::uuid, $7::uuid, NOW(), NOW()
      ) RETURNING id, name, description, icon, color, is_private, space_id, created_by, created_at, updated_at`,
    [
      name.trim(),
      description?.trim() || null,
      icon || null,
      color || null,
      isPrivate || false,
      spaceId || null,
      session.user.id,
    ]
  )

  const collection = result.rows[0]

  // Add creator as admin member
  await query(
    `INSERT INTO ${schema}.knowledge_collection_members (
        id, collection_id, user_id, role, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::uuid, 'admin', NOW(), NOW()
      )`,
    [collection.id, session.user.id]
  )

  await logAPIRequest(
    session.user.id,
    'POST',
    '/api/knowledge/collections',
    201,
    spaceId || undefined
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
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
    },
  }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/collections')

