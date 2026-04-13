import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getGoogleOAuthConfig } from '@/lib/google-oauth-config'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) {
    return NextResponse.redirect(new URL('/auth/signin?error=Unauthorized', request.url))
  }
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/reports/integrations?source=looker-studio&error=${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/reports/integrations?source=looker-studio&error=missing_params', request.url))
    }

    // Decode state
    let stateData: any
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(new URL('/reports/integrations?source=looker-studio&error=invalid_state', request.url))
    }

    // Exchange code for tokens
    const googleConfig = await getGoogleOAuthConfig()
    const clientId = googleConfig?.clientId || ''
    const clientSecret = googleConfig?.clientSecret || ''
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/reports/integrations/looker-studio/oauth/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/reports/integrations?source=looker-studio&error=google_oauth_not_configured', request.url))
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/reports/integrations?source=looker-studio&error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Save tokens to integration config
    const config = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000)
    }

    // Check if integration exists
    const existing = await query(
      'SELECT * FROM report_integrations WHERE source = $1 AND created_by = $2 AND space_id = $3 AND deleted_at IS NULL',
      ['looker-studio', session.user.id, stateData.spaceId || null]
    )

    if (existing.rows.length > 0) {
      // Update existing
      await query(
        'UPDATE report_integrations SET config = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(config), existing.rows[0].id]
      )
    } else {
      // Create new
      await query(
        'INSERT INTO report_integrations (name, source, access_type, config, is_active, space_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['Looker Studio OAuth', 'looker-studio', 'API', JSON.stringify(config), true, stateData.spaceId || null, session.user.id]
      )
    }

  return NextResponse.redirect(new URL('/reports/integrations?source=looker-studio&success=connected', request.url))
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/integrations/looker-studio/oauth/callback')










