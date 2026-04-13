import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get invitation details
    const invitation = await query(`
      SELECT 
        si.*,
        s.name as space_name,
        u.name as invited_by_name
      FROM space_invitations si
      LEFT JOIN spaces s ON si.space_id = s.id
      LEFT JOIN users u ON si.invited_by = u.id
      WHERE si.token = $1 AND si.expires_at > NOW() AND si.accepted_at IS NULL
    `, [token])

    if (invitation.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    return NextResponse.json({
      invitation: invitation.rows[0]
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    )
  }
}
