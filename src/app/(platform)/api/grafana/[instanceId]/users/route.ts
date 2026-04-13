import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getGrafanaConfig(instanceId: string) {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'grafana-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    throw new Error('Grafana configuration not found')
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const baseUrl = config.base_url || credentials.base_url || endpoints[0]?.url || 'http://localhost:3000'
  const apiKey = config.api_key || credentials.api_key || credentials.token

  return { baseUrl, apiKey }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const config = await getGrafanaConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await fetch(`${config.baseUrl}/api/users`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Grafana API returned ${response.status}`)
    }

    const users = await response.json()

    return NextResponse.json({ users: users || [] })
}

export const GET = withErrorHandling(getHandler, 'GET /api/grafana/[instanceId]/users')

