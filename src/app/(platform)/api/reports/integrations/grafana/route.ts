import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('space_id')

  const sql = `
    SELECT * FROM report_integrations
    WHERE source = 'grafana' 
      AND created_by::text = $1 
      AND deleted_at IS NULL
      ${spaceId ? 'AND space_id = $2' : ''}
    ORDER BY created_at DESC
  `

  const params = spaceId ? [session.user.id, spaceId] : [session.user.id]
  const result = await query(sql, params)
  
  return NextResponse.json({ configs: result.rows || [] })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    name,
    access_type,
    api_url,
    api_key,
    embed_url,
    public_link,
    is_active,
    space_id
  } = body

  if (!name || !access_type) {
    return NextResponse.json({ error: 'Name and access_type are required' }, { status: 400 })
  }

  const config = {
    api_url,
    api_key,
    embed_url,
    public_link
  }

  const sql = `
    INSERT INTO report_integrations (
      name, source, access_type, config, is_active, space_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `

  const result = await query(sql, [
    name,
    'grafana',
    access_type,
    JSON.stringify(config),
    is_active !== false,
    space_id || null,
    session.user.id
  ])

  return NextResponse.json({ config: result.rows[0] }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/integrations/grafana')

async function putHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    id,
    name,
    access_type,
    api_url,
    api_key,
    embed_url,
    public_link,
    is_active
  } = body

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const config = {
    api_url,
    api_key,
    embed_url,
    public_link
  }

  const sql = `
    UPDATE report_integrations
    SET name = $1, access_type = $2, config = $3, is_active = $4, updated_at = NOW()
    WHERE id::text = $5 AND created_by::text = $6
    RETURNING *
  `

  const result = await query(sql, [
    name,
    access_type,
    JSON.stringify(config),
    is_active !== false,
    id,
    session.user.id
  ])

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
  }

  return NextResponse.json({ config: result.rows[0] })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/reports/integrations/grafana')


export const GET = withErrorHandling(getHandler, 'GET GET /api/reports/integrations/grafana')