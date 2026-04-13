import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { config_id, space_id } = body

  if (!config_id) {
    return NextResponse.json({ error: 'config_id is required' }, { status: 400 })
  }

    // Fetch config
    const configResult = await query(
      'SELECT * FROM report_integrations WHERE id = $1 AND created_by = $2',
      [config_id, session.user.id]
    )

    if (configResult.rows.length === 0) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    const config = configResult.rows[0]
    const configData = typeof config.config === 'string' ? JSON.parse(config.config) : config.config

    // TODO: Implement actual Power BI API sync
    // This would call Power BI API to fetch reports and create/update them in the database
    // For now, return a mock response
    const count = 0

  return NextResponse.json({ 
    success: true, 
    count,
    message: `Synced ${count} reports from Power BI` 
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/integrations/power-bi/sync')










