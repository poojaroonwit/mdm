import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await params

    // Get invitation details
    const invitation = await query(`
      SELECT * FROM space_invitations 
      WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL
    `, [token])

    if (invitation.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    const invite = invitation.rows[0]

    // Check if the email matches the current user
    if (invite.email !== session.user.email) {
      return NextResponse.json({ error: 'This invitation is not for your email address' }, { status: 403 })
    }

    // Check if user is already a member of the space
    const existingMember = await query(`
      SELECT id FROM space_members WHERE space_id = $1 AND user_id = $2
    `, [invite.space_id, session.user.id])

    if (existingMember.rows.length > 0) {
      return NextResponse.json({ error: 'You are already a member of this space' }, { status: 400 })
    }

    // Add user to space
    await query(`
      INSERT INTO space_members (space_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [invite.space_id, session.user.id, invite.role])

    // Mark invitation as accepted
    await query(`
      UPDATE space_invitations 
      SET accepted_at = NOW() 
      WHERE token = $1
    `, [token])

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully'
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/invitations/[token]/accept')
