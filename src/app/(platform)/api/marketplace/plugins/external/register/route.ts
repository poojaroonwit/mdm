import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'
import { PluginSource } from '@/features/marketplace/types'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'

/**
 * Register external plugin from different project folder or remote source
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request, {
    windowMs: 60000,
    maxRequests: 50,
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
      category,
      source,
      sourcePath,
      sourceUrl,
      projectFolder,
      downloadUrl,
      checksum,
    } = body

    if (!name || !slug || !version || !provider || !category || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate source-specific fields
    if (source === 'local-folder' && !sourcePath && !projectFolder) {
      return NextResponse.json(
        { error: 'sourcePath or projectFolder required for local-folder plugins' },
        { status: 400 }
      )
    }

    if ((source === 'cdn' || source === 'git' || source === 'external') && !sourceUrl && !downloadUrl) {
      return NextResponse.json(
        { error: 'sourceUrl or downloadUrl required for remote plugins' },
        { status: 400 }
      )
    }

    // Verify plugin exists if local-folder
    if (source === 'local-folder') {
      const pluginPath = await resolvePluginPath(sourcePath, projectFolder, slug)
      const pluginFile = join(pluginPath, 'plugin.ts')
      
      try {
        await fs.access(pluginFile)
      } catch {
        return NextResponse.json(
          { error: `Plugin file not found: ${pluginFile}` },
          { status: 404 }
        )
      }
    }

    // Check if plugin already exists
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

    // Determine installed path for local-folder plugins
    let installedPath: string | null = null
    if (source === 'local-folder') {
      installedPath = await resolvePluginPath(sourcePath, projectFolder, slug)
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
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'approved', $8::jsonb, $9, $10, $11::jsonb,
        $12, $13::jsonb, $14, $15, $16, $17, $18, $19, $20::jsonb, false, NOW(), NOW()
      ) RETURNING id`,
      [
        name,
        slug,
        description || null,
        version,
        provider,
        providerUrl || null,
        category,
        JSON.stringify({
          source,
          sourcePath: sourcePath || null,
          sourceUrl: sourceUrl || null,
          projectFolder: projectFolder || null,
          downloadUrl: downloadUrl || null,
          checksum: checksum || null,
          installedPath: installedPath,
        }),
        null, // api_base_url
        null, // api_auth_type
        '{}', // api_auth_config
        'react_component', // ui_type
        JSON.stringify({
          componentPath: sourcePath || `@/plugins/${slug}/components/${slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}UI`,
        }),
        false, // webhook_supported
        [], // webhook_events
        null, // icon_url
        [], // screenshots
        null, // documentation_url
        null, // support_url
        null, // pricing_info
      ]
    )

    const pluginId = result.rows[0].id

    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/marketplace/plugins/external/register',
      201
    )

    return NextResponse.json({
      id: pluginId,
      message: 'External plugin registered successfully',
      installedPath,
    })
  } catch (error) {
    console.error('Error registering external plugin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Resolve plugin path from various sources
 */
async function resolvePluginPath(
  sourcePath?: string,
  projectFolder?: string,
  pluginSlug?: string
): Promise<string> {
  const projectRoot = process.cwd()
  const externalPluginDirs = process.env.EXTERNAL_PLUGIN_DIRS?.split(',') || []

  // Try sourcePath first
  if (sourcePath) {
    if (sourcePath.startsWith('/') || sourcePath.match(/^[A-Z]:/)) {
      // Absolute path
      return resolve(sourcePath)
    }

    // Try external plugin directories
    for (const dir of externalPluginDirs) {
      const fullPath = join(dir, sourcePath)
      try {
        await fs.access(fullPath)
        return resolve(fullPath)
      } catch {
        // Continue
      }
    }

    // Try relative to project root
    const rootPath = join(projectRoot, sourcePath)
    try {
      await fs.access(rootPath)
      return resolve(rootPath)
    } catch {
      // Continue
    }
  }

  // Try project folder
  if (projectFolder && pluginSlug) {
    const possiblePaths = [
      join(projectRoot, '..', projectFolder, 'src', 'plugins', pluginSlug),
      join(projectRoot, '..', projectFolder, 'plugins', pluginSlug),
      join(projectRoot, '..', projectFolder, pluginSlug),
      join(process.env.PLUGINS_DIR || '', projectFolder, pluginSlug),
    ]

    for (const path of possiblePaths) {
      try {
        await fs.access(path)
        return resolve(path)
      } catch {
        // Continue
      }
    }
  }

  throw new Error(`Plugin path not found: ${sourcePath || projectFolder}`)
}
