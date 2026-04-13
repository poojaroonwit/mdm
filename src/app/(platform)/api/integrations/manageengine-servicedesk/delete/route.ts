import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'

// Delete a ServiceDesk ticket
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
  const { space_id, request_id, ticket_id } = body

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
      action: 'SERVICEDESK_TICKET_DELETE_ATTEMPTED',
      entityType: 'ServiceDeskIntegration',
      entityId: space_id,
      userId: session.user.id,
      newValue: { requestId: request_id, ticketId: ticket_id },
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

  // Delete ticket from ServiceDesk
  const result = await service.deleteTicket(request_id)

  if (result.success) {
    // Remove ServiceDesk request ID from local ticket metadata if provided
    if (ticket_id) {
      const ticket = await db.ticket.findUnique({
        where: { id: ticket_id }
      })

      if (ticket) {
        const metadata = (ticket.metadata as any) || {}
        delete metadata.serviceDeskRequestId
        delete metadata.serviceDeskPushedAt
        
        await db.ticket.update({
          where: { id: ticket_id },
          data: { metadata }
        })
      }
    }

    // Log deletion activity
    if (ticket_id) {
      await query(
        `INSERT INTO servicedesk_sync_logs 
         (ticket_id, space_id, sync_type, event_type, success, details, created_at)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())`,
        [
          ticket_id,
          space_id,
          'delete',
          'ticket_deleted',
          true,
          JSON.stringify({ requestId: request_id })
        ]
      ).catch(() => {}) // Ignore if table doesn't exist yet
    }

    // Update audit log on success
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_TICKET_DELETED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          requestId: request_id,
          ticketId: ticket_id,
          duration: Date.now() - startTime,
          status: 'success'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted from ServiceDesk successfully',
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
        action: 'SERVICEDESK_TICKET_DELETE_FAILED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          requestId: request_id,
          error: result.error || 'Unknown error',
          duration: Date.now() - startTime,
          status: 'failed'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json(
      { error: result.error || 'Failed to delete ticket from ServiceDesk' },
      { status: 400 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/delete')
