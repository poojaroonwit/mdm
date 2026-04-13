import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../utils'

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

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Check document access
  const docResult = await query(
    `SELECT collection_id FROM ${schema}.knowledge_documents WHERE id::text = $1`,
    [documentId]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  await query(
    `INSERT INTO ${schema}.knowledge_stars (id, document_id, user_id, created_at)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, NOW())
       ON CONFLICT (document_id, user_id) DO NOTHING`,
    [documentId, session.user.id]
  )

  return NextResponse.json({ starred: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/star')

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

  const { id: documentId } = await params

  if (!isValidUUID(documentId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const spaceId = request.nextUrl.searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  await query(
    `DELETE FROM ${schema}.knowledge_stars WHERE document_id::text = $1 AND user_id::text = $2`,
    [documentId, session.user.id]
  )

  return NextResponse.json({ starred: false })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/knowledge/documents/[id]/star')

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

  const starResult = await query(
    `SELECT id FROM ${schema}.knowledge_stars WHERE document_id::text = $1 AND user_id::text = $2`,
    [documentId, session.user.id]
  )

  return NextResponse.json({ starred: starResult.rows.length > 0 })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/star')
