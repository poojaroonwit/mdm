import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST /api/notifications/mark-all-read - Mark all notifications as read for the current user
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Use the database function to mark all notifications as read
    const markAllReadQuery = `
      SELECT mark_all_notifications_read($1) as updated_count
    `;

    const { rows } = await query(markAllReadQuery, [session.user.id]);
    const updatedCount = parseInt(rows[0].updated_count);

  return NextResponse.json({
    success: true,
    updatedCount,
    message: `Marked ${updatedCount} notifications as read`,
  })
}



export const POST = withErrorHandling(postHandler, 'POST POST /api/notifications/mark-all-read')