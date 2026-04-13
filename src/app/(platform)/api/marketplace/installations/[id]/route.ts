import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { dropPluginSchema } from '@/lib/plugin-schema-utils'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { storeCredentials, retrieveCredentials, deleteCredentials } from '@/shared/lib/security/credential-manager'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/marketplace/installations/[id]
 * Fetch a single installation with parsed config and credential metadata
 */
async function getHandler(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Installation ID is required' }, { status: 400 })
  }

  const installationResult = await query(
    `SELECT 
      si.id,
      si.service_id,
      si.space_id,
      si.installed_by,
      si.config,
      si.credentials,
      si.status,
      si.last_health_check,
      si.health_status,
      si.permissions,
      si.installed_at,
      si.updated_at,
      si.db_schema,
      sr.slug,
      sr.name,
      sr.category
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE si.id = CAST($1 AS uuid) AND si.deleted_at IS NULL`,
    [id]
  )

  if (installationResult.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const installation = installationResult.rows[0]

  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'read',
    spaceId: installation.space_id || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  const credentials = await retrieveCredentials(`installation:${id}`)
  const credentialKeys = credentials ? Object.keys(credentials) : []

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/marketplace/installations/${id}`,
    200,
    installation.space_id || undefined
  )

  return NextResponse.json({
    installation: {
      id: installation.id,
      serviceId: installation.service_id,
      spaceId: installation.space_id,
      installedBy: installation.installed_by,
      config: typeof installation.config === 'string'
        ? JSON.parse(installation.config)
        : (installation.config || {}),
      status: installation.status,
      lastHealthCheck: installation.last_health_check,
      healthStatus: installation.health_status,
      permissions: installation.permissions,
      installedAt: installation.installed_at,
      updatedAt: installation.updated_at,
      dbSchema: installation.db_schema,
      service: {
        id: installation.service_id,
        slug: installation.slug,
        name: installation.name,
        category: installation.category,
      },
      credentials: {
        configured: credentialKeys.length > 0,
        keys: credentialKeys,
      },
    }
  })
}

/**
 * PUT /api/marketplace/installations/[id]
 * Update installation config and credentials
 */
async function putHandler(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Installation ID is required' }, { status: 400 })
  }

  const body = await request.json()
  const {
    config,
    credentials,
    mergeConfig = true,
    status,
    healthStatus,
    permissions,
  } = body

  const existingResult = await query(
    `SELECT si.id, si.space_id, si.config
     FROM service_installations si
     WHERE si.id = CAST($1 AS uuid) AND si.deleted_at IS NULL`,
    [id]
  )

  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const existing = existingResult.rows[0]

  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'install',
    spaceId: existing.space_id || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  const currentConfig = typeof existing.config === 'string'
    ? JSON.parse(existing.config)
    : (existing.config || {})

  const nextConfig = config === undefined
    ? currentConfig
    : mergeConfig
      ? { ...currentConfig, ...config }
      : config

  await query(
    `UPDATE service_installations
     SET
       config = $1::jsonb,
       status = COALESCE($2, status),
       health_status = COALESCE($3, health_status),
       permissions = COALESCE($4::jsonb, permissions),
       updated_at = NOW()
     WHERE id = CAST($5 AS uuid)`,
    [
      JSON.stringify(nextConfig || {}),
      status || null,
      healthStatus || null,
      permissions ? JSON.stringify(permissions) : null,
      id,
    ]
  )

  if (credentials !== undefined) {
    if (credentials && Object.keys(credentials).length > 0) {
      await storeCredentials(`installation:${id}`, credentials)
    } else {
      await deleteCredentials(`installation:${id}`)
    }
  }

  const updatedCredentials = await retrieveCredentials(`installation:${id}`)
  const updatedCredentialKeys = updatedCredentials ? Object.keys(updatedCredentials) : []

  await logAPIRequest(
    session.user.id,
    'PUT',
    `/api/marketplace/installations/${id}`,
    200,
    existing.space_id || undefined
  )

  return NextResponse.json({
    installation: {
      id,
      spaceId: existing.space_id,
      config: nextConfig || {},
      status: status || undefined,
      healthStatus: healthStatus || undefined,
      permissions: permissions || undefined,
      credentials: {
        configured: updatedCredentialKeys.length > 0,
        keys: updatedCredentialKeys,
      },
    }
  })
}

/**
 * DELETE /api/marketplace/installations/[id]
 * Uninstall a plugin (soft delete) and remove its menu item
 */
async function deleteHandler(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Installation ID is required' }, { status: 400 })
  }

  // Check if installation exists and get details
  const existingResult = await query(
    `SELECT si.id, si.service_id, si.space_id, si.db_schema, sr.slug 
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE si.id = CAST($1 AS uuid) AND si.deleted_at IS NULL`,
    [id]
  )

  if (existingResult.rows.length === 0) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 })
  }

  const installation = existingResult.rows[0]

  // Check permission
  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'uninstall',
    spaceId: installation.space_id || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Soft delete the installation
  await query(
    `UPDATE service_installations SET deleted_at = NOW(), updated_at = NOW() WHERE id = CAST($1 AS uuid)`,
    [id]
  )

  // Decrement installation count
  await query(
    `UPDATE service_registry 
     SET installation_count = GREATEST(0, installation_count - 1), updated_at = NOW()
     WHERE id = CAST($1 AS uuid)`,
    [installation.service_id]
  )

  // Remove menu item if it exists and was created by this plugin
  try {
    await query(
      `DELETE FROM menu_items WHERE source_plugin_id = CAST($1 AS uuid)`,
      [installation.service_id]
    )
    console.log(`[DELETE /api/marketplace/installations] Removed menu item for plugin: ${installation.slug}`)
  } catch (menuError) {
    console.error('[DELETE /api/marketplace/installations] Failed to remove menu item:', menuError)
  }

  // Drop isolated PostgreSQL schema
  if (installation.db_schema) {
    try {
      await dropPluginSchema(installation.slug)
      console.log(`[DELETE /api/marketplace/installations] Dropped schema: ${installation.db_schema} for plugin: ${installation.slug}`)
    } catch (schemaError) {
      console.error('[DELETE /api/marketplace/installations] Failed to drop schema:', schemaError)
    }
  }

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/marketplace/installations/${id}`,
    200,
    installation.space_id
  )

  return NextResponse.json({
    success: true,
    message: 'Plugin uninstalled successfully'
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/installations/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/marketplace/installations/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/marketplace/installations/[id]')
