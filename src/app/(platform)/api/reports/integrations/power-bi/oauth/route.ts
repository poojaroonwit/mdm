import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings'
import { getPowerBIIntegrationConfig } from '@/lib/power-bi-config'
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id')
  const configId = searchParams.get('config_id')
  const siteUrl = await getConfiguredSiteUrl(request)
  const redirectUri = `${siteUrl}/api/reports/integrations/power-bi/oauth/callback`
  const integrationConfig = await getPowerBIIntegrationConfig(session.user.id, {
    configId,
    spaceId,
  })
  const clientId = integrationConfig?.config?.client_id || ''
  const tenantId = integrationConfig?.config?.tenant_id || ''

  if (!clientId || !tenantId) {
    return NextResponse.json({ 
      error: 'Power BI OAuth is not configured. Save a Power BI API configuration with tenant ID and client credentials first.' 
    }, { status: 400 })
  }

    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ 
      userId: session.user.id, 
      spaceId,
      configId: integrationConfig?.id || configId || null,
      timestamp: Date.now() 
    })).toString('base64')

    // Store state in session/cookie (in production, use secure session storage)
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent('https://analysis.windows.net/powerbi/api/Report.Read.All offline_access')}&` +
      `state=${encodeURIComponent(state)}`

  return NextResponse.json({ authUrl, state })
}

export const GET = withErrorHandling(getHandler, 'GET /api/reports/integrations/power-bi/oauth')










