import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { checkPermission, getUserRoleContext } from '@/lib/permission-checker'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const permissionId = searchParams.get('permissionId')
    const spaceId = searchParams.get('spaceId') || undefined
    const userId = searchParams.get('userId') // Optional: test for specific user (admin only)

    if (!permissionId) {
      return NextResponse.json({ error: 'permissionId is required' }, { status: 400 })
    }

    let context
    if (userId) {
      // Admin testing another user's permissions
      if (!['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Get user's roles
      const { rows: userRows } = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      )
      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      let spaceRole: string | undefined
      if (spaceId) {
        const { rows: spaceRows } = await query(
          'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
          [spaceId, userId]
        )
        if (spaceRows.length > 0) {
          spaceRole = spaceRows[0].role
        }
      }
      context = {
        userId,
        globalRole: userRows[0].role,
        spaceId,
        spaceRole
      }
    } else {
      context = await getUserRoleContext(request, spaceId)
      if (!context) {
        return NextResponse.json({ error: 'User context not found' }, { status: 404 })
      }
    }

    const result = await checkPermission(context, permissionId)

    return NextResponse.json({
      hasPermission: result.hasPermission,
      source: result.source,
      role: result.role
    })
  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/permissions/check')
