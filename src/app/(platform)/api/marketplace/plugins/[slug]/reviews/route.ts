import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'
import { checkPermission } from '@/shared/lib/security/permission-checker'
import { applyRateLimit } from '@/app/api/v1/middleware'

// Helper function to resolve slug to serviceId
async function resolveServiceId(slug: string): Promise<string | null> {
  // Check if slug is a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slug)) {
    return slug
  }
  
  // Look up by slug
  const result = await query(
    'SELECT id FROM service_registry WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  )
  
  return result.rows[0]?.id || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

  const { slug } = await params
  const serviceId = await resolveServiceId(slug)
  
  if (!serviceId) {
    return NextResponse.json(
      { error: 'Plugin not found' },
      { status: 404 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const sortBy = searchParams.get('sortBy') || searchParams.get('sort_by') || 'created_at'
  const sortOrder = searchParams.get('sortOrder') || searchParams.get('sort_order') || 'desc'

  // Get reviews
  const reviewsQuery = `
    SELECT 
      pr.id,
      pr.rating,
      pr.title,
      pr.comment,
      pr.helpful_count,
      pr.is_verified_install,
      pr.created_at,
      pr.updated_at,
      jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'avatar', u.avatar
      ) as user,
      jsonb_build_object(
        'id', s.id,
        'name', s.name
      ) as space,
      EXISTS(
        SELECT 1 FROM plugin_review_helpful prh
        WHERE prh.review_id = pr.id
        AND prh.user_id = $1
      ) as user_has_helpful
    FROM plugin_reviews pr
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN spaces s ON s.id = pr.space_id
    WHERE pr.service_id = $2
      AND pr.deleted_at IS NULL
    ORDER BY 
      CASE WHEN $3 = 'rating' AND $4 = 'asc' THEN pr.rating END ASC,
      CASE WHEN $3 = 'rating' AND $4 = 'desc' THEN pr.rating END DESC,
      CASE WHEN $3 = 'helpful_count' AND $4 = 'asc' THEN pr.helpful_count END ASC,
      CASE WHEN $3 = 'helpful_count' AND $4 = 'desc' THEN pr.helpful_count END DESC,
      CASE WHEN $3 = 'created_at' AND $4 = 'asc' THEN pr.created_at END ASC,
      CASE WHEN $3 = 'created_at' AND $4 = 'desc' THEN pr.created_at END DESC
    LIMIT $5 OFFSET $6
  `

  const reviewsResult = await query(reviewsQuery, [
    session.user.id,
    serviceId,
    sortBy,
    sortOrder,
    limit,
    offset,
  ])

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM plugin_reviews
     WHERE service_id = $1 AND deleted_at IS NULL`,
    [serviceId]
  )

  const total = parseInt(countResult.rows[0]?.total || '0')

  // Get rating distribution
  const distributionResult = await query(
    `SELECT 
      rating,
      COUNT(*) as count
     FROM plugin_reviews
     WHERE service_id = $1 AND deleted_at IS NULL
     GROUP BY rating
     ORDER BY rating DESC`,
    [serviceId]
  )

  await logAPIRequest(
    session.user.id,
    'GET',
    `/api/marketplace/plugins/${slug}/reviews`,
    200,
    undefined
  )

  return NextResponse.json({
    reviews: reviewsResult.rows.map((row: any) => ({
      id: row.id,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      helpfulCount: parseInt(row.helpful_count || '0'),
      isVerifiedInstall: row.is_verified_install,
      user: row.user,
      space: row.space,
      userHasHelpful: row.user_has_helpful,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ratingDistribution: distributionResult.rows.map((row: any) => ({
      rating: row.rating,
      count: parseInt(row.count),
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

  const { slug } = await params
  const serviceId = await resolveServiceId(slug)
  
  if (!serviceId) {
    return NextResponse.json(
      { error: 'Plugin not found' },
      { status: 404 }
    )
  }

  const body = await request.json()
  const { rating, title, comment, spaceId, space_id } = body
  const finalSpaceId = spaceId || space_id

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: 'Rating must be between 1 and 5' },
      { status: 400 }
    )
  }

  // Check if user already has a review for this service
  const existingReview = await query(
    `SELECT id FROM plugin_reviews
     WHERE service_id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [serviceId, session.user.id]
  )

  if (existingReview.rows.length > 0) {
    // Update existing review
    const updateResult = await query(
      `UPDATE plugin_reviews
       SET rating = $1,
           title = $2,
           comment = $3,
           space_id = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING id, rating, title, comment, helpful_count, is_verified_install, created_at, updated_at`,
      [
        rating,
        title || null,
        comment || null,
        finalSpaceId || null,
        existingReview.rows[0].id,
      ]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/marketplace/plugins/${slug}/reviews`,
      200,
      undefined
    )

    return NextResponse.json({
      review: {
        id: updateResult.rows[0].id,
        rating: updateResult.rows[0].rating,
        title: updateResult.rows[0].title,
        comment: updateResult.rows[0].comment,
        helpfulCount: parseInt(updateResult.rows[0].helpful_count || '0'),
        isVerifiedInstall: updateResult.rows[0].is_verified_install,
        createdAt: updateResult.rows[0].created_at,
        updatedAt: updateResult.rows[0].updated_at,
      },
      message: 'Review updated successfully',
    })
  } else {
    // Check if user has installed this service (for verified install badge)
    const installation = await query(
      `SELECT id FROM service_installations
       WHERE service_id = $1 AND installed_by = $2 AND deleted_at IS NULL`,
      [serviceId, session.user.id]
    )

    const isVerifiedInstall = installation.rows.length > 0

    // Create new review
    const insertResult = await query(
      `INSERT INTO plugin_reviews (
        service_id, user_id, space_id, rating, title, comment, is_verified_install
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, rating, title, comment, helpful_count, is_verified_install, created_at, updated_at`,
      [
        serviceId,
        session.user.id,
        finalSpaceId || null,
        rating,
        title || null,
        comment || null,
        isVerifiedInstall,
      ]
    )

    await logAPIRequest(
      session.user.id,
      'POST',
      `/api/marketplace/plugins/${slug}/reviews`,
      201,
      undefined
    )

    return NextResponse.json(
      {
        review: {
          id: insertResult.rows[0].id,
          rating: insertResult.rows[0].rating,
          title: insertResult.rows[0].title,
          comment: insertResult.rows[0].comment,
          helpfulCount: parseInt(insertResult.rows[0].helpful_count || '0'),
          isVerifiedInstall: insertResult.rows[0].is_verified_install,
          createdAt: insertResult.rows[0].created_at,
          updatedAt: insertResult.rows[0].updated_at,
        },
        message: 'Review created successfully',
      },
      { status: 201 }
    )
  }
}
