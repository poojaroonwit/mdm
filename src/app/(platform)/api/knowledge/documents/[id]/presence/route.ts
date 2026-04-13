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

  // Get all active presence (last seen within 30 seconds)
  const presenceResult = await query(
    `SELECT 
        kp.id,
        kp.user_id,
        kp.cursor,
        kp.selection,
        kp.last_seen,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as user
      FROM ${schema}.knowledge_presence kp
      JOIN users u ON u.id::text = kp.user_id::text
      WHERE kp.document_id::text = $1
      AND kp.last_seen > NOW() - INTERVAL '30 seconds'
      ORDER BY kp.last_seen DESC`,
    [documentId]
  )

  return NextResponse.json({
    presence: presenceResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      user: row.user,
      cursor: row.cursor,
      selection: row.selection,
      lastSeen: row.last_seen,
    })),
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/presence')

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
  const { cursor, selection, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Upsert presence
  await query(
    `INSERT INTO ${schema}.knowledge_presence (id, document_id, user_id, cursor, selection, last_seen)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::jsonb, $4::jsonb, NOW())
       ON CONFLICT (document_id, user_id)
       DO UPDATE SET
         cursor = EXCLUDED.cursor,
         selection = EXCLUDED.selection,
         last_seen = NOW()`,
    [documentId, session.user.id, cursor ? JSON.stringify(cursor) : null, selection ? JSON.stringify(selection) : null]
  )

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/presence')
