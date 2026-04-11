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

  // Sync data based on service type
  let syncResult: { count: number; items: any[] } = { count: 0, items: [] }

  switch (installation.slug) {
    case 'power-bi':
      syncResult = await syncPowerBIReports(config, credentials, installation, spaceId)
      break

    case 'grafana':
      syncResult = await syncGrafanaDashboards(config, credentials, installation, spaceId)
      break

    case 'looker-studio':
      syncResult = await syncLookerStudioReports(config, credentials, installation, spaceId)
      break

    default:
      return NextResponse.json(
        { error: 'Unsupported service type' },
        { status: 400 }
      )
  }

  // Update installation last sync time
  await query(
    `UPDATE service_installations
     SET updated_at = NOW()
     WHERE id = $1`,
    [installationId]
  )

  await logAPIRequest(
    session.user.id,
    'POST',
    `/api/marketplace/plugins/${slug}/sync`,
    200,
    spaceId || undefined
  )

  return NextResponse.json({
    success: true,
    count: syncResult.count,
    items: syncResult.items,
    message: `Synced ${syncResult.count} items`,
  })
}

async function syncPowerBIReports(
  config: any,
  credentials: Record<string, any> | null,
  installation: any,
  spaceId?: string
): Promise<{ count: number; items: any[] }> {
  try {
    // Get access token
    let accessToken: string | null = null

    if (installation.api_auth_type === 'oauth2') {
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId || '',
          client_secret: credentials?.clientSecret || '',
          scope: 'https://analysis.windows.net/powerbi/api/.default',
          grant_type: 'client_credentials',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get access token')
      }

      const tokenData = await response.json()
      accessToken = tokenData.access_token
    } else if (config.accessType === 'SDK' && config.sdkConfig?.accessToken) {
      accessToken = config.sdkConfig.accessToken
    }

    if (!accessToken) {
      return { count: 0, items: [] }
    }

    // Fetch reports from Power BI API
    const workspaceId = config.workspaceId || ''
    const reportsUrl = workspaceId
      ? `https://api.powerbi.com/v1.0/myorg/groups/${workspaceId}/reports`
      : 'https://api.powerbi.com/v1.0/myorg/reports'

    const reportsResponse = await fetch(reportsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!reportsResponse.ok) {
      throw new Error('Failed to fetch Power BI reports')
    }

    const reportsData = await reportsResponse.json()
    const reports = reportsData.value || []

    // Create/update reports in database
    const items: any[] = []
    for (const report of reports) {
      // Check if report already exists
      const existingReport = await query(
        `SELECT id FROM reports 
         WHERE external_id = $1 AND source_type = 'powerbi' AND deleted_at IS NULL`,
        [report.id]
      )

      if (existingReport.rows.length > 0) {
        // Update existing report
        await query(
          `UPDATE reports 
           SET title = $1, description = $2, source_url = $3, updated_at = NOW()
           WHERE id = $4`,
          [
            report.name,
            report.description || null,
            report.webUrl || null,
            existingReport.rows[0].id,
          ]
        )
        items.push({ id: existingReport.rows[0].id, action: 'updated' })
      } else {
        // Create new report
        const insertResult = await query(
          `INSERT INTO reports (
            id, title, description, source_type, source_url, external_id, 
            created_by, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'powerbi', $3, $4, $5, NOW(), NOW()
          ) RETURNING id`,
          [
            report.name,
            report.description || null,
            report.webUrl || null,
            report.id,
            installation.installed_by,
          ]
        )

        const reportId = insertResult.rows[0].id

        // Associate with space if provided
        if (spaceId) {
          await query(
            `INSERT INTO report_spaces (id, report_id, space_id, created_at)
             VALUES (gen_random_uuid(), $1, $2, NOW())
             ON CONFLICT DO NOTHING`,
            [reportId, spaceId]
          )
        }

        items.push({ id: reportId, action: 'created' })
      }
    }

    return { count: items.length, items }
  } catch (error) {
    console.error('Error syncing Power BI reports:', error)
    return { count: 0, items: [] }
  }
}

async function syncGrafanaDashboards(
  config: any,
  credentials: Record<string, any> | null,
  installation: any,
  spaceId?: string
): Promise<{ count: number; items: any[] }> {
  try {
    if (!config.baseUrl || !credentials?.apiKey) {
      return { count: 0, items: [] }
    }

    // Fetch dashboards from Grafana API
    const dashboardsUrl = `${config.baseUrl}/api/search?type=dash-db`
    const dashboardsResponse = await fetch(dashboardsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!dashboardsResponse.ok) {
      throw new Error('Failed to fetch Grafana dashboards')
    }

    const dashboards = await dashboardsResponse.json()

    // Create/update reports in database
    const items: any[] = []
    for (const dashboard of dashboards) {
      // Check if report already exists
      const existingReport = await query(
        `SELECT id FROM reports 
         WHERE external_id = $1 AND source_type = 'grafana' AND deleted_at IS NULL`,
        [dashboard.uid]
      )

      if (existingReport.rows.length > 0) {
        // Update existing report
        await query(
          `UPDATE reports 
           SET title = $1, description = $2, source_url = $3, updated_at = NOW()
           WHERE id = $4`,
          [
            dashboard.title,
            dashboard.folderTitle || null,
            `${config.baseUrl}/d/${dashboard.uid}`,
            existingReport.rows[0].id,
          ]
        )
        items.push({ id: existingReport.rows[0].id, action: 'updated' })
      } else {
        // Create new report
        const insertResult = await query(
          `INSERT INTO reports (
            id, title, description, source_type, source_url, external_id, 
            created_by, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'grafana', $3, $4, $5, NOW(), NOW()
          ) RETURNING id`,
          [
            dashboard.title,
            dashboard.folderTitle || null,
            `${config.baseUrl}/d/${dashboard.uid}`,
            dashboard.uid,
            installation.installed_by,
          ]
        )

        const reportId = insertResult.rows[0].id

        // Associate with space if provided
        if (spaceId) {
          await query(
            `INSERT INTO report_spaces (id, report_id, space_id, created_at)
             VALUES (gen_random_uuid(), $1, $2, NOW())
             ON CONFLICT DO NOTHING`,
            [reportId, spaceId]
          )
        }

        items.push({ id: reportId, action: 'created' })
      }
    }

    return { count: items.length, items }
  } catch (error) {
    console.error('Error syncing Grafana dashboards:', error)
    return { count: 0, items: [] }
  }
}

