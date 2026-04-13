import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { syncAdUsers } from '@/lib/ad-sync'

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const results = await syncAdUsers()
    return NextResponse.json(results)
  } catch (error: any) {
    if (error?.message?.includes('Azure AD credentials not configured')) {
      return NextResponse.json(
        { error: 'Azure AD credentials are not configured. Set azureTenantId, azureClientId, and azureClientSecret in System Settings.' },
        { status: 422 }
      )
    }
    throw error
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/users/sync')
