import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'

// Add comment to ServiceDesk ticket
async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  let auditLogId: string | null = null
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { ticket_id, space_id, request_id, content, isPublic } = body

  if (!ticket_id || !space_id || !request_id || !content) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, request_id, and content are required' },
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

  // Create initial audit log
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    
    const auditResult = await createAuditLog({
      action: 'SERVICEDESK_COMMENT_ADD_ATTEMPTED',
      entityType: 'ServiceDeskIntegration',
      entityId: space_id,
      userId: session.user.id,
      newValue: { ticketId: ticket_id, request_id: request_id, contentLength: content?.length || 0 },
      ipAddress,
      userAgent
    })
    auditLogId = auditResult?.id || null
  } catch (auditError) {
    console.warn('Failed to create initial audit log:', auditError)
  }

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Add comment to ServiceDesk
  const result = await service.addComment(request_id, {
    content,
    isPublic: isPublic !== false
  })

  if (result.success) {
    // Update audit log on success
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_COMMENT_ADDED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          ticketId: ticket_id,
          request_id,
          duration: Date.now() - startTime,
          status: 'success'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Comment added to ServiceDesk successfully',
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
    // Update audit log on error
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_COMMENT_ADD_FAILED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          ticketId: ticket_id,
          request_id,
          error: result.error || 'Unknown error',
          duration: Date.now() - startTime,
          status: 'failed'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json(
      { error: result.error || 'Failed to add comment to ServiceDesk' },
      { status: 400 }
    )
  }
}

// Get comments from ServiceDesk ticket
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const space_id = searchParams.get('space_id')
  const request_id = searchParams.get('request_id')

  if (!space_id || !request_id) {
    return NextResponse.json(
      { error: 'space_id and request_id are required' },
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

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Get comments from ServiceDesk
  const result = await service.getComments(request_id)

  if (result.success) {
    return NextResponse.json({
      success: true,
      comments: result.data?.notes || result.data?.requests?.[0]?.notes || [],
      data: result.data
    })
  } else {
    return NextResponse.json(
      { error: result.error || 'Failed to get comments from ServiceDesk' },
      { status: 400 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/comments')
export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/comments')
