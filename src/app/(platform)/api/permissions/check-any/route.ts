import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions, getUserRoleContext } from '@/lib/permission-checker'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { permissionIds, spaceId } = body

    if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json({ error: 'permissionIds array is required' }, { status: 400 })
    }

    const context = await getUserRoleContext(request, spaceId)
    if (!context) {
      return NextResponse.json({ error: 'User context not found' }, { status: 404 })
    }

    const userPermissions = await getUserPermissions(context)
    const hasAny = permissionIds.some(id => userPermissions.includes(id))

    return NextResponse.json({
      hasPermission: hasAny,
      source: hasAny ? 'combined' : 'none'
    })
  } catch (error: any) {
    console.error('Error checking permissions:', error)
    return NextResponse.json(
      { error: 'Failed to check permissions', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/permissions/check-any')
