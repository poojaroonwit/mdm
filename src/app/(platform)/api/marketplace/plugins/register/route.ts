import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { registerAllPlugins } from '@/features/marketplace/lib/register-plugins'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

/**
 * Register all marketplace plugins in the database
 * Only admins can run this
 */
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Only admins can register plugins
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await registerAllPlugins()

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/plugins/register',
      200
    )

    return NextResponse.json({
      message: 'All plugins registered successfully',
    })
  } catch (error) {
    console.error('Error registering plugins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/marketplace/plugins/register')
