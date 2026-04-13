import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { applyRateLimit } from '@/app/api/v1/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; reviewId: string }> }
) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug, reviewId } = await params

  // Check if user already marked this review as helpful
  const existing = await query(
    `SELECT id FROM plugin_review_helpful
     WHERE review_id = $1 AND user_id = $2`,
    [reviewId, session.user.id]
  )

  if (existing.rows.length > 0) {
    // Remove helpful vote
    await query(
      `DELETE FROM plugin_review_helpful
       WHERE review_id = $1 AND user_id = $2`,
      [reviewId, session.user.id]
    )

    // Update helpful count
    await query(
      `UPDATE plugin_reviews
       SET helpful_count = GREATEST(0, helpful_count - 1)
       WHERE id = $1`,
      [reviewId]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/marketplace/plugins/${slug}/reviews/${reviewId}/helpful`,
      200,
      undefined
    )

    return NextResponse.json({
      helpful: false,
      message: 'Helpful vote removed',
    })
  } else {
    // Add helpful vote
    await query(
      `INSERT INTO plugin_review_helpful (review_id, user_id)
       VALUES ($1, $2)`,
      [reviewId, session.user.id]
    )

    // Update helpful count
    await query(
      `UPDATE plugin_reviews
       SET helpful_count = helpful_count + 1
       WHERE id = $1`,
      [reviewId]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/marketplace/plugins/${slug}/reviews/${reviewId}/helpful`,
      200,
      undefined
    )

    return NextResponse.json({
      helpful: true,
      message: 'Marked as helpful',
    })
  }
}
