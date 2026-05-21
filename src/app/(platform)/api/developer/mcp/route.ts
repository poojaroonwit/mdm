import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import {
  buildPluginStarterBundle,
  getProjectDeveloperSnapshot,
  PROJECT_DEVELOPER_DOCS_ROUTE,
  PROJECT_MCP_ENDPOINT,
  PROJECT_PLUGIN_TEMPLATE_ROUTE,
  readProjectModule,
} from '@/lib/project-developer'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { deleteCredentials, retrieveCredentials, storeCredentials } from '@/shared/lib/security/credential-manager'
import { dropPluginSchema } from '@/lib/plugin-schema-utils'

type JsonRpcRequest = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, any>
}

const TOOL_DEFINITIONS = [
  {
    name: 'list_project_modules',
    description: 'List major features, platform pages, plugin modules, and project docs in this repository.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'read_project_module',
    description: 'Read one module or folder inside the repository and return child entries plus previews.',
    inputSchema: {
      type: 'object',
      properties: {
        modulePath: { type: 'string', description: 'Project-relative path such as src/features/marketplace or plugin-hub/plugins' },
      },
      required: ['modulePath'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_project_docs',
    description: 'Return the developer snapshot for this project, including commands and important endpoints.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin_catalog',
    description: 'List marketplace plugins from service_registry with optional filters.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        status: { type: 'string' },
        verified: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin',
    description: 'Read one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_plugin',
    description: 'Update one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        patch: { type: 'object' },
      },
      required: ['slug', 'patch'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_plugin',
    description: 'Soft-delete one marketplace plugin by slug.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
      },
      required: ['slug'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_installations',
    description: 'List plugin installations with optional space or service filters.',
    inputSchema: {
      type: 'object',
      properties: {
        spaceId: { type: 'string' },
        serviceId: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_installation',
    description: 'Read a single plugin installation by id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_installation',
    description: 'Update installation config, status, permissions, or credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        config: { type: 'object' },
        credentials: { type: 'object' },
        mergeConfig: { type: 'boolean' },
        status: { type: 'string' },
        healthStatus: { type: 'string' },
        permissions: { type: 'object' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'delete_installation',
    description: 'Soft-delete a plugin installation and clean up plugin menu state.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_plugin_starter_bundle',
    description: 'Generate the downloadable plugin starter bundle used by the marketplace developer workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        name: { type: 'string' },
        provider: { type: 'string' },
        category: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
]

function jsonRpcResult(id: JsonRpcRequest['id'], result: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  })
}

function jsonRpcError(id: JsonRpcRequest['id'], code: number, message: string, data?: unknown) {
  return NextResponse.json({
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      data,
    },
  })
}

function toToolResponse(payload: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
    structuredContent: payload,
  }
}

async function ensureAdmin(session: any) {
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Admin access is required for this tool')
  }
}

async function listPlugins(filters: Record<string, any>) {
  const conditions = ['deleted_at IS NULL']
  const params: any[] = []
  let paramIndex = 1

  if (filters.category) {
    conditions.push(`category = $${paramIndex}`)
    params.push(filters.category)
    paramIndex += 1
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`)
    params.push(filters.status)
    paramIndex += 1
  }

  if (filters.verified !== undefined) {
    conditions.push(`verified = $${paramIndex}`)
    params.push(filters.verified)
    paramIndex += 1
  }

  const result = await query(
    `SELECT
      id,
      name,
      slug,
      description,
      version,
      provider,
      category,
      status,
      verified,
      installation_count,
      rating,
      review_count,
      documentation_url,
      support_url,
      updated_at
     FROM service_registry
     WHERE ${conditions.join(' AND ')}
     ORDER BY installation_count DESC NULLS LAST, updated_at DESC`,
    params
  )

  return result.rows
}

async function getPlugin(slug: string) {
  const result = await query(
    `SELECT * FROM service_registry WHERE slug = $1 AND deleted_at IS NULL`,
    [slug]
  )

  if (result.rows.length === 0) {
    throw new Error(`Plugin not found: ${slug}`)
  }

  return result.rows[0]
}

async function updatePlugin(slug: string, patch: Record<string, any>) {
  const allowedFields = new Set([
    'name',
    'description',
    'version',
    'provider',
    'provider_url',
    'category',
    'status',
    'capabilities',
    'api_base_url',
    'api_auth_type',
    'api_auth_config',
    'ui_type',
    'ui_config',
    'webhook_supported',
    'webhook_events',
    'icon_url',
    'screenshots',
    'documentation_url',
    'support_url',
    'pricing_info',
    'verified',
    'security_audit',
  ])

  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(patch)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (!allowedFields.has(dbKey)) {
      continue
    }

    updates.push(`${dbKey} = $${paramIndex}`)
    values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value)
    paramIndex += 1
  }

  if (updates.length === 0) {
    throw new Error('No valid plugin fields provided')
  }

  values.push(slug)
  const result = await query(
    `UPDATE service_registry
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE slug = $${paramIndex} AND deleted_at IS NULL
     RETURNING id, slug, updated_at`,
    values
  )

  if (result.rows.length === 0) {
    throw new Error(`Plugin not found: ${slug}`)
  }

  return result.rows[0]
}

async function deletePlugin(slug: string) {
  const result = await query(
    `UPDATE service_registry
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE slug = $1 AND deleted_at IS NULL
     RETURNING id, slug`,
    [slug]
  )

  if (result.rows.length === 0) {
    throw new Error(`Plugin not found: ${slug}`)
  }

  return result.rows[0]
}

async function listInstallations(spaceId?: string, serviceId?: string) {
  const conditions = ['si.deleted_at IS NULL']
  const params: any[] = []
  let paramIndex = 1

  if (spaceId) {
    conditions.push(`si.space_id = CAST($${paramIndex} AS uuid)`)
    params.push(spaceId)
    paramIndex += 1
  }

  if (serviceId) {
    conditions.push(`si.service_id = CAST($${paramIndex} AS uuid)`)
    params.push(serviceId)
    paramIndex += 1
  }

  const result = await query(
    `SELECT
      si.id,
      si.service_id,
      si.space_id,
      si.status,
      si.health_status,
      si.installed_at,
      si.updated_at,
      sr.slug,
      sr.name
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY si.installed_at DESC`,
    params
  )

  return result.rows
}

async function getInstallation(id: string) {
  const installationResult = await query(
    `SELECT
      si.id,
      si.service_id,
      si.space_id,
      si.installed_by,
      si.config,
      si.status,
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
    throw new Error(`Installation not found: ${id}`)
  }

  const installation = installationResult.rows[0]
  const credentials = await retrieveCredentials(`installation:${id}`)

  return {
    ...installation,
    config: typeof installation.config === 'string' ? JSON.parse(installation.config) : installation.config,
    credentialKeys: credentials ? Object.keys(credentials) : [],
  }
}

async function updateInstallation(args: Record<string, any>) {
  const existingResult = await query(
    `SELECT id, space_id, config
     FROM service_installations
     WHERE id = CAST($1 AS uuid) AND deleted_at IS NULL`,
    [args.id]
  )

  if (existingResult.rows.length === 0) {
    throw new Error(`Installation not found: ${args.id}`)
  }

  const existing = existingResult.rows[0]
  const currentConfig = typeof existing.config === 'string' ? JSON.parse(existing.config) : (existing.config || {})
  const nextConfig = args.config === undefined
    ? currentConfig
    : args.mergeConfig === false
      ? args.config
      : { ...currentConfig, ...args.config }

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
      args.status || null,
      args.healthStatus || null,
      args.permissions ? JSON.stringify(args.permissions) : null,
      args.id,
    ]
  )

  if (args.credentials !== undefined) {
    if (args.credentials && Object.keys(args.credentials).length > 0) {
      await storeCredentials(`installation:${args.id}`, args.credentials)
    } else {
      await deleteCredentials(`installation:${args.id}`)
    }
  }

  return getInstallation(args.id)
}

