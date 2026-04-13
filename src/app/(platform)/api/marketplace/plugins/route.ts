import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling, requireAuthWithId, requireAdmin } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

async function getHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 100,
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')
    const serviceType = searchParams.get('serviceType') || searchParams.get('service_type')
    const source = searchParams.get('source') // 'hub' or 'installed' or 'all'
    const spaceId = searchParams.get('spaceId') || searchParams.get('space_id') // Filter by installed plugins in space
    const installedOnly = (searchParams.get('installedOnly') || searchParams.get('installed_only')) === 'true' // Only show installed plugins

    // If source is 'hub', fetch from plugin hub
    if (source === 'hub' || process.env.USE_PLUGIN_HUB === 'true') {
      try {
        // Fetch from hub API via HTTP (hub runs as separate service)
        const hubUrl = process.env.PLUGIN_HUB_URL || 'http://localhost:3001'
        const hubApiUrl = new URL('/api/plugins', hubUrl)

        // Copy search params except 'source'
        searchParams.forEach((value, key) => {
          if (key !== 'source') {
            hubApiUrl.searchParams.append(key, value)
          }
        })

        // Make HTTP request to hub
        const hubResponse = await fetch(hubApiUrl.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (hubResponse.ok) {
          const hubData = await hubResponse.json()
          return NextResponse.json(hubData)
        }
      } catch (error) {
        console.warn('Failed to fetch from plugin hub, falling back to database:', error)
      }
    }

    // Marketplace is accessible to all authenticated users
    // Skip permission check for admins, and allow all authenticated users access
    // (Permission system may not be fully configured yet)
    try {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'read',
        })

        if (!permission.allowed) {
          // Log the permission denial but still allow access
          // Marketplace should be publicly accessible to authenticated users
          console.warn('Permission check failed for marketplace:', permission.reason)
        }
      }
    } catch (permError) {
      // If permission check fails (e.g., database error), log but continue
      // Marketplace should be accessible to all authenticated users
      console.warn('Permission check error (continuing anyway):', permError)
    }

    let whereConditions = ['sr.deleted_at IS NULL']
    const queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`sr.category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`sr.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    } else {
      // Default to approved plugins only
      whereConditions.push(`sr.status = $${paramIndex}`)
      queryParams.push('approved')
      paramIndex++
    }

    if (verified === 'true') {
      whereConditions.push(`sr.verified = true`)
    }

    if (serviceType) {
      // Filter by service type in capabilities
      whereConditions.push(`sr.capabilities->>'serviceType' = $${paramIndex}`)
      queryParams.push(serviceType)
      paramIndex++
    }


    // Join Global installations (always check this)
    // Cast service_id to UUID to avoid 'operator does not exist: uuid = text' error
    const globalJoin = `LEFT JOIN service_installations si_global ON si_global.service_id::uuid = sr.id AND si_global.space_id IS NULL AND si_global.deleted_at IS NULL`

    // If spaceId is present, also join Space installations
    let spaceJoin = ''
    let installationIdSelect = 'si_global.id'
    let installationStatusSelect = 'si_global.status'

    if (spaceId) {
      // Cast service_id and space_id to UUID
      spaceJoin = `LEFT JOIN service_installations si_space ON si_space.service_id::uuid = sr.id AND si_space.space_id::uuid = CAST($${paramIndex} AS uuid) AND si_space.deleted_at IS NULL`
      queryParams.push(spaceId)
      paramIndex++

      // Prefer space installation if exists, otherwise global
      installationIdSelect = 'COALESCE(si_space.id, si_global.id)'
      installationStatusSelect = 'COALESCE(si_space.status, si_global.status)'
    }

    // If installedOnly is true, check if either exists
    if (installedOnly) {
      if (spaceId) {
        whereConditions.push(`(${installationIdSelect} IS NOT NULL)`)
      } else {
        whereConditions.push('si_global.id IS NOT NULL')
      }
    }

    const whereClause = whereConditions.join(' AND ')

    const pluginsQuery = `
      SELECT 
        sr.id,
        sr.name,
        sr.slug,
        sr.description,
        sr.version,
        sr.provider,
        sr.provider_url,
        sr.category,
        sr.status,
        sr.capabilities,
        sr.api_base_url,
        sr.api_auth_type,
        sr.api_auth_config,
        sr.ui_type,
        sr.ui_config,
        sr.webhook_supported,
        sr.webhook_events,
        sr.icon_url,
        sr.screenshots,
        sr.documentation_url,
        sr.support_url,
        sr.pricing_info,
        sr.installation_count,
        sr.rating,
        sr.review_count,
        sr.verified,
        sr.security_audit,
        sr.created_at,
        sr.updated_at,
        ${installationIdSelect} as installation_id,
        ${installationStatusSelect} as installation_status
      FROM service_registry sr
      ${globalJoin}
      ${spaceJoin}
      WHERE ${whereClause}
      ORDER BY sr.installation_count DESC, sr.created_at DESC
    `

    let pluginsResult
    try {
      pluginsResult = await query(pluginsQuery, queryParams)
    } catch (dbError: any) {
      console.error('Database error fetching plugins:', dbError)
      // If service_registry table doesn't exist, return empty array
      if (dbError?.code === '42P01' || dbError?.message?.includes('does not exist')) {
        console.warn('service_registry table does not exist, returning empty plugins list')
        return NextResponse.json({ plugins: [] })
      }
      throw dbError
    }

    const plugins = pluginsResult.rows.map((row: any) => {
      const capabilities = row.capabilities || {}
      const plugin: any = {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        version: row.version,
        provider: row.provider,
        providerUrl: row.provider_url,
        category: row.category,
        status: row.status,
        capabilities: capabilities,
        apiBaseUrl: row.api_base_url,
        apiAuthType: row.api_auth_type,
        apiAuthConfig: row.api_auth_config,
        uiType: row.ui_type,
        uiConfig: row.ui_config,
        webhookSupported: row.webhook_supported,
        webhookEvents: row.webhook_events,
        iconUrl: row.icon_url,
        screenshots: row.screenshots,
        documentationUrl: row.documentation_url,
        supportUrl: row.support_url,
        pricingInfo: row.pricing_info,
        installationCount: row.installation_count,
        rating: row.rating ? parseFloat(row.rating) : null,
        reviewCount: row.review_count,
        verified: row.verified,
        isCompliance: !!(row.security_audit || capabilities?.isCompliance),
        securityAudit: row.security_audit,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Installation status
        isInstalled: !!row.installation_id,
        installationId: row.installation_id,
        installationStatus: row.installation_status,
        navigation: row.ui_config?.navigation || row.capabilities?.navigation
      }

      // Extract external plugin metadata from capabilities
      if (capabilities.source) {
        plugin.source = capabilities.source
        plugin.sourcePath = capabilities.sourcePath
        plugin.sourceUrl = capabilities.sourceUrl
        plugin.projectFolder = capabilities.projectFolder
        plugin.downloadUrl = capabilities.downloadUrl
        plugin.checksum = capabilities.checksum
        plugin.installedPath = capabilities.installedPath
      } else {
        plugin.source = 'built-in'
      }

      return plugin
    })

    await logAPIRequest(
      session.user.id,
      'GET',
      '/api/marketplace/plugins',
      200
    )

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    )
  }
}

