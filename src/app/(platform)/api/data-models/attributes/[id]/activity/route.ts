import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: attributeId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get attribute activity from audit logs
    const activityQuery = `
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_value,
        al.new_value,
        al.created_at,
        al.user_id,
        u.name as user_name,
        u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.entity_type = 'attribute' 
        AND al.entity_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `

    const { rows: activities } = await query(activityQuery, [attributeId, limit, offset])

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      WHERE entity_type = 'attribute' AND entity_id = $1
    `
    const { rows: countResult } = await query(countQuery, [attributeId])
    const total = parseInt(countResult[0].total)

    // Format activities for display
    const formattedActivities = activities.map(activity => {
      let details = ''
      let action = activity.action

      // Parse old and new values
      const oldValue = activity.old_value ? JSON.parse(activity.old_value) : null
      const newValue = activity.new_value ? JSON.parse(activity.new_value) : null

      // Generate meaningful details based on the action and values
      switch (activity.action) {
        case 'CREATE':
          details = `Attribute created with type "${newValue?.type || 'unknown'}"`
          action = 'Created'
          break
        case 'UPDATE':
          if (oldValue && newValue) {
            const changes = []
            if (oldValue.name !== newValue.name) {
              changes.push(`name from "${oldValue.name}" to "${newValue.name}"`)
            }

            if (oldValue.display_name !== newValue.display_name) {
              changes.push(`display name from "${oldValue.display_name}" to "${newValue.display_name}"`)
            }
            if (oldValue.type !== newValue.type) {
              changes.push(`type from "${oldValue.type}" to "${newValue.type}"`)
            }
            if (oldValue.is_required !== newValue.is_required) {
              changes.push(`required status from ${oldValue.is_required} to ${newValue.is_required}`)
            }
            if (oldValue.is_unique !== newValue.is_unique) {
              changes.push(`unique status from ${oldValue.is_unique} to ${newValue.is_unique}`)
            }
            if (oldValue.default_value !== newValue.default_value) {
              changes.push(`default value from "${oldValue.default_value}" to "${newValue.default_value}"`)
            }
            details = changes.length > 0 ? `Changed ${changes.join(', ')}` : 'Attribute updated'
          } else {
            details = 'Attribute updated'
          }
          action = 'Modified'
          break
        case 'DELETE':
          details = 'Attribute deleted'
          action = 'Deleted'
          break
        default:
          details = `Action: ${activity.action}`
      }

      return {
        id: activity.id,
        action,
        user: activity.user_name || 'Unknown User',
        timestamp: activity.created_at,
        details
      }
    })

    return NextResponse.json({
      activities: formattedActivities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/data-models/attributes/[id]/activity/route.ts')