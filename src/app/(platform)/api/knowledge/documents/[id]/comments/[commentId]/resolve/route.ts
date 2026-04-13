import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema } from '../../../../../utils'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId, commentId } = await params
  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Check document access
  const schema = await getKnowledgeSchema(spaceId)
  const docResult = await query(
    `SELECT kd.collection_id, kc.is_private, kc.created_by as collection_created_by
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

  if (!isCollectionCreator && !isMember && doc.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Resolve comment
  await query(
    `UPDATE ${schema}.knowledge_comments
       SET resolved_at = NOW(), resolved_by = $1::uuid, updated_at = NOW()
       WHERE id::text = $2 AND document_id::text = $3`,
    [session.user.id, commentId, documentId]
  )

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/comments/[commentId]/resolve')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId, commentId } = await params
  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Check document access
  const schema = await getKnowledgeSchema(spaceId)
  const docResult = await query(
    `SELECT kd.collection_id, kc.is_private, kc.created_by as collection_created_by
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

  if (!isCollectionCreator && !isMember && doc.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Unresolve comment
  await query(
    `UPDATE ${schema}.knowledge_comments
       SET resolved_at = NULL, resolved_by = NULL, updated_at = NOW()
       WHERE id::text = $1 AND document_id::text = $2`,
    [commentId, documentId]
  )

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/documents/[id]/comments/[commentId]/resolve')
