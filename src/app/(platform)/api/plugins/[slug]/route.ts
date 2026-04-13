import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { pluginLoader } from '@/features/marketplace/lib/plugin-loader'
import { pluginRegistry } from '@/features/marketplace/lib/plugin-registry'

/**
 * Plugin runtime endpoint - loads and executes plugin code
 */
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { slug } = await params

    // Get plugin from database
    const result = await query(
      'SELECT * FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    const row = result.rows[0]
    const plugin = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      uiType: row.ui_type,
      uiConfig: row.ui_config,
    }

    // Load plugin component if needed
    if (plugin.uiType === 'react_component' && plugin.uiConfig?.componentPath) {
      try {
        const component = await pluginLoader.loadComponent(plugin as any, plugin.uiConfig.componentPath)
        return NextResponse.json({ 
          plugin,
          component: component.default ? component.default : component,
        })
      } catch (error) {
        console.error('Error loading plugin component:', error)
        return NextResponse.json(
          { error: 'Failed to load plugin component' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ plugin })
  } catch (error: any) {
    console.error('Error fetching plugin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/plugins/[slug]')
