import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  // Also check what users exist in the database
  let dbUsers = []
  try {
    const result = await query('SELECT id, email, name, role, is_active FROM public.users LIMIT 5')
    dbUsers = result.rows
  } catch (dbError) {
    console.error('Database query error:', dbError)
  }
  
  return NextResponse.json({
    session: session ? {
      user: session.user,
      expires: (session as any).expires
    } : null,
    hasSession: !!session,
    userRole: session?.user?.role || 'No role',
    userId: session?.user?.id || 'No ID',
    dbUsers: dbUsers,
    dbUserCount: dbUsers.length,
    debugInfo: {
      hasAuthOptions: true,
      sessionStrategy: 'jwt',
      providers: ['credentials']
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/debug/user-info')














