import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { createAuditContext } from '@/lib/audit-context-helper'
import { getServiceDeskConfig } from '@/lib/manageengine-servicedesk-helper'

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
    'SELECT 1 FROM space_members WHERE space_id::text = $1 AND user_id::text = $2',
    [spaceId, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const config = await getServiceDeskConfig()

  if (!config) {
    return NextResponse.json({ config: null })
  }
  
  return NextResponse.json({
    config: {
      id: config.id,
      name: config.name,
      baseUrl: config.baseUrl,
      isActive: config.isActive,
      isConfigured: true,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
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
    'SELECT 1 FROM space_members WHERE space_id::text = $1 AND user_id::text = $2',
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
  let storedTechnicianKey = technicianKey || null
  
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
    storedTechnicianKey = technicianKey ? `vault://${connectionId}/technicianKey` : null
  } else {
    storedApiKey = encryptApiKey(apiKey)
    storedTechnicianKey = technicianKey ? encryptApiKey(technicianKey) : null
  }

  // Check if configuration already exists
  const { rows: existing } = await query(
    `SELECT id FROM public.platform_integrations
     WHERE type = 'servicedesk'
       AND deleted_at IS NULL
     LIMIT 1`,
    []
  )

  let connectionId: string
  const configPayload = {
    baseUrl,
    apiKey: storedApiKey,
    ...(storedTechnicianKey ? { technicianKey: storedTechnicianKey } : {}),
  }

  if (existing.length > 0) {
    // Update existing
    connectionId = existing[0].id
    await query(
      `UPDATE public.platform_integrations SET
       name = $1,
       config = $2,
       status = 'active',
       is_enabled = true,
       updated_at = NOW()
       WHERE id::text = $3`,
      [name || 'ManageEngine ServiceDesk', JSON.stringify(configPayload), connectionId]
    )
  } else {
    // Create new
    const { rows } = await query(
      `INSERT INTO public.platform_integrations
       (name, type, config, status, is_enabled, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id`,
      [
        name || 'ManageEngine ServiceDesk',
        'servicedesk',
        JSON.stringify(configPayload),
        'active',
        true,
        session.user.id
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
        if (technicianKey) {
          await query(
            `UPDATE public.platform_integrations
             SET config = jsonb_set(
                   jsonb_set(config::jsonb, '{apiKey}', to_jsonb($1::text), true),
                   '{technicianKey}', to_jsonb($2::text), true
                 ),
                 updated_at = NOW()
             WHERE id::text = $3`,
            [`vault://${connectionId}/apiKey`, `vault://${connectionId}/technicianKey`, connectionId]
          )
        } else {
          await query(
            `UPDATE public.platform_integrations
             SET config = jsonb_set(config::jsonb, '{apiKey}', to_jsonb($1::text), true),
                 updated_at = NOW()
             WHERE id::text = $2`,
            [`vault://${connectionId}/apiKey`, connectionId]
          )
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
