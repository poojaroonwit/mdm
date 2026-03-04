import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { syncAdUsers } from '@/lib/ad-sync'

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  
  const results = await syncAdUsers()
  
  return NextResponse.json(results)
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/users/sync')
