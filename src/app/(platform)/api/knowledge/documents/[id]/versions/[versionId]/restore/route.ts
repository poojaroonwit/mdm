import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../../../utils'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, versionId: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId, versionId } = await params

  if (!isValidUUID(documentId) || !isValidUUID(versionId)) {
    return NextResponse.json({ error: 'Invalid document or version ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get version to restore
  const versionResult = await query(
    `SELECT * FROM ${schema}.knowledge_document_versions WHERE id::text = $1 AND document_id::text = $2`,
    [versionId, documentId]
  )

  if (versionResult.rows.length === 0) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  }

  const version = versionResult.rows[0]

  // Update document with version content
  await query(
    `UPDATE ${schema}.knowledge_documents 
       SET title = $1, content = $2, content_html = $3, updated_at = NOW(), updated_by = $4
       WHERE id::text = $5`,
    [version.title, version.content, version.content_html, session.user.id, documentId]
  )

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/versions/[versionId]/restore')
