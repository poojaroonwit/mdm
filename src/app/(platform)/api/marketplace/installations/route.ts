import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { createPluginSchema, runPluginMigration } from '@/lib/plugin-schema-utils'
import { storeCredentials } from '@/shared/lib/security/credential-manager'
import { checkPermission } from '@/shared/lib/security/permission-checker'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId')
  const serviceId = searchParams.get('serviceId')

  let whereConditions = ['si.deleted_at IS NULL']
  const queryParams: any[] = []
  let paramIndex = 1

  if (spaceId) {
    whereConditions.push(`si.space_id = CAST($${paramIndex} AS uuid)`)
    queryParams.push(spaceId)
    paramIndex++
  }

  if (serviceId) {
    whereConditions.push(`si.service_id = CAST($${paramIndex} AS uuid)`)
    queryParams.push(serviceId)
    paramIndex++
  }

  // Check permission
  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'read',
    spaceId: spaceId || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  const whereClause = whereConditions.join(' AND ')

  const installationsQuery = `
      SELECT 
        si.id,
        si.service_id,
        si.space_id,
        si.installed_by,
        si.config,
        si.status,
        si.last_health_check,
        si.health_status,
        si.permissions,
        si.installed_at,
        si.updated_at,
        json_build_object(
          'id', sr.id,
          'name', sr.name,
          'slug', sr.slug,
          'category', sr.category
        ) as service
      FROM service_installations si
      JOIN service_registry sr ON sr.id = si.service_id
      WHERE ${whereClause}
      ORDER BY si.installed_at DESC
    `

  const result = await query(installationsQuery, queryParams)

  const installations = result.rows.map((row: any) => ({
    id: row.id,
    serviceId: row.service_id,
    spaceId: row.space_id,
    installedBy: row.installed_by,
    config: row.config,
    status: row.status,
    lastHealthCheck: row.last_health_check,
    healthStatus: row.health_status,
    permissions: row.permissions,
    service: row.service,
    installedAt: row.installed_at,
    updatedAt: row.updated_at,
  }))

  await logAPIRequest(
    session.user.id,
    'GET',
    '/api/marketplace/installations',
    200,
    spaceId || undefined
  )

  return NextResponse.json({ installations })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/installations')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  console.log('[POST /api/marketplace/installations] Installing plugin:', body)
  const { serviceId, spaceId, config, credentials } = body

  if (!serviceId) {
    return NextResponse.json(
      { error: 'serviceId is required' },
      { status: 400 }
    )
  }

  // Resolve serviceId to UUID if it's a slug
  let resolvedServiceId = serviceId
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceId)

  if (!isUuid) {
    console.log(`[POST /api/marketplace/installations] Resolving slug: ${serviceId}`)
    const pluginResult = await query(
      'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [serviceId]
    )

    if (pluginResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Plugin not found: ${serviceId}` },
        { status: 404 }
      )
    }

    resolvedServiceId = pluginResult.rows[0].id
    console.log(`[POST /api/marketplace/installations] Resolved slug ${serviceId} to ${resolvedServiceId}`)
  }

  // Check permission (spaceId is optional for global installations)
  const permission = await checkPermission({
    resource: 'marketplace',
    action: 'install',
    spaceId: spaceId || null,
  })

  if (!permission.allowed) {
    return NextResponse.json(
      { error: 'Forbidden', reason: permission.reason },
      { status: 403 }
    )
  }

  // Check if already installed (globally if no spaceId, or in specific space)
  const existingQuery = spaceId
    ? `SELECT id, service_id, space_id, status FROM service_installations 
         WHERE service_id = CAST($1 AS uuid) AND space_id = CAST($2 AS uuid) AND deleted_at IS NULL`
    : `SELECT id, service_id, space_id, status FROM service_installations 
         WHERE service_id = CAST($1 AS uuid) AND space_id IS NULL AND deleted_at IS NULL`

  const existingParams = spaceId ? [resolvedServiceId, spaceId] : [resolvedServiceId]
  const existing = await query(existingQuery, existingParams)

  if (existing.rows.length > 0) {
    // Return existing installation instead of error
    const existingInstallation = existing.rows[0]
    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/installations',
      200,
      spaceId
    )

    return NextResponse.json(
      {
        installation: {
          id: existingInstallation.id,
          serviceId: existingInstallation.service_id,
          spaceId: existingInstallation.space_id,
          status: existingInstallation.status,
        },
        message: 'Plugin already installed',
        alreadyInstalled: true
      },
      { status: 200 }
    )
  }

  // Store credentials if provided
  let credentialsStored = false
  if (credentials) {
    await storeCredentials(`plugin:${resolvedServiceId}:${spaceId}`, credentials)
    credentialsStored = true
  }

  // Create installation (use subquery for installed_by to handle stale session users gracefully)
  console.log('[POST /api/marketplace/installations] Executing safe INSERT with user check')
  const insertQuery = spaceId
    ? `INSERT INTO service_installations (
          id, service_id, space_id, installed_by, config, credentials, status, installed_at, updated_at
        ) VALUES (
          gen_random_uuid(), CAST($1 AS uuid), CAST($2 AS uuid), (SELECT id FROM users WHERE id = CAST($3 AS uuid)), $4::jsonb, $5::jsonb, 'active', NOW(), NOW()
        ) RETURNING id`
    : `INSERT INTO service_installations (
          id, service_id, space_id, installed_by, config, credentials, status, installed_at, updated_at
        ) VALUES (
          gen_random_uuid(), CAST($1 AS uuid), NULL, (SELECT id FROM users WHERE id = CAST($2 AS uuid)), $3::jsonb, $4::jsonb, 'active', NOW(), NOW()
        ) RETURNING id`

  const insertParams = spaceId
    ? [
      resolvedServiceId,
      spaceId,
      session.user.id,
      config ? JSON.stringify(config) : '{}',
      credentialsStored ? JSON.stringify({ stored: true }) : '{}',
    ]
    : [
      resolvedServiceId,
      session.user.id,
      config ? JSON.stringify(config) : '{}',
      credentialsStored ? JSON.stringify({ stored: true }) : '{}',
    ]

  const result = await query(insertQuery, insertParams)

  const installationId = result.rows[0].id

  // Update installation count
  await query(
    `UPDATE service_registry 
       SET installation_count = installation_count + 1, updated_at = NOW()
       WHERE id = CAST($1 AS uuid)`,
    [resolvedServiceId]
  )

  // Create isolated PostgreSQL schema for the plugin
  let dbSchemaName: string | null = null
  try {
    const pluginResult = await query(
      `SELECT slug, ui_config, capabilities FROM service_registry WHERE id = CAST($1 AS uuid)`,
      [resolvedServiceId]
    )

    if (pluginResult.rows.length > 0) {
      const plugin = pluginResult.rows[0]
      dbSchemaName = await createPluginSchema(plugin.slug)

      // Update installation with schema name
      await query(
        `UPDATE service_installations SET db_schema = $1 WHERE id = CAST($2 AS uuid)`,
        [dbSchemaName, installationId]
      )

      // Check for migrations
      const uiConfig = plugin.ui_config || {}
      const capabilities = plugin.capabilities || {}
      const migrationSql = uiConfig.migrations?.up || capabilities.migrations?.up

      if (migrationSql) {
        console.log(`[POST /api/marketplace/installations] Running migrations for ${plugin.slug} in schema ${dbSchemaName}`)
        await runPluginMigration(plugin.slug, migrationSql)
      }
    }
  } catch (schemaError) {
    console.error('[POST /api/marketplace/installations] Failed to setup isolated schema:', schemaError)
    // We continue with installation even if schema setup fails (fallback to public schema or error later)
  }

  // Create menu item if plugin has navigation config
  try {
    // Fetch plugin's ui_config to check for navigation
    const pluginResult = await query(
      `SELECT slug, name, ui_config, capabilities FROM service_registry WHERE id = CAST($1 AS uuid)`,
      [resolvedServiceId]
    )

    if (pluginResult.rows.length > 0) {
      const plugin = pluginResult.rows[0]
      const uiConfig = plugin.ui_config || {}
      const capabilities = plugin.capabilities || {}
      const navigation = uiConfig.navigation || capabilities.navigation

      if (navigation && navigation.group && navigation.label) {
        // Find the group
        const groupResult = await query(
          `SELECT id FROM menu_groups WHERE slug = $1`,
          [navigation.group]
        )

        if (groupResult.rows.length > 0) {
          const groupId = groupResult.rows[0].id

          // Check if menu item already exists
          const existingItem = await query(
            `SELECT id FROM menu_items WHERE slug = $1`,
            [plugin.slug]
          )

          if (existingItem.rows.length === 0) {
            // Insert new menu item
            await query(
              `INSERT INTO menu_items (id, group_id, slug, name, icon, href, section, priority, is_visible, is_builtin, source_plugin_id, created_at, updated_at)
               VALUES (gen_random_uuid(), CAST($1 AS uuid), $2, $3, $4, $5, $6, $7, true, false, CAST($8 AS uuid), NOW(), NOW())`,
              [
                groupId,
                plugin.slug,
                navigation.label,
                navigation.icon || 'FileText',
                navigation.href || `/tools/${plugin.slug}`,
                navigation.section || null,
                navigation.priority || 100,
                resolvedServiceId
              ]
            )
            console.log(`[POST /api/marketplace/installations] Created menu item for plugin: ${plugin.slug}`)
          }
        }
      }
    }
  } catch (menuError) {
    // Don't fail installation if menu creation fails
    console.error('[POST /api/marketplace/installations] Failed to create menu item:', menuError)
  }

  await logAPIRequest(
    session.user.id,
    'POST',
    '/api/marketplace/installations',
    201,
    spaceId
  )

  return NextResponse.json(
    {
      installation: {
        id: installationId,
        serviceId: resolvedServiceId,
        spaceId,
        status: 'active',
      },
      message: 'Plugin installed successfully'
    },
    { status: 201 }
  )
}

export const POST = withErrorHandling(postHandler, 'POST /api/marketplace/installations')