async function deleteInstallation(id: string) {
  const existingResult = await query(
    `SELECT si.id, si.service_id, si.space_id, si.db_schema, sr.slug
     FROM service_installations si
     JOIN service_registry sr ON sr.id = si.service_id
     WHERE si.id = CAST($1 AS uuid) AND si.deleted_at IS NULL`,
    [id]
  )

  if (existingResult.rows.length === 0) {
    throw new Error(`Installation not found: ${id}`)
  }

  const installation = existingResult.rows[0]

  await query(
    `UPDATE service_installations
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = CAST($1 AS uuid)`,
    [id]
  )

  await query(
    `UPDATE service_registry
     SET installation_count = GREATEST(0, installation_count - 1), updated_at = NOW()
     WHERE id = CAST($1 AS uuid)`,
    [installation.service_id]
  )

  await query(
    `DELETE FROM menu_items WHERE source_plugin_id = CAST($1 AS uuid)`,
    [installation.service_id]
  )

  if (installation.db_schema) {
    await dropPluginSchema(installation.slug)
  }

  return {
    id,
    deleted: true,
    slug: installation.slug,
  }
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const payload = (await request.json()) as JsonRpcRequest
  const method = payload.method

  if (!method) {
    return jsonRpcError(payload.id, -32600, 'Missing JSON-RPC method')
  }

  if (method === 'initialize') {
    return jsonRpcResult(payload.id, {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'mdm-project-http-mcp',
        version: '1.0.0',
      },
      instructions: `Use ${PROJECT_MCP_ENDPOINT} for JSON-RPC tool calls. Developer docs live at ${PROJECT_DEVELOPER_DOCS_ROUTE} and starter bundles at ${PROJECT_PLUGIN_TEMPLATE_ROUTE}.`,
    })
  }

  if (method === 'notifications/initialized') {
    return new NextResponse(null, { status: 204 })
  }

  if (method === 'tools/list') {
    return jsonRpcResult(payload.id, {
      tools: TOOL_DEFINITIONS,
    })
  }

  if (method !== 'tools/call') {
    return jsonRpcError(payload.id, -32601, `Unsupported method: ${method}`)
  }

  const toolName = payload.params?.name
  const args = payload.params?.arguments || {}

  try {
    switch (toolName) {
      case 'list_project_modules': {
        const snapshot = await getProjectDeveloperSnapshot()
        return jsonRpcResult(payload.id, toToolResponse({
          counts: snapshot.counts,
          modules: snapshot.modules,
        }))
      }
      case 'read_project_module': {
        const result = await readProjectModule(args.modulePath)
        return jsonRpcResult(payload.id, toToolResponse(result))
      }
      case 'get_project_docs': {
        const snapshot = await getProjectDeveloperSnapshot()
        return jsonRpcResult(payload.id, toToolResponse(snapshot))
      }
      case 'get_plugin_catalog': {
        const plugins = await listPlugins(args)
        return jsonRpcResult(payload.id, toToolResponse({ plugins }))
      }
      case 'get_plugin': {
        const plugin = await getPlugin(args.slug)
        return jsonRpcResult(payload.id, toToolResponse({ plugin }))
      }
      case 'update_plugin': {
        await ensureAdmin(session)
        const plugin = await updatePlugin(args.slug, args.patch || {})
        return jsonRpcResult(payload.id, toToolResponse({ plugin }))
      }
      case 'delete_plugin': {
        await ensureAdmin(session)
        const plugin = await deletePlugin(args.slug)
        return jsonRpcResult(payload.id, toToolResponse({ plugin }))
      }
      case 'list_installations': {
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'read',
          spaceId: args.spaceId || null,
        })

        if (!permission.allowed) {
          throw new Error(permission.reason || 'Not allowed to read installations')
        }

        const installations = await listInstallations(args.spaceId, args.serviceId)
        return jsonRpcResult(payload.id, toToolResponse({ installations }))
      }
      case 'get_installation': {
        const installation = await getInstallation(args.id)
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'read',
          spaceId: installation.space_id || null,
        })

        if (!permission.allowed) {
          throw new Error(permission.reason || 'Not allowed to read this installation')
        }

        return jsonRpcResult(payload.id, toToolResponse({ installation }))
      }
      case 'update_installation': {
        const installation = await getInstallation(args.id)
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'install',
          spaceId: installation.space_id || null,
        })

        if (!permission.allowed) {
          throw new Error(permission.reason || 'Not allowed to update this installation')
        }

        const updated = await updateInstallation(args)
        return jsonRpcResult(payload.id, toToolResponse({ installation: updated }))
      }
      case 'delete_installation': {
        const installation = await getInstallation(args.id)
        const permission = await checkPermission({
          resource: 'marketplace',
          action: 'uninstall',
          spaceId: installation.space_id || null,
        })

        if (!permission.allowed) {
          throw new Error(permission.reason || 'Not allowed to delete this installation')
        }

        const deleted = await deleteInstallation(args.id)
        return jsonRpcResult(payload.id, toToolResponse({ installation: deleted }))
      }
      case 'get_plugin_starter_bundle': {
        const bundle = buildPluginStarterBundle(args)
        return jsonRpcResult(payload.id, toToolResponse({ bundle }))
      }
      default:
        return jsonRpcError(payload.id, -32601, `Unknown tool: ${toolName}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected MCP tool failure'
    return jsonRpcError(payload.id, -32000, message)
  }
}

async function getHandler() {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  return NextResponse.json({
    name: 'mdm-project-http-mcp',
    transport: 'http-jsonrpc',
    endpoint: PROJECT_MCP_ENDPOINT,
    developerDocs: PROJECT_DEVELOPER_DOCS_ROUTE,
    pluginStarterDownload: PROJECT_PLUGIN_TEMPLATE_ROUTE,
    tools: TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
    })),
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/developer/mcp')
export const POST = withErrorHandling(postHandler, 'POST /api/developer/mcp')
