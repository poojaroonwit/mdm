import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema } from '../../../../utils'

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId, shareId } = await params
  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check document access
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

  // Delete share
  await query(
    `DELETE FROM ${schema}.knowledge_shares WHERE id::text = $1 AND document_id::text = $2`,
    [shareId, documentId]
  )

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/documents/[id]/shares/[shareId]')

