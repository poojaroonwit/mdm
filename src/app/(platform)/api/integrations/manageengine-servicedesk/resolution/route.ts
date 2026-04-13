import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'

// Set resolution for ServiceDesk ticket
async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { space_id, request_id, resolution, resolvedBy, resolvedTime } = body

  if (!space_id || !request_id || !resolution) {
    return NextResponse.json(
      { error: 'space_id, request_id, and resolution are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limiting check
  const rateLimitConfig = await getServiceDeskRateLimitConfig(space_id)
  const rateLimitResult = await checkServiceDeskRateLimit(space_id, session.user.id, rateLimitConfig)
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: rateLimitResult.reason,
        resetTime: rateLimitResult.resetTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetTime || 60),
          'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime || Date.now() + 60000)
        }
      }
    )
  }

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Set resolution in ServiceDesk
  const result = await service.setResolution(request_id, {
    resolution,
    resolvedBy: resolvedBy || session.user.email || undefined,
    resolvedTime: resolvedTime || new Date().toISOString()
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Resolution set in ServiceDesk successfully',
      data: result?.data || null,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }
    }, {
      headers: {
        'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime)
      }
    })
  } else {
    return NextResponse.json(
      { error: result.error || 'Failed to set resolution in ServiceDesk' },
      { status: 400 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/resolution')
