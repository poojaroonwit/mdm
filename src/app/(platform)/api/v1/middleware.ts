import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware } from '@/shared/middleware/api-rate-limit'

/**
 * Apply rate limiting to v1 API routes
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimitMiddleware(request, {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  })
}
