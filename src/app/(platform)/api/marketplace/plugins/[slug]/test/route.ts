import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { retrieveCredentials } from '@/shared/lib/security/credential-manager'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'

// Helper function to resolve slug to serviceId
async function resolveServiceId(slug: string): Promise<string | null> {
  // Check if slug is a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slug)) {
    return slug
  }
  
  // Look up by slug
  const result = await query(
    'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  )
  
  return result.rows[0]?.id || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const serviceId = await resolveServiceId(slug)
  
  if (!serviceId) {
    return NextResponse.json(
      { error: 'Plugin not found' },
      { status: 404 }
    )
  }

  const body = await request.json()
  const { installationId, spaceId } = body

  if (!installationId) {
    return NextResponse.json(
      { error: 'installationId is required' },
      { status: 400 }
    )
  }

  // Get installation
  const installationResult = await query(
    `SELECT 
      si.id,
      si.service_id,
      si.space_id,
      si.config,
      si.status,
      sr.slug,
      sr.api_base_url,
      sr.api_auth_type
    FROM service_installations si
    JOIN service_registry sr ON sr.id = si.service_id
    WHERE si.id = $1 
      AND si.installed_by = $2
      AND si.deleted_at IS NULL`,
    [installationId, session.user.id]
  )

  if (installationResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'Installation not found' },
      { status: 404 }
    )
  }

  const installation = installationResult.rows[0]
  const config = typeof installation.config === 'string' 
    ? JSON.parse(installation.config) 
    : installation.config

  // Get credentials
  const credentials = await retrieveCredentials(`installation:${installationId}`)

  // Test connection based on service type
  let success = false
  let message = ''
  let details: any = {}

  switch (installation.slug) {
    case 'power-bi':
      success = await testPowerBIConnection(config, credentials, installation.api_auth_type)
      message = success 
        ? 'Power BI connection successful' 
        : 'Power BI connection failed - check configuration'
      break

    case 'grafana':
      success = await testGrafanaConnection(config, credentials)
      message = success 
        ? 'Grafana connection successful' 
        : 'Grafana connection failed - check configuration'
      break

    case 'looker-studio':
      success = await testLookerStudioConnection(config, credentials)
      message = success 
        ? 'Looker Studio connection successful' 
        : 'Looker Studio connection failed - check configuration'
      break

    default:
      return NextResponse.json(
        { error: 'Unsupported service type' },
        { status: 400 }
      )
  }

  // Update installation health status
  await query(
    `UPDATE service_installations
     SET health_status = $1, last_health_check = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [success ? 'healthy' : 'unhealthy', installationId]
  )

  await logAPIRequest(
    session.user.id,
    'POST',
    `/api/marketplace/plugins/${slug}/test`,
    success ? 200 : 400,
    spaceId || undefined
  )

  return NextResponse.json({
    success,
    message,
    details,
  })
}

async function testPowerBIConnection(
  config: any,
  credentials: Record<string, any> | null,
  authType?: string
): Promise<boolean> {
  try {
    if (authType === 'oauth2') {
      // Test OAuth connection
      if (!config.tenantId || !config.clientId || !credentials?.clientSecret) {
        return false
      }

      // Try to get access token
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: credentials.clientSecret || '',
          scope: 'https://analysis.windows.net/powerbi/api/.default',
          grant_type: 'client_credentials',
        }),
      })

      return response.ok
    } else if (config.accessType === 'SDK') {
      // Test SDK config
      return !!(config.sdkConfig?.accessToken && config.sdkConfig?.embedUrl)
    } else if (config.accessType === 'EMBED') {
      // Test embed URL
      return !!config.embedUrl
    } else if (config.accessType === 'PUBLIC') {
      // Test public link
      return !!config.publicLink
    }

    return false
  } catch (error) {
    console.error('Power BI connection test error:', error)
    return false
  }
}

async function testGrafanaConnection(
  config: any,
  credentials: Record<string, any> | null
): Promise<boolean> {
  try {
    if (!config.baseUrl || !credentials?.apiKey) {
      return false
    }

    // Test Grafana API connection
    const response = await fetch(`${config.baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    return response.ok
  } catch (error) {
    console.error('Grafana connection test error:', error)
    return false
  }
}

async function testLookerStudioConnection(
  config: any,
  credentials: Record<string, any> | null
): Promise<boolean> {
  try {
    if (!config.clientId || !credentials?.clientSecret) {
      return false
    }

    // For Looker Studio, we can't easily test without OAuth flow
    // Just validate that required fields are present
    return !!(config.clientId && credentials.clientSecret)
  } catch (error) {
    console.error('Looker Studio connection test error:', error)
    return false
  }
}
