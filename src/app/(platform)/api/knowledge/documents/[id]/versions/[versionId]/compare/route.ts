import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../../../utils'

async function getHandler(
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

  // Get current document and requested version
  const [docResult, versionResult] = await Promise.all([
    query(`SELECT * FROM ${schema}.knowledge_documents WHERE id::text = $1`, [documentId]),
    query(`SELECT * FROM ${schema}.knowledge_document_versions WHERE id::text = $1`, [versionId])
  ])

  if (docResult.rows.length === 0 || versionResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document or version not found' }, { status: 404 })
  }

  return NextResponse.json({
    current: {
      title: docResult.rows[0].title,
      content: docResult.rows[0].content,
      contentHtml: docResult.rows[0].content_html
    },
    version: {
      title: versionResult.rows[0].title,
      content: versionResult.rows[0].content,
      contentHtml: versionResult.rows[0].content_html,
      createdAt: versionResult.rows[0].created_at
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/versions/[versionId]/compare')
