import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../utils'
import { NotificationService } from '@/lib/notification-service'
import crypto from 'crypto'

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

  // Get document access
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
  const isAdmin = memberCheck.rows.length > 0 && memberCheck.rows[0].role === 'admin'

  if (!isCollectionCreator && !isAdmin && doc.is_private) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get shares
  const sharesResult = await query(
    `SELECT 
        ks.id,
        ks.user_id,
        ks.team_id,
        ks.permission,
        ks.public_link,
        ks.expires_at,
        ks.created_at,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email,
          'avatar', u.avatar
        ) as user
      FROM ${schema}.knowledge_shares ks
      LEFT JOIN users u ON u.id::text = ks.user_id::text
      WHERE ks.document_id::text = $1
      ORDER BY ks.created_at DESC`,
    [documentId]
  )

  return NextResponse.json({
    shares: sharesResult.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      teamId: row.team_id,
      permission: row.permission,
      publicLink: row.public_link,
      expiresAt: row.expires_at,
      user: row.user,
      createdAt: row.created_at,
    })),
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/shares')

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
  const { userId, teamId, permission, isPublic, expiresAt, spaceId: bodySpaceId } = body
  const spaceId = request.nextUrl.searchParams.get('spaceId') || bodySpaceId

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

  // Check share access
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

  let publicLink: string | null = null
  if (isPublic) {
    // Generate public link
    publicLink = crypto.randomBytes(32).toString('hex')
  }

  // Create share
  const result = await query(
    `INSERT INTO ${schema}.knowledge_shares (
        id, document_id, user_id, team_id, permission, public_link, expires_at, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7::uuid, NOW(), NOW()
      ) RETURNING *`,
    [
      documentId,
      userId || null,
      teamId || null,
      permission || 'read',
      publicLink,
      expiresAt || null,
      session.user.id,
    ]
  )

  const share = result.rows[0]

  // Send notification if sharing with user
  if (userId && userId !== session.user.id) {
    const notificationService = NotificationService.getInstance()
    await notificationService.createNotification({
      user_id: userId,
      type: 'INFO',
      title: 'Document shared with you',
      message: `${session.user.name} shared a document with you`,
      priority: 'MEDIUM',
      data: {
        documentId,
        shareId: share.id,
      },
      action_url: `/knowledge/documents/${documentId}`
    })
  }

  return NextResponse.json({
    share: {
      id: share.id,
      documentId: share.document_id,
      userId: share.user_id,
      teamId: share.team_id,
      permission: share.permission,
      publicLink: share.public_link,
      expiresAt: share.expires_at,
      createdAt: share.created_at,
    },
  }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/knowledge/documents/[id]/shares')

