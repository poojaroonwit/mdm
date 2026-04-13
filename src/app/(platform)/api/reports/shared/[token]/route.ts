import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import crypto from 'crypto'
import type { Report } from '@/app/reports/page'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const sql = `
      SELECT 
        sl.*,
        r.*
      FROM report_share_links sl
      JOIN reports r ON r.id = sl.report_id
      WHERE sl.token = $1 
        AND sl.is_active = true
        AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
        AND (sl.max_views IS NULL OR sl.view_count < sl.max_views)
        AND r.deleted_at IS NULL
    `

    const result = await query(sql, [token])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 })
    }

    const shareLink = result.rows[0]

    // Check if password is required
    if (shareLink.password_hash) {
      return NextResponse.json({ 
        error: 'Password required',
        requiresPassword: true 
      }, { status: 401 })
    }

    // Increment view count
    await query(
      'UPDATE report_share_links SET view_count = view_count + 1, last_accessed_at = NOW() WHERE id = $1',
      [shareLink.id]
    )

    return NextResponse.json({ report: shareLink as Report })
  } catch (error) {
    console.error('Error fetching shared report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const sql = `
      SELECT 
        sl.*,
        r.*
      FROM report_share_links sl
      JOIN reports r ON r.id = sl.report_id
      WHERE sl.token = $1 
        AND sl.is_active = true
        AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
        AND (sl.max_views IS NULL OR sl.view_count < sl.max_views)
        AND r.deleted_at IS NULL
    `

    const result = await query(sql, [token])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 })
    }

    const shareLink = result.rows[0]

    // Verify password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')
    if (shareLink.password_hash !== passwordHash) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    // Increment view count
    await query(
      'UPDATE report_share_links SET view_count = view_count + 1, last_accessed_at = NOW() WHERE id = $1',
      [shareLink.id]
    )

    return NextResponse.json({ report: shareLink as Report })
  } catch (error) {
    console.error('Error accessing shared report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
