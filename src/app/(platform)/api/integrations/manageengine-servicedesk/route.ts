import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { createAuditContext } from '@/lib/audit-context-helper'

// Get ServiceDesk configuration for a space
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id')
  if (!spaceId) {
    return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [spaceId, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get configuration from external_connections table
  const { rows } = await query(
    `SELECT id, name, api_url, api_auth_type, api_auth_apikey_name, 
            is_active, created_at, updated_at
     FROM public.external_connections 
     WHERE space_id = $1::uuid 
       AND connection_type = 'api'
       AND name LIKE '%ServiceDesk%'
       AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [spaceId]
  )

  if (rows.length === 0) {
    return NextResponse.json({ config: null })
  }

  const config = rows[0]
  
  return NextResponse.json({
    config: {
      id: config.id,
      name: config.name,
      baseUrl: config.api_url,
      isActive: config.is_active,
      isConfigured: true,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    }
  })
}

// Configure ServiceDesk integration
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { space_id, baseUrl, apiKey, technicianKey, name } = body

  if (!space_id || !baseUrl || !apiKey) {
    return NextResponse.json(
      { error: 'space_id, baseUrl, and apiKey are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Test connection first
  const service = new ManageEngineServiceDeskService({
    baseUrl,
    apiKey,
    technicianKey
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
  
  let storedApiKey = apiKey
  
  if (useVault) {
    const connectionId = `temp-${Date.now()}`
    const auditContext = createAuditContext(request, session.user, 'ServiceDesk integration creation')
    await secretsManager.storeSecret(
      `servicedesk-integrations/${connectionId}/credentials`,
      {
        apiKey,
        technicianKey: technicianKey || undefined
      },
      undefined,
      auditContext
    )
    storedApiKey = `vault://${connectionId}/apiKey`
  } else {
    storedApiKey = encryptApiKey(apiKey)
  }

  // Check if configuration already exists
  const { rows: existing } = await query(
    `SELECT id FROM public.external_connections 
     WHERE space_id = $1::uuid 
       AND connection_type = 'api'
       AND name LIKE '%ServiceDesk%'
       AND deleted_at IS NULL
     LIMIT 1`,
    [space_id]
  )

  let connectionId: string
  if (existing.length > 0) {
    // Update existing
    connectionId = existing[0].id
    await query(
      `UPDATE public.external_connections SET
       api_url = $1,
       api_auth_type = $2,
       api_auth_apikey_name = $3,
       api_auth_apikey_value = $4,
       updated_at = NOW()
       WHERE id = $5`,
      [baseUrl, 'apikey', 'TECHNICIAN_KEY', storedApiKey, connectionId]
    )
  } else {
    // Create new
    const { rows } = await query(
      `INSERT INTO public.external_connections
       (space_id, name, connection_type, db_type, api_url, api_method, api_auth_type, 
        api_auth_apikey_name, api_auth_apikey_value, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        space_id,
        name || 'ManageEngine ServiceDesk',
        'api',
        'api',
        baseUrl,
        'POST',
        'apikey',
        'TECHNICIAN_KEY',
        storedApiKey,
        true
      ]
    )
    connectionId = rows[0].id
  }

  // Update Vault path with actual connection ID if using Vault
  if (useVault && connectionId) {
    const tempMatch = storedApiKey?.match(/temp-(\d+)/)
    if (tempMatch) {
      const tempId = `temp-${tempMatch[1]}`
      const vaultCreds = await secretsManager.getSecret(`servicedesk-integrations/${tempId}/credentials`)
      if (vaultCreds) {
        const auditContext = createAuditContext(request, session.user, 'ServiceDesk integration update')
        await secretsManager.storeSecret(
          `servicedesk-integrations/${connectionId}/credentials`,
          vaultCreds,
          undefined,
          auditContext
        )
        try {
          await secretsManager.deleteSecret(`servicedesk-integrations/${tempId}/credentials`)
        } catch (error) {
          // Ignore if already deleted
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'ServiceDesk integration configured successfully',
    connectionId
  })
}

// Test connection
async function putHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const body = await request.json()
  const { baseUrl, apiKey, technicianKey } = body

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: 'baseUrl and apiKey are required' },
      { status: 400 }
    )
  }

  // Test connection
  const service = new ManageEngineServiceDeskService({
    baseUrl,
    apiKey,
    technicianKey
  })

  const result = await service.testConnection()
  return NextResponse.json(result)
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk')
export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk')
export const PUT = withErrorHandling(putHandler, 'PUT /api/integrations/manageengine-servicedesk')
