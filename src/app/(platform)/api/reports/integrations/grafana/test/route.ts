import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { config_id } = body

  if (!config_id) {
    return NextResponse.json({ error: 'config_id is required' }, { status: 400 })
  }

    const configResult = await query(
      'SELECT * FROM report_integrations WHERE id = $1 AND created_by = $2',
      [config_id, session.user.id]
    )

    if (configResult.rows.length === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    const config = configResult.rows[0]
    const configData = typeof config.config === 'string' ? JSON.parse(config.config) : config.config

    // TODO: Implement actual Grafana API connection test
    let success = false
    if (config.access_type === 'SDK') {
      success = !!(configData.api_url && configData.api_key)
    } else if (config.access_type === 'EMBED') {
      success = !!configData.embed_url
    } else if (config.access_type === 'PUBLIC') {
      success = !!configData.public_link
    }

  return NextResponse.json({ success, message: success ? 'Connection successful' : 'Connection failed' })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/integrations/grafana/test')










