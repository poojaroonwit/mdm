import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
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

  // Get versions
  const versionsResult = await query(
    `SELECT 
        kdv.id,
        kdv.title,
        kdv.content,
        kdv.content_html,
        kdv.created_by,
        kdv.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as creator
      FROM ${schema}.knowledge_document_versions kdv
      LEFT JOIN users u ON u.id::text = kdv.created_by::text
      WHERE kdv.document_id::text = $1
      ORDER BY kdv.created_at DESC
      LIMIT 50`,
    [documentId]
  )

  return NextResponse.json({
    versions: versionsResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      contentHtml: row.content_html,
      createdBy: row.created_by,
      creator: row.creator,
      createdAt: row.created_at,
    })),
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/versions')

