import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings'
import { getPowerBIIntegrationConfig } from '@/lib/power-bi-config'

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
      return NextResponse.redirect(new URL(`/reports/integrations?source=power-bi&error=${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=missing_params', request.url))
    }

    // Decode state
    let stateData: any
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=invalid_state', request.url))
    }

    const siteUrl = await getConfiguredSiteUrl(request)
    const redirectUri = `${siteUrl}/api/reports/integrations/power-bi/oauth/callback`
    const integrationConfig = await getPowerBIIntegrationConfig(session.user.id, {
      configId: stateData.configId || null,
      spaceId: stateData.spaceId || null,
    })
    const clientId = integrationConfig?.config?.client_id || ''
    const clientSecret = integrationConfig?.config?.client_secret || ''
    const tenantId = integrationConfig?.config?.tenant_id || ''

    if (!clientId || !clientSecret || !tenantId) {
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=missing_oauth_config', request.url))
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'https://analysis.windows.net/powerbi/api/Report.Read.All offline_access'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&error=token_exchange_failed', request.url))
    }

    const tokens = await tokenResponse.json()

    // Save tokens to integration config
    const config = {
      ...(integrationConfig?.config || {}),
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      tenant_id: tenantId
    }

    if (integrationConfig?.id) {
      await query(
        'UPDATE report_integrations SET config = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(config), integrationConfig.id]
      )
    } else {
      await query(
        'INSERT INTO report_integrations (name, source, access_type, config, is_active, space_id, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['Power BI OAuth', 'power-bi', 'API', JSON.stringify(config), true, stateData.spaceId || null, session.user.id]
      )
    }

  return NextResponse.redirect(new URL('/reports/integrations?source=power-bi&success=connected', request.url))
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/integrations/power-bi/oauth/callback')










