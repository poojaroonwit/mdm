import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import { auditLogger } from '@/lib/utils/audit-logger'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { password, expires_at, max_views } = body

    // Check if user owns the report
    const ownerCheck = await query(
      'SELECT created_by FROM reports WHERE id = $1',
      [id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].created_by !== session.user.id) {
      return NextResponse.json({ error: 'Only report owner can create share links' }, { status: 403 })
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const passwordHash = password ? crypto.createHash('sha256').update(password).digest('hex') : null

    const sql = `
      INSERT INTO report_share_links (
        report_id, token, password_hash, expires_at, max_views, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const result = await query(sql, [
      id,
      token,
      passwordHash,
      expires_at ? new Date(expires_at) : null,
      max_views || null,
      session.user.id
    ])

    // Log audit event
    auditLogger.reportShared(id, result.rows[0].id)

    return NextResponse.json({ token, shareLink: result.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating share link:', error)
    return NextResponse.json(
      { error: 'Failed to create share link', details: error.message },
      { status: 500 }
    )
  }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const sql = `
      SELECT * FROM report_share_links
      WHERE report_id = $1 AND created_by = $2 AND is_active = true
      ORDER BY created_at DESC
    `

    const result = await query(sql, [id, session.user.id])

    return NextResponse.json({ links: result.rows || [] })
  } catch (error: any) {
    console.error('Error fetching share links:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/[id]/share')
export const GET = withErrorHandling(getHandler, 'GET /api/reports/[id]/share')
