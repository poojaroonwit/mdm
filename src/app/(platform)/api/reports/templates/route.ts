import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auditLogger } from '@/lib/utils/audit-logger'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const sql = `
    SELECT * FROM report_templates
    WHERE deleted_at IS NULL
      AND (is_public = true OR created_by = $1)
    ORDER BY usage_count DESC, created_at DESC
  `

  const result = await query(sql, [session.user.id])

  return NextResponse.json({ templates: result.rows || [] })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { name, description, source, category_id, folder_id, metadata, is_public } = body

  if (!name || !source) {
    return NextResponse.json({ error: 'Name and source are required' }, { status: 400 })
  }

  const sql = `
    INSERT INTO report_templates (
      name, description, source, category_id, folder_id, metadata, is_public, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `

  const result = await query(sql, [
    name,
    description || null,
    source,
    category_id || null,
    folder_id || null,
    metadata ? JSON.stringify(metadata) : null,
    is_public || false,
    session.user.id
  ])

  // Log audit event (templates are tracked as report resource type)
  auditLogger.reportCreated(result.rows[0].id, { source: 'template', template_id: result.rows[0].id })

  return NextResponse.json({ template: result.rows[0] }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/templates')


export const GET = withErrorHandling(getHandler, 'GET GET /api/reports/templates')