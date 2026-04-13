import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST /api/notifications/cleanup - Clean up expired notifications
async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    // Check if user has permission to cleanup notifications
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Use the database function to cleanup expired notifications
    const cleanupQuery = `
      SELECT cleanup_expired_notifications() as cleaned_count
    `;

    const { rows } = await query(cleanupQuery);
    const cleanedCount = parseInt(rows[0].cleaned_count);

  return NextResponse.json({
    success: true,
    cleanedCount,
    message: `Cleaned up ${cleanedCount} expired notifications`,
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/notifications/cleanup')
