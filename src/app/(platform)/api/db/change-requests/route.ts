import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { changeApproval } from '@/lib/db-change-approval'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const spaceId = searchParams.get('spaceId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const changeRequests = await changeApproval.getChangeRequests({
      status: status as any,
      spaceId: spaceId || undefined,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      changeRequests
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch change requests', details: error.message },
      { status: 500 }
    )
  }
}





async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const body = await request.json()
    const {
      title,
      description,
      changeType,
      sqlStatement,
      rollbackSql,
      spaceId,
      connectionId,
      approvers,
      metadata
    } = body

    if (!title || !changeType || !sqlStatement) {
      return NextResponse.json(
        { error: 'Title, changeType, and sqlStatement are required' },
        { status: 400 }
      )
    }

    const changeRequestId = await changeApproval.createChangeRequest({
      title,
      description,
      changeType,
      sqlStatement,
      rollbackSql,
      requestedBy: session.user.id,
      requestedByName: session.user.name || undefined,
      spaceId,
      connectionId,
      approvers: approvers || [],
      metadata
    })

    return NextResponse.json({
      success: true,
      changeRequestId
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create change request', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/db/change-requests')
export const POST = withErrorHandling(postHandler, 'POST POST /api/db/change-requests')