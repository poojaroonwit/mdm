import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '../../middleware'

async function postHandler(request: NextRequest) {
    // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    // TODO: Add requireSpaceAccess check if spaceId is available

    const body = await request.json()
    const { operation, workflowIds = body.workflow_ids, data } = body

    if (!operation || !workflowIds || !Array.isArray(workflowIds) || workflowIds.length === 0) {
      return NextResponse.json(
        { error: 'Operation and workflowIds array are required' },
        { status: 400 }
      )
    }

    // Check permission
    const permission = await checkPermission({
      resource: 'workflows',
      action: operation === 'delete' ? 'delete' : 'update',
      spaceId: null,
    })

    if (!permission.allowed) {
      return NextResponse.json(
        { error: 'Forbidden', reason: permission.reason },
        { status: 403 }
      )
    }

    let result: any
    let affectedCount = 0

    switch (operation) {
      case 'delete':
        result = await query(
          `UPDATE workflows 
           SET deleted_at = NOW(), updated_at = NOW()
           WHERE id = ANY($1::uuid[])
           AND deleted_at IS NULL
           AND (created_by = $2 OR EXISTS (
             SELECT 1 FROM workflow_permissions wp
             WHERE wp.workflow_id = workflows.id
             AND wp.user_id = $2
             AND wp.permission = 'delete'
           ))`,
          [workflowIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status operation' },
            { status: 400 }
          )
        }

        result = await query(
          `UPDATE workflows 
           SET status = $1, updated_at = NOW()
           WHERE id = ANY($2::uuid[])
           AND deleted_at IS NULL
           AND (created_by = $3 OR EXISTS (
             SELECT 1 FROM workflow_permissions wp
             WHERE wp.workflow_id = workflows.id
             AND wp.user_id = $3
             AND wp.permission = 'edit'
           ))`,
          [data.status, workflowIds, session.user.id]
        )
        affectedCount = result.rowCount || 0
        break

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
    }

    // Log API request
    await logAPIRequest(
      session.user.id,
      'POST',
      '/api/v1/workflows/bulk',
      200,
      undefined
    )

  return NextResponse.json({
    success: true,
    affected: affectedCount,
    message: `Successfully ${operation}d ${affectedCount} workflow(s)`,
  })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/v1/workflows/bulk')

