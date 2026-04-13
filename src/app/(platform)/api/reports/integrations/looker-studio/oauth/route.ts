import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getGoogleOAuthConfig } from '@/lib/google-oauth-config'
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id')
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports/integrations/looker-studio/oauth/callback`

  const googleConfig = await getGoogleOAuthConfig()
  const clientId = googleConfig?.clientId || ''

  if (!clientId) {
    return NextResponse.json({ 
      error: 'Google OAuth not configured. Please configure it in SSO settings.' 
    }, { status: 400 })
  }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id, 
      spaceId,
      timestamp: Date.now() 
    })).toString('base64')

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/bigquery.readonly https://www.googleapis.com/auth/cloud-platform.read-only')}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`

  return NextResponse.json({ authUrl, state })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/integrations/looker-studio/oauth')