async function syncLookerStudioReports(
  config: any,
  credentials: Record<string, any> | null,
  installation: any,
  spaceId?: string
): Promise<{ count: number; items: any[] }> {
  try {
    // Get OAuth tokens from credentials
    let accessToken: string | null = null
    let refreshToken: string | null = null

    if (credentials?.access_token) {
      accessToken = credentials.access_token
      refreshToken = credentials.refresh_token || null
    } else if (installation.credentials) {
      const creds = typeof installation.credentials === 'string' 
        ? JSON.parse(installation.credentials) 
        : installation.credentials
      
      if (creds.encrypted) {
        // Decrypt credentials if needed
        const { decrypt } = await import('@/lib/encryption')
        const decrypted = JSON.parse(decrypt(creds.encrypted))
        accessToken = decrypted.access_token
        refreshToken = decrypted.refresh_token || null
      } else {
        accessToken = creds.access_token
        refreshToken = creds.refresh_token || null
      }
    }

    // Check if token is expired and refresh if needed
    if (credentials?.expires_at && Date.now() >= credentials.expires_at) {
      if (refreshToken) {
        accessToken = await refreshLookerStudioToken(refreshToken)
      } else {
        throw new Error('Access token expired and no refresh token available')
      }
    }

    if (!accessToken) {
      throw new Error('No OAuth access token found. Please complete OAuth flow first.')
    }

    // Looker Studio doesn't have a direct public API for listing reports
    // However, we can use Google Data Studio API (which Looker Studio is based on)
    // or fetch from user's Google Drive where Looker Studio reports are stored
    
    // Option 1: Try Data Studio API (legacy, but may still work)
    let reports: any[] = []
    
    try {
      // Attempt to fetch from Google Drive (where Looker Studio reports are stored)
      const driveResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.document"&fields=files(id,name,webViewLink,createdTime,modifiedTime,owners)',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (driveResponse.ok) {
        const driveData = await driveResponse.json()
        // Filter for Looker Studio reports (they have specific MIME type or can be identified by name/extension)
        const lookerStudioFiles = (driveData.files || []).filter((file: any) => 
          file.name?.toLowerCase().includes('looker') || 
          file.name?.toLowerCase().includes('data studio') ||
          file.webViewLink?.includes('datastudio.google.com')
        )

        reports = lookerStudioFiles.map((file: any) => ({
          id: file.id,
          name: file.name,
          embedUrl: file.webViewLink,
          publicLink: file.webViewLink,
          owner: file.owners?.[0]?.displayName || 'Unknown',
          createdAt: file.createdTime,
          updatedAt: file.modifiedTime,
        }))
      }
    } catch (driveError) {
      console.warn('Error fetching from Google Drive:', driveError)
      // Continue with empty reports - user can manually add reports
    }

    // If no reports found via API, return empty array
    // Users can manually add Looker Studio reports via public links
    if (reports.length === 0) {
      console.log('No Looker Studio reports found via API. Users can manually add reports via public links.')
      return { count: 0, items: [] }
    }

    // Create/update reports in database
    const items: any[] = []
    for (const report of reports) {
      // Check if report already exists
      const existingReport = await query(
        `SELECT id FROM reports 
         WHERE external_id = $1 AND source = 'looker-studio' AND deleted_at IS NULL`,
        [report.id]
      )

      if (existingReport.rows.length > 0) {
        // Update existing report
        await query(
          `UPDATE reports 
           SET name = $1, embed_url = $2, public_link = $3, updated_at = NOW()
           WHERE id = $4`,
          [report.name, report.embedUrl, report.publicLink, existingReport.rows[0].id]
        )
        items.push({ id: existingReport.rows[0].id, action: 'updated' })
      } else {
        // Create new report
        const newReport = await query(
          `INSERT INTO reports (
            id, name, description, source, source_type, embed_url, public_link,
            external_id, status, is_active, space_id, created_by, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, 'looker-studio', 'API', $3, $4, $5, 'active', true, $6, $7, NOW(), NOW()
          ) RETURNING id`,
          [
            report.name,
            `Looker Studio report synced from Google Drive`,
            report.embedUrl,
            report.publicLink,
            report.id,
            spaceId || null,
            installation.created_by,
          ]
        )
        items.push({ id: newReport.rows[0].id, action: 'created' })
      }
    }

    return { count: items.length, items }
  } catch (error) {
    console.error('Error syncing Looker Studio reports:', error)
    return { count: 0, items: [] }
  }
}

/**
 * Refresh Looker Studio OAuth token
 */
async function refreshLookerStudioToken(refreshToken: string): Promise<string> {
  const { getGoogleOAuthConfig } = await import('@/lib/google-oauth-config')
  const googleConfig = await getGoogleOAuthConfig()
  const clientId = googleConfig?.clientId || ''
  const clientSecret = googleConfig?.clientSecret || ''

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured in SSO settings')
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text()
    throw new Error(`Token refresh failed: ${errorData}`)
  }

  const tokens = await tokenResponse.json()
  return tokens.access_token
}
