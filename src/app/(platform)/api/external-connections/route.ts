import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { encryptApiKey, decryptApiKey } from '@/lib/encryption'
import { createAuditContext } from '@/lib/audit-context-helper'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const rawSpaceId = searchParams.get('space_id')
  if (!rawSpaceId) return NextResponse.json({ error: 'space_id is required' }, { status: 400 })
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const spaceId = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(spaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [spaceId, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rows } = await query(
    `SELECT * FROM public.external_connections 
     WHERE space_id = $1::uuid AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [spaceId]
  )
  return NextResponse.json({ connections: rows })
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { 
    space_id: s_id, 
    spaceId: sId,
    name, 
    connection_type,
    connectionType,
    db_type, 
    dbType,
    host, 
    port, 
    database, 
    username, 
    password, 
    options, 
    is_active,
    isActive,
    // API fields
    api_url, 
    apiUrl,
    api_method, 
    apiMethod,
    api_headers, 
    apiHeaders,
    api_auth_type, 
    apiAuthType,
    api_auth_token, 
    apiAuthToken,
    api_auth_username, 
    apiAuthUsername,
    api_auth_password, 
    apiAuthPassword,
    api_auth_apikey_name, 
    apiAuthApiKeyName,
    api_auth_apikey_value, 
    apiAuthApiKeyValue,
    api_body, 
    apiBody,
    api_response_path, 
    apiResponsePath,
    api_pagination_type, 
    apiPaginationType,
    api_pagination_config,
    apiPaginationConfig
  } = body

  const rawSpaceId = s_id || sId
  const final_connection_type = connectionType || connection_type || 'database'
  const final_db_type = dbType || db_type
  const final_api_url = apiUrl || api_url
  const final_api_method = apiMethod || api_method
  const final_api_headers = apiHeaders || api_headers
  const final_api_auth_type = apiAuthType || api_auth_type
  const final_api_auth_token = apiAuthToken || api_auth_token
  const final_api_auth_username = apiAuthUsername || api_auth_username
  const final_api_auth_password = apiAuthPassword || api_auth_password
  const final_api_auth_apikey_name = apiAuthApiKeyName || api_auth_apikey_name
  const final_api_auth_apikey_value = apiAuthApiKeyValue || api_auth_apikey_value
  const final_api_body = apiBody || api_body
  const final_api_response_path = apiResponsePath || api_response_path
  const final_api_pagination_type = apiPaginationType || api_pagination_type
  const final_api_pagination_config = apiPaginationConfig || api_pagination_config
  const final_is_active = isActive !== undefined ? isActive : is_active

  if (!rawSpaceId || !name) {
    return NextResponse.json({ error: 'space_id and name are required' }, { status: 400 })
  }
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const space_id = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(space_id)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  // Validate based on connection type
  if (final_connection_type === 'api') {
    if (!final_api_url) {
      return NextResponse.json({ error: 'api_url is required for API connections' }, { status: 400 })
    }
  } else {
    if (!final_db_type || !host) {
      return NextResponse.json({ error: 'db_type and host are required for database connections' }, { status: 400 })
    }
  }

  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (connection_type === 'api') {
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    // Store sensitive credentials in Vault or encrypt for database
    let storedAuthToken = api_auth_token || null
    let storedAuthPassword = api_auth_password || null
    let storedApiKeyValue = api_auth_apikey_value || null
    
    if (useVault && (api_auth_token || api_auth_password || api_auth_apikey_value)) {
      // Store credentials in Vault
      const connectionId = `temp-${Date.now()}` // Will be replaced with actual ID
      const auditContext = createAuditContext(request, session.user, 'External API connection creation')
      await secretsManager.storeSecret(
        `external-connections/${connectionId}/credentials`,
        {
          authToken: api_auth_token || undefined,
          password: api_auth_password || undefined,
          apiKey: api_auth_apikey_value || undefined,
        },
        undefined,
        auditContext
      )
      // Store reference in database
      storedAuthToken = api_auth_token ? `vault://${connectionId}/authToken` : null
      storedAuthPassword = api_auth_password ? `vault://${connectionId}/password` : null
      storedApiKeyValue = api_auth_apikey_value ? `vault://${connectionId}/apiKey` : null
    } else if (!useVault) {
      // Encrypt for database storage
      storedAuthToken = api_auth_token ? encryptApiKey(api_auth_token) : null
      storedAuthPassword = api_auth_password ? encryptApiKey(api_auth_password) : null
      storedApiKeyValue = api_auth_apikey_value ? encryptApiKey(api_auth_apikey_value) : null
    }
    
    // Insert API connection
    const { rows } = await query(
      `INSERT INTO public.external_connections
        (space_id, name, connection_type, db_type, api_url, api_method, api_headers, api_auth_type, 
         api_auth_token, api_auth_username, api_auth_password, api_auth_apikey_name, api_auth_apikey_value,
         api_body, api_response_path, api_pagination_type, api_pagination_config, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        space_id, name, final_connection_type, final_db_type || 'api', final_api_url, final_api_method || 'GET',
        final_api_headers ? JSON.stringify(final_api_headers) : null, final_api_auth_type || 'none',
        storedAuthToken, api_auth_username || null, storedAuthPassword,
        final_api_auth_apikey_name || null, storedApiKeyValue,
        final_api_body || null, final_api_response_path || null, final_api_pagination_type || null,
        final_api_pagination_config ? JSON.stringify(final_api_pagination_config) : null, final_is_active ?? true
      ]
    )
    
    // Update Vault path with actual connection ID if using Vault
    if (useVault && rows[0]?.id) {
      const actualId = rows[0].id
      // Extract temp ID from stored references
      const tempMatch = storedAuthToken?.match(/temp-(\d+)/) || 
                       storedAuthPassword?.match(/temp-(\d+)/) || 
                       storedApiKeyValue?.match(/temp-(\d+)/)
      if (tempMatch) {
        const tempId = `temp-${tempMatch[1]}`
        const vaultCreds = await secretsManager.getExternalApiCredentials(tempId)
        if (vaultCreds) {
          // Store with actual ID (temp cleanup, no audit needed)
          await secretsManager.storeExternalApiCredentials(actualId, vaultCreds)
          // Delete temp entry
          try {
            await secretsManager.deleteSecret(`external-connections/${tempId}/credentials`)
          } catch (error) {
            // Ignore if already deleted
          }
          // Update database with correct Vault paths
          await query(
            `UPDATE public.external_connections SET
             api_auth_token = CASE WHEN api_auth_token LIKE 'vault://%' THEN $1 ELSE api_auth_token END,
             api_auth_password = CASE WHEN api_auth_password LIKE 'vault://%' THEN $2 ELSE api_auth_password END,
             api_auth_apikey_value = CASE WHEN api_auth_apikey_value LIKE 'vault://%' THEN $3 ELSE api_auth_apikey_value END
             WHERE id = $4`,
            [
              storedAuthToken ? `vault://${actualId}/authToken` : null,
              storedAuthPassword ? `vault://${actualId}/password` : null,
              storedApiKeyValue ? `vault://${actualId}/apiKey` : null,
              actualId
            ]
          )
        }
      }
    }
    
    return NextResponse.json({ connection: rows[0] }, { status: 201 })
  } else {
    // Insert database connection
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let storedPassword = password || null
    
    if (useVault && password) {
      // Store password in Vault (will update with actual ID after insert)
      const connectionId = `temp-${Date.now()}`
      const auditContext = createAuditContext(request, session.user, 'Database connection creation')
      await secretsManager.storeSecret(
        `database-connections/${connectionId}/credentials`,
        {
          password: password,
          username: username,
          host: host,
          port: port ? parseInt(port.toString()) : undefined,
          database: database,
        },
        undefined,
        auditContext
      )
      storedPassword = `vault://${connectionId}/password`
    } else if (!useVault && password) {
      // Encrypt for database storage
      storedPassword = encryptApiKey(password)
    }
    
    const { rows } = await query(
      `INSERT INTO public.external_connections
        (space_id, name, connection_type, db_type, host, port, database, username, password, options, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [space_id, name, final_connection_type, final_db_type, host, port ?? null, database ?? null, username ?? null, storedPassword, options ? JSON.stringify(options) : null, final_is_active ?? true]
    )
    
    // Update Vault path with actual connection ID if using Vault
    if (useVault && rows[0]?.id && password) {
      const actualId = rows[0].id
      // Extract temp ID from stored password reference
      const tempMatch = storedPassword?.match(/temp-(\d+)/)
      if (tempMatch) {
        const tempId = `temp-${tempMatch[1]}`
        const vaultCreds = await secretsManager.getDatabaseCredentials(tempId)
        if (vaultCreds) {
          // Store with actual ID (temp cleanup, no audit needed)
          await secretsManager.storeDatabaseCredentials(actualId, vaultCreds)
          // Delete temp entry
          try {
            await secretsManager.deleteSecret(`database-connections/${tempId}/credentials`)
          } catch (error) {
            // Ignore if already deleted
          }
          // Update database with correct Vault path
          await query(
            `UPDATE public.external_connections SET password = $1 WHERE id = $2`,
            [`vault://${actualId}/password`, actualId]
          )
        }
      }
    }
    
    return NextResponse.json({ connection: rows[0] }, { status: 201 })
  }
}

