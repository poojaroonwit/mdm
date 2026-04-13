import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { NotificationService } from '@/lib/notification-service'
import { getKnowledgeSchema, isValidUUID } from '../../../utils'

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

  const { id: documentId } = await params

  if (!isValidUUID(documentId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check document access
  const docResult = await query(
    `SELECT kd.collection_id, kd.is_public, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [documentId]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Check access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isMember = memberCheck.rows.length > 0
  const isPublic = doc.is_public

  if (!isCollectionCreator && !isMember && doc.is_private && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get comments (threaded)
  const commentsResult = await query(
    `SELECT 
        kc.id,
        kc.parent_id,
        kc.content,
        kc.content_html,
        kc.resolved_at,
        kc.resolved_by,
        kc.created_by,
        kc.created_at,
        kc.updated_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator,
        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email,
          'avatar', u2.avatar
        ) as resolver
      FROM ${schema}.knowledge_comments kc
      LEFT JOIN users u ON u.id::text = kc.created_by::text
      LEFT JOIN users u2 ON u2.id::text = kc.resolved_by::text
      WHERE kc.document_id::text = $1 AND kc.deleted_at IS NULL
      ORDER BY kc.created_at ASC`,
    [documentId]
  )

  // Build threaded structure
  const commentsMap = new Map()
  const rootComments: any[] = []

  commentsResult.rows.forEach((comment: any) => {
    const commentData = {
      id: comment.id,
      parentId: comment.parent_id,
      content: comment.content,
      contentHtml: comment.content_html,
      resolvedAt: comment.resolved_at,
      resolvedBy: comment.resolved_by,
      createdBy: comment.created_by,
      creator: comment.creator,
      resolver: comment.resolver,
      replies: [],
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    }

    commentsMap.set(comment.id, commentData)

    if (comment.parent_id) {
      const parent = commentsMap.get(comment.parent_id)
      if (parent) {
        parent.replies.push(commentData)
      }
    } else {
      rootComments.push(commentData)
    }
  })

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/knowledge/documents/${documentId}/comments`,
    200
  )

  return NextResponse.json({
    comments: rootComments,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/comments')

async function postHandler(
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

  const { id: documentId } = await params

  if (!isValidUUID(documentId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const body = await request.json()
  const { content, contentHtml, parentId, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

  if (!content || !content.trim()) {
    return NextResponse.json(
      { error: 'Comment content is required' },
      { status: 400 }
    )
  }

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check document access
  const docResult = await query(
    `SELECT kd.collection_id, kd.is_public, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id::text = kd.collection_id::text
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [documentId]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Check access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isMember = memberCheck.rows.length > 0
  const isPublic = doc.is_public

  if (!isCollectionCreator && !isMember && doc.is_private && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create comment
  const result = await query(
    `INSERT INTO ${schema}.knowledge_comments (
        id, document_id, parent_id, content, content_html, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, $5::uuid, NOW(), NOW()
      ) RETURNING *`,
    [
      documentId,
      parentId || null,
      content.trim(),
      contentHtml || null,
      session.user.id,
    ]
  )

  const comment = result.rows[0]

  // Get creator info
  const creatorResult = await query(
    `SELECT id, name, email, avatar FROM users WHERE id = $1`,
    [session.user.id]
  )

  // Send notification if replying to a comment
  if (parentId) {
    const parentCommentResult = await query(
      `SELECT created_by FROM ${schema}.knowledge_comments WHERE id::text = $1`,
      [parentId]
    )

    if (parentCommentResult.rows.length > 0 && parentCommentResult.rows[0].created_by !== session.user.id) {
      const notificationService = NotificationService.getInstance()
      await notificationService.createNotification({
        user_id: parentCommentResult.rows[0].created_by,
        type: 'INFO',
        title: 'New reply to your comment',
        message: `${session.user.name} replied to your comment`,
        priority: 'MEDIUM',
        data: {
          documentId,
          commentId: comment.id,
          parentCommentId: parentId,
        },
        action_url: `/knowledge/documents/${documentId}?comment=${comment.id}`
      })
    }
  }

  await logAPIRequest(
    session.user.id,
    'POST',
    `/api/knowledge/documents/${documentId}/comments`,
    201
  )

  return NextResponse.json({
    comment: {
      id: comment.id,
      documentId: comment.document_id,
      parentId: comment.parent_id,
      content: comment.content,
      contentHtml: comment.content_html,
      createdBy: comment.created_by,
      creator: creatorResult.rows[0],
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    },
  }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/comments')

