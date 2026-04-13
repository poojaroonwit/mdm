import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { changeApproval } from '@/lib/db-change-approval'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for rejection' },
        { status: 400 }
      )
    }

    await changeApproval.rejectChangeRequest(
      id,
      session.user.id,
      session.user.name || 'Unknown',
      reason
    )

    return NextResponse.json({
      success: true,
      message: 'Change request rejected'
    })
  } catch (error: any) {
    console.error('Error rejecting change request:', error)
    return NextResponse.json(
      { error: 'Failed to reject change request', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/db/change-requests/[id]/reject/route.ts')

