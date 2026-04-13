import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../utils'
import { extractMentionedUsers } from '@/shared/lib/knowledge/mention-parser'
import { NotificationService } from '@/lib/notification-service'

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
  const { content, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

  if (!content) {
    return NextResponse.json(
      { error: 'Content is required' },
      { status: 400 }
    )
  }

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get document
  const docResult = await query(
    `SELECT kd.title, kd.collection_id, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id = kd.collection_id
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [documentId]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Parse mentions
  const mentionedUsers = extractMentionedUsers(content)

  if (mentionedUsers.length === 0) {
    return NextResponse.json({ mentions: [] })
  }

  // Find users by name or email
  const usersResult = await query(
    `SELECT id, name, email FROM users 
       WHERE LOWER(name) = ANY($1::text[]) 
       OR LOWER(email) = ANY($1::text[])
       OR LOWER(name) LIKE ANY($2::text[])`,
    [
      mentionedUsers.map(u => u.toLowerCase()),
      mentionedUsers.map(u => `%${u.toLowerCase()}%`),
    ]
  )

  const foundUsers = usersResult.rows
  const notificationService = NotificationService.getInstance()

  // Create mentions and send notifications
  const createdMentions = []
  for (const user of foundUsers) {
    // Check if mention already exists
    const existing = await query(
      `SELECT id FROM ${schema}.knowledge_mentions 
         WHERE document_id::text = $1 AND user_id::text = $2`,
      [documentId, user.id]
    )

    if (existing.rows.length === 0) {
      // Create mention
      await query(
        `INSERT INTO ${schema}.knowledge_mentions (id, document_id, user_id, created_by, created_at)
           VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, NOW())`,
        [documentId, user.id, session.user.id]
      )

      // Send notification
      await notificationService.createNotification({
        user_id: user.id,
        type: 'INFO',
        title: 'You were mentioned',
        message: `${session.user.name} mentioned you in "${doc.title}"`,
        priority: 'MEDIUM',
        data: {
          documentId,
          mentionedBy: session.user.id,
        },
        action_url: `/knowledge/documents/${documentId}`
      })

      createdMentions.push({
        userId: user.id,
        userName: user.name,
        email: user.email,
      })
    }
  }

  return NextResponse.json({ mentions: createdMentions })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/mentions')