async function putHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { id, space_id: s_id, spaceId, ...updates } = body
  const rawSpaceId = s_id || spaceId
  if (!id || !rawSpaceId) return NextResponse.json({ error: 'id and space_id are required' }, { status: 400 })

  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const space_id = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(space_id)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'

  // Handle credential updates with Vault
  const processedUpdates = { ...updates }
  
  // Handle password update (database connections)
  const auditContext = createAuditContext(request, session.user, 'Database connection update')
  if ('password' in updates && updates.password !== undefined) {
    if (useVault && updates.password) {
      await secretsManager.storeSecret(
        `database-connections/${id}/credentials`,
        {
          password: updates.password,
          username: updates.username,
          host: updates.host,
          port: updates.port,
          database: updates.database,
        },
        undefined,
        auditContext
      )
      processedUpdates.password = `vault://${id}/password`
    } else if (!useVault && updates.password) {
      processedUpdates.password = encryptApiKey(updates.password)
    } else if (!updates.password) {
      // Delete from Vault if clearing password
      if (useVault) {
        try {
          await secretsManager.deleteSecret(`database-connections/${id}/credentials`, auditContext)
        } catch (error) {
          // Ignore if secret doesn't exist
        }
      }
      processedUpdates.password = null
    }
  }

  // Handle API credentials update (API connections)
  if (useVault) {
    if ('api_auth_token' in updates || 'api_auth_password' in updates || 'api_auth_apikey_value' in updates) {
      const apiAuditContext = createAuditContext(request, session.user, 'External API connection update')
      const existingCreds = await secretsManager.getExternalApiCredentials(id, apiAuditContext) || {}
      const updatedCreds = {
        ...existingCreds,
        authToken: 'api_auth_token' in updates ? updates.api_auth_token : existingCreds.authToken,
        password: 'api_auth_password' in updates ? updates.api_auth_password : existingCreds.password,
        apiKey: 'api_auth_apikey_value' in updates ? updates.api_auth_apikey_value : existingCreds.apiKey,
      }
      await secretsManager.storeSecret(
        `external-connections/${id}/credentials`,
        updatedCreds,
        undefined,
        apiAuditContext
      )
      
      if ('api_auth_token' in updates) {
        processedUpdates.api_auth_token = updates.api_auth_token ? `vault://${id}/authToken` : null
      }
      if ('api_auth_password' in updates) {
        processedUpdates.api_auth_password = updates.api_auth_password ? `vault://${id}/password` : null
      }
      if ('api_auth_apikey_value' in updates) {
        processedUpdates.api_auth_apikey_value = updates.api_auth_apikey_value ? `vault://${id}/apiKey` : null
      }
    }
  } else {
    // Encrypt for database storage
    if ('api_auth_token' in updates && updates.api_auth_token) {
      processedUpdates.api_auth_token = encryptApiKey(updates.api_auth_token)
    }
    if ('api_auth_password' in updates && updates.api_auth_password) {
      processedUpdates.api_auth_password = encryptApiKey(updates.api_auth_password)
    }
    if ('api_auth_apikey_value' in updates && updates.api_auth_apikey_value) {
      processedUpdates.api_auth_apikey_value = encryptApiKey(updates.api_auth_apikey_value)
    }
  }

  const fields: string[] = []
  const params: any[] = []
  let idx = 1

  // Map camelCase to snake_case for database columns
  const fieldMapping: Record<string, string> = {
    connectionType: 'connection_type',
    dbType: 'db_type',
    isActive: 'is_active',
    apiUrl: 'api_url',
    apiMethod: 'api_method',
    apiHeaders: 'api_headers',
    apiAuthType: 'api_auth_type',
    apiAuthToken: 'api_auth_token',
    apiAuthUsername: 'api_auth_username',
    apiAuthPassword: 'api_auth_password',
    apiAuthApiKeyName: 'api_auth_apikey_name',
    apiAuthApiKeyValue: 'api_auth_apikey_value',
    apiBody: 'api_body',
    apiResponsePath: 'api_response_path',
    apiPaginationType: 'api_pagination_type',
    apiPaginationConfig: 'api_pagination_config'
  }

  for (const [key, value] of Object.entries(processedUpdates)) {
    const dbColumn = fieldMapping[key] || key
    fields.push(`${dbColumn} = $${idx++}`)
    params.push(value)
  }
  params.push(id)

  const { rows } = await query(
    `UPDATE public.external_connections SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${idx}
     RETURNING *`,
    params
  )
  return NextResponse.json({ connection: rows[0] })
}

