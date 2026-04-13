import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  console.log('🔍 Session test endpoint called');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  console.log('Session result:', session);
  
  return NextResponse.json({
    success: true,
    session: {
      user: session.user,
      expires: (session as any).expires
    },
    debug: {
      hasUser: !!session.user,
      hasUserId: !!session.user?.id,
      hasUserRole: !!session.user?.role,
      userRole: session.user?.role
    }
  })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/debug/session-test')