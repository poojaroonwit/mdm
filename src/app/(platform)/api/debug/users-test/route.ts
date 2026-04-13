import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  console.log('🔍 Users test endpoint called');
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  console.log('Session:', session);
  
  // Check user role
  const userRole = session.user?.role
  console.log('User role:', userRole);
  
  if (!userRole) {
    return NextResponse.json({
      error: 'No user role found',
      session: session
    }, { status: 403 })
  }
  
  // Test database connection and get users
  const result = await query('SELECT id, email, name, role, is_active FROM users LIMIT 5')
  console.log('Database users:', result.rows);
  
  return NextResponse.json({
    success: true,
    session: {
      user: session.user,
      expires: (session as any).expires
    },
    userRole: userRole,
    dbUsers: result.rows,
    debug: {
      hasAuthOptions: true,
      sessionStrategy: 'jwt',
      providers: ['credentials']
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/debug/users-test')
