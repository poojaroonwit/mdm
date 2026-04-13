import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params

  const result = await query(
    `SELECT * FROM service_registry WHERE slug = $1 AND deleted_at IS NULL`,
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
    description: row.description,
    version: row.version,
    provider: row.provider,
    providerUrl: row.provider_url,
    category: row.category,
    status: row.status,
    capabilities: row.capabilities,
    apiBaseUrl: row.api_base_url,
    apiAuthType: row.api_auth_type,
    apiAuthConfig: row.api_auth_config,
    uiType: row.ui_type,
    uiConfig: row.ui_config,
    webhookSupported: row.webhook_supported,
    webhookEvents: row.webhook_events,
    iconUrl: row.icon_url,
    screenshots: row.screenshots,
    documentationUrl: row.documentation_url,
    supportUrl: row.support_url,
    pricingInfo: row.pricing_info,
    installationCount: row.installation_count,
    rating: row.rating ? parseFloat(row.rating) : null,
    reviewCount: row.review_count,
    verified: row.verified,
    securityAudit: row.security_audit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/marketplace/plugins/${slug}`,
    200
  )

  return NextResponse.json({ plugin })
}

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  const body = await request.json()

  // Build update query dynamically
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  const allowedFields = [
    'name', 'description', 'version', 'provider', 'provider_url', 'category',
    'status', 'capabilities', 'api_base_url', 'api_auth_type', 'api_auth_config',
    'ui_type', 'ui_config', 'webhook_supported', 'webhook_events', 'icon_url',
    'screenshots', 'documentation_url', 'support_url', 'pricing_info', 'verified'
  ]

  for (const [key, value] of Object.entries(body)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (allowedFields.includes(dbKey)) {
      if (typeof value === 'object' && value !== null) {
        updates.push(`${dbKey} = $${paramIndex}`)
        values.push(JSON.stringify(value))
      } else {
        updates.push(`${dbKey} = $${paramIndex}`)
        values.push(value)
      }
      paramIndex++
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates.push(`updated_at = NOW()`)
  values.push(slug)

  const updateQuery = `
    UPDATE service_registry
    SET ${updates.join(', ')}
    WHERE slug = $${paramIndex} AND deleted_at IS NULL
    RETURNING id
  `

  const result = await query(updateQuery, values)

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
  }

  await logAPIRequest(
    session.user.id,
    'PUT',
    `/api/marketplace/plugins/${slug}`,
    200
  )

  return NextResponse.json({ message: 'Plugin updated successfully' })
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params

  const result = await query(
    `UPDATE service_registry
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE slug = $1 AND deleted_at IS NULL
     RETURNING id`,
    [slug]
  )

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
  }

  await logAPIRequest(
    session.user.id,
    'DELETE',
    `/api/marketplace/plugins/${slug}`,
    200
  )

  return NextResponse.json({ message: 'Plugin deleted successfully' })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/plugins/[slug]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/marketplace/plugins/[slug]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/marketplace/plugins/[slug]')
