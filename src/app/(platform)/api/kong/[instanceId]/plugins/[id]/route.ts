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
    throw new Error('Kong configuration not found')
  }

  const row = result.rows[0]
  const config = row.management_config || {}
  const credentials = row.credentials || {}
  const endpoints = row.endpoints || []

  const adminUrl = config.admin_url || credentials.admin_url || endpoints.find((e: any) => e.name === 'admin')?.url || 'http://localhost:8001'
  const apiKey = config.api_key || credentials.api_key || credentials.token

  return { adminUrl, apiKey }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, id } = await params
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/plugins/${id}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
      }
      throw new Error(`Kong API returned ${response.status}`)
    }

    const plugin = await response.json()

    return NextResponse.json({ plugin })
}



export const GET = withErrorHandling(getHandler, 'GET /api/kong/[instanceId]/plugins/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, id } = await params
    const body = await request.json()
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/plugins/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Kong API returned ${response.status}`)
    }

    const plugin = await response.json()

    return NextResponse.json({
      success: true,
      plugin,
    })
}



export const PUT = withErrorHandling(putHandler, 'PUT /api/kong/[instanceId]/plugins/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { instanceId, id } = await params
    const config = await getKongConfig(instanceId)

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (config.apiKey) {
      headers['apikey'] = config.apiKey
    }

    const response = await fetch(`${config.adminUrl}/plugins/${id}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
      }
      throw new Error(`Kong API returned ${response.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Plugin deleted successfully',
    })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/kong/[instanceId]/plugins/[id]')

