import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getPrometheusConfig(instanceId: string) {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'prometheus-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    throw new Error('Prometheus configuration not found')
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const apiUrl = config.api_url || credentials.api_url || endpoints[0]?.url || 'http://localhost:9090'

  return { apiUrl }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const config = await getPrometheusConfig(instanceId)

    const response = await fetch(`${config.apiUrl}/api/v1/rules`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Prometheus API returned ${response.status}`)
    }

    const data = await response.json()
    const rules: any[] = []

    // Flatten rules from groups
    if (data.data?.groups) {
      for (const group of data.data.groups) {
        if (group.rules) {
          for (const rule of group.rules) {
            rules.push({
              ...rule,
              group: group.name,
              type: rule.type || (rule.alert ? 'alerting' : 'recording'),
            })
          }
        }
      }
    }

    return NextResponse.json({ rules })
}

export const GET = withErrorHandling(getHandler, 'GET /api/prometheus/[instanceId]/rules')