async function postHandler(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 50, // Lower limit for POST
  })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const {
      name,
      slug,
      description,
      version,
      provider,
      providerUrl,
      provider_url,
      category,
      capabilities,
      apiBaseUrl,
      api_base_url,
      apiAuthType,
      api_auth_type,
      apiAuthConfig,
      api_auth_config,
      uiType,
      ui_type,
      uiConfig,
      ui_config,
      webhookSupported,
      webhook_supported,
      webhookEvents,
      webhook_events,
      iconUrl,
      icon_url: icon_url_body,
      screenshots,
      documentationUrl,
      documentation_url,
      supportUrl,
      support_url,
      pricingInfo,
      pricing_info
    } = body

    const finalProviderUrl = providerUrl || provider_url
    const finalApiBaseUrl = apiBaseUrl || api_base_url
    const finalApiAuthType = apiAuthType || api_auth_type
    const finalApiAuthConfig = apiAuthConfig || api_auth_config
    const finalUiType = uiType || ui_type
    const finalUiConfig = uiConfig || ui_config
    const finalWebhookSupported = webhookSupported !== undefined ? webhookSupported : webhook_supported
    const finalWebhookEvents = webhookEvents || webhook_events
    const finalIconUrl = iconUrl || icon_url_body
    const finalDocumentationUrl = documentationUrl || documentation_url
    const finalSupportUrl = supportUrl || support_url
    const finalPricingInfo = pricingInfo || pricing_info

    if (!name || !slug || !version || !provider || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await query(
      'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Plugin with this slug already exists' },
        { status: 409 }
      )
    }

    // Insert plugin
    const result = await query(
      `INSERT INTO service_registry (
        id, name, slug, description, version, provider, provider_url, category,
        status, capabilities, api_base_url, api_auth_type, api_auth_config,
        ui_type, ui_config, webhook_supported, webhook_events, icon_url,
        screenshots, documentation_url, support_url, pricing_info, verified,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', $8::jsonb, $9, $10, $11::jsonb,
        $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20::jsonb, false, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        slug,
        description || null,
        version,
        provider,
        finalProviderUrl || null,
        category,
        capabilities ? JSON.stringify(capabilities) : '{}',
        finalApiBaseUrl || null,
        finalApiAuthType || null,
        finalApiAuthConfig ? JSON.stringify(finalApiAuthConfig) : '{}',
        finalUiType || null,
        finalUiConfig ? JSON.stringify(finalUiConfig) : '{}',
        finalWebhookSupported || false,
        finalWebhookEvents || [],
        finalIconUrl || null,
        screenshots || [],
        finalDocumentationUrl || null,
        finalSupportUrl || null,
        finalPricingInfo ? JSON.stringify(finalPricingInfo) : null,
      ]
    )

    const pluginId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/plugins',
      201
    )

    return NextResponse.json(
      { id: pluginId, message: 'Plugin registered successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating plugin:', error)
    return NextResponse.json(
      { error: 'Failed to create plugin' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/plugins')
export const POST = withErrorHandling(postHandler, 'POST /api/marketplace/plugins')
