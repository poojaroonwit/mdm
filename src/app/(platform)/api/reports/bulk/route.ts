import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { auditLogger } from '@/lib/utils/audit-logger'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { action, report_ids, ...actionData } = body

  if (!action || !report_ids || !Array.isArray(report_ids) || report_ids.length === 0) {
    return NextResponse.json({ error: 'Action and report_ids are required' }, { status: 400 })
  }

  let result: any

  switch (action) {
    case 'delete':
      // Check ownership
      const ownershipCheck = await query(
        `SELECT id FROM reports 
         WHERE id = ANY($1::uuid[]) 
         AND (created_by::text = $2 OR EXISTS (
           SELECT 1 FROM report_permissions 
           WHERE report_id = reports.id 
           AND (
             user_id::text = $2 OR
             group_id::text IN (SELECT group_id::text FROM user_group_members WHERE user_id::text = $2)
           )
           AND (permission = 'delete' OR permission = 'admin')
         ))`,
        [report_ids, session.user.id]
      )

      if (ownershipCheck.rows.length !== report_ids.length) {
        return NextResponse.json({ error: 'Not authorized to delete some reports' }, { status: 403 })
      }

      result = await query(
        `UPDATE reports 
         SET deleted_at = NOW() 
         WHERE id = ANY($1::uuid[]) 
         AND (created_by::text = $2 OR EXISTS (
           SELECT 1 FROM report_permissions 
           WHERE report_id = reports.id 
           AND (
             user_id::text = $2 OR
             group_id::text IN (SELECT group_id::text FROM user_group_members WHERE user_id::text = $2)
           )
           AND (permission = 'delete' OR permission = 'admin')
         ))`,
        [report_ids, session.user.id]
      )
      
      // Log audit events for each deleted report
      for (const reportId of report_ids) {
        auditLogger.reportDeleted(reportId)
      }
      break

    case 'update_status':
      if (actionData.is_active === undefined) {
        return NextResponse.json({ error: 'is_active is required' }, { status: 400 })
      }

      result = await query(
        `UPDATE reports 
         SET is_active = $1, updated_at = NOW() 
         WHERE id = ANY($2::uuid[]) 
         AND (created_by::text = $3 OR EXISTS (
           SELECT 1 FROM report_permissions 
           WHERE report_id = reports.id 
           AND (
             user_id::text = $3 OR
             group_id::text IN (SELECT group_id::text FROM user_group_members WHERE user_id::text = $3)
           )
           AND (permission = 'edit' OR permission = 'admin')
         ))`,
        [actionData.is_active, report_ids, session.user.id]
      )
      break

    case 'move':
      if (!actionData.category_id && !actionData.folder_id) {
        return NextResponse.json({ error: 'category_id or folder_id is required' }, { status: 400 })
      }

      result = await query(
        `UPDATE reports 
         SET category_id = COALESCE($1, category_id),
             folder_id = COALESCE($2, folder_id),
             updated_at = NOW() 
         WHERE id = ANY($3::uuid[]) 
         AND (created_by::text = $4 OR EXISTS (
           SELECT 1 FROM report_permissions 
           WHERE report_id = reports.id 
           AND (
             user_id::text = $4 OR
             group_id::text IN (SELECT group_id::text FROM user_group_members WHERE user_id::text = $4)
           )
           AND (permission = 'edit' OR permission = 'admin')
         ))`,
        [
          actionData.category_id || null,
          actionData.folder_id || null,
          report_ids,
          session.user.id
        ]
      )
      break

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ 
    success: true, 
    affected: result.rowCount || 0,
    message: `Successfully ${action}d ${result.rowCount || 0} report(s)`
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/reports/bulk')