async function deleteHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const rawSpaceId = searchParams.get('space_id') || searchParams.get('spaceId')
  if (!id || !rawSpaceId) return NextResponse.json({ error: 'id and space_id are required' }, { status: 400 })
  
  // Normalize space_id: strip any colon suffix (e.g., "uuid:1" -> "uuid")
  const spaceId = rawSpaceId.split(':')[0]
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(spaceId)) {
    return NextResponse.json({ error: 'Invalid space_id format' }, { status: 400 })
  }

  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [spaceId, session.user.id]
  )
  if (access.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Clean up Vault secrets if using Vault
  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'
  
  if (useVault) {
    try {
      // Get connection type to determine which secrets to delete
      const { rows: connRows } = await query(
        'SELECT connection_type FROM public.external_connections WHERE id = $1::uuid',
        [id]
      )
      
      if (connRows.length > 0) {
        const connectionType = connRows[0].connection_type
        
        const deleteAuditContext = createAuditContext(request, session.user, 'External connection deletion')
        if (connectionType === 'database') {
          // Delete database credentials from Vault
          await secretsManager.deleteSecret(`database-connections/${id}/credentials`, deleteAuditContext)
        } else if (connectionType === 'api') {
          // Delete API credentials from Vault
          await secretsManager.deleteSecret(`external-connections/${id}/credentials`, deleteAuditContext)
        }
      }
    } catch (error) {
      // Log but don't fail - connection might not have Vault secrets
      console.warn('Failed to cleanup Vault secrets for connection:', id, error)
    }
  }
  
  await query(
    `UPDATE public.external_connections SET deleted_at = NOW()
     WHERE id = $1::uuid`,
    [id]
  )
  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/external-connections')
export const POST = withErrorHandling(postHandler, 'POST /api/external-connections')
export const PUT = withErrorHandling(putHandler, 'PUT /api/external-connections')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/external-connections')
