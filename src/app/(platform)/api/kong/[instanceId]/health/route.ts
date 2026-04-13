import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getKongConfig(instanceId: string) {
  const result = await query(
    `SELECT 
      is.management_config,
      sma.credentials,
      is.endpoints
    FROM instance_services is
    JOIN service_registry sr ON sr.id = is.management_plugin_id
    LEFT JOIN service_management_assignments sma ON sma.instance_service_id = is.id
    WHERE is.instance_id = $1
      AND sr.slug = 'kong-management'
      AND is.deleted_at IS NULL
      AND sr.deleted_at IS NULL
    LIMIT 1`,
    [instanceId]
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  // Extract Kong Admin API URL
  const adminUrl = config.admin_url || credentials.admin_url || endpoints.find((e: any) => e.name === 'admin')?.url || 'http://localhost:8001'
  const apiKey = config.api_key || credentials.api_key || credentials.token

  return { adminUrl, apiKey }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId } = await params
    const config = await getKongConfig(instanceId)

    if (!config) {
      return NextResponse.json(
        { error: 'Kong configuration not found for this instance' },
        { status: 404 }
      )
    }

    // Test connection to Kong Admin API
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Kong Admin API returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Kong connection successful',
      version: data.version,
      adminUrl: config.adminUrl,
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/kong/[instanceId]/health')

