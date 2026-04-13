import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey, encryptApiKey } from '@/lib/encryption'
import { ESMPortalService } from '@/lib/esm-portal-service'

// Get ESM Portal configuration
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id') || searchParams.get('spaceId')

  if (!spaceId) {
    return NextResponse.json(
      { error: 'space_id is required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ESM Portal configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, 
              api_auth_password, name, is_active, created_at, updated_at, config
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ESM Portal%'
         AND deleted_at IS NULL
         AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [spaceId]
    )

    if (configRows.length === 0) {
      return NextResponse.json({
        config: null,
        isConfigured: false
      })
    }

    const config = configRows[0]
    return NextResponse.json({
      config: {
        id: config.id,
        baseUrl: config.api_url,
        authType: config.api_auth_type,
        name: config.name,
        isActive: config.is_active,
        isConfigured: true,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        customConfig: config.config || {}
      },
      isConfigured: true
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/esm-portal')

// Configure ESM Portal integration
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { space_id, spaceId, baseUrl, apiKey, username, password, authType, customHeaders, name, customEndpoints } = body
  const finalSpaceId = space_id || spaceId

  if (!finalSpaceId || !baseUrl) {
    return NextResponse.json(
      { error: 'space_id and baseUrl are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(finalSpaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Validate auth based on type
    if (authType === 'apikey' && !apiKey) {
      return NextResponse.json(
        { error: 'apiKey is required for API key authentication' },
        { status: 400 }
      )
    }
    if (authType === 'basic' && (!username || !password)) {
      return NextResponse.json(
        { error: 'username and password are required for basic authentication' },
        { status: 400 }
      )
    }

    // Test connection first
    const service = new ESMPortalService({
      baseUrl,
      apiKey,
      username,
      password,
      authType: authType || 'apikey',
      customHeaders
    })

    const testResult = await service.testConnection()
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection test failed: ${testResult.error}` },
        { status: 400 }
      )
    }

    // Store configuration
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let storedApiKey = apiKey || null
    let storedUsername = username || null
    let storedPassword = password || null
    
    if (useVault) {
      const connectionId = `esm-portal-${Date.now()}`
      await secretsManager.storeSecret(`esm-portal-integrations/${connectionId}/credentials`, {
        apiKey,
        username,
        password
      })
      storedApiKey = apiKey ? `vault://${connectionId}/apiKey` : null
      storedUsername = username ? `vault://${connectionId}/username` : null
      storedPassword = password ? `vault://${connectionId}/password` : null
    } else {
      if (apiKey) storedApiKey = encryptApiKey(apiKey)
      if (username) storedUsername = encryptApiKey(username)
      if (password) storedPassword = encryptApiKey(password)
    }

    // Store custom config
    const customConfig = {
      customHeaders,
      customEndpoints
    }

    // Check if configuration already exists
    const { rows: existingRows } = await query(
      `SELECT id FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ESM Portal%'
         AND deleted_at IS NULL
       LIMIT 1`,
      [finalSpaceId]
    )

    if (existingRows.length > 0) {
      // Update existing
      await query(
        `UPDATE public.external_connections 
         SET api_url = $1, 
             api_auth_type = $2,
             api_auth_apikey_value = $3,
             api_auth_username = $4,
             api_auth_password = $5,
             name = $6,
             config = $7,
             updated_at = NOW()
         WHERE id = $8`,
        [
          baseUrl,
          authType || 'apikey',
          storedApiKey,
          storedUsername,
          storedPassword,
          name || 'ESM Portal Integration',
          JSON.stringify(customConfig),
          existingRows[0].id
        ]
      )
    } else {
      // Create new
      await query(
        `INSERT INTO public.external_connections 
         (space_id, connection_type, name, api_url, api_auth_type, api_auth_apikey_value, 
          api_auth_username, api_auth_password, is_active, config, created_by, created_at, updated_at)
         VALUES ($1, 'api', $2, $3, $4, $5, $6, $7, true, $8, $9, NOW(), NOW())`,
        [
          finalSpaceId,
          name || 'ESM Portal Integration',
          baseUrl,
          authType || 'apikey',
          storedApiKey,
          storedUsername,
          storedPassword,
          JSON.stringify(customConfig),
          session.user.id
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'ESM Portal integration configured successfully'
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/esm-portal')

// Test connection
async function putHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { baseUrl, apiKey, username, password, authType, customHeaders } = body

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'baseUrl is required' },
        { status: 400 }
      )
    }

    // Test connection
    const service = new ESMPortalService({
      baseUrl,
      apiKey,
      username,
      password,
      authType: authType || 'apikey',
      customHeaders
    })

    const result = await service.testConnection()

    return NextResponse.json(result)
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/integrations/esm-portal')

