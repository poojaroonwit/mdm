import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const sql = `
    SELECT * FROM report_integrations
    WHERE created_by::text = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC
  `

  const result = await query(sql, [session.user.id])
  return NextResponse.json({ integrations: result.rows || [] })
}



export const GET = withErrorHandling(getHandler, 'GET GET /api/reports/integrations')