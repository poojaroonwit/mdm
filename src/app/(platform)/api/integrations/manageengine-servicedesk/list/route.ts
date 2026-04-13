import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'

// List/Search tickets from ServiceDesk
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const space_id = searchParams.get('space_id')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const technician = searchParams.get('technician')
  const requester = searchParams.get('requester')
  const category = searchParams.get('category')
  const startIndex = parseInt(searchParams.get('start_index') || '0')
  const rowCount = parseInt(searchParams.get('row_count') || '50')

  if (!space_id) {
    return NextResponse.json(
      { error: 'space_id is required' },
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

  // Rate limiting check (optional for read-only endpoint)
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

  // Get search parameter
  const search = searchParams.get('search')

  // List tickets from ServiceDesk
  const result = await service.listTickets({
    status: status || undefined,
    priority: priority || undefined,
    technician: technician || undefined,
    requester: requester || undefined,
    category: category || undefined,
    startIndex,
    rowCount,
    searchFields: search ? { subject: { contains: search } } : undefined
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      tickets: result.data?.requests || [],
      total: result.data?.response_status?.total_count || 0,
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
      { error: result.error || 'Failed to list tickets from ServiceDesk' },
      { status: 400 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/list')
