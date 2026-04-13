import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'

// Sync ticket from ServiceDesk (pull updates)
async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { ticket_id, space_id, request_id } = body

  if (!ticket_id || !space_id || !request_id) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, and request_id are required' },
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

  // Get ticket
  const ticket = await db.ticket.findUnique({
    where: { id: ticket_id }
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Get ticket details from ServiceDesk
  const ticketResult = await service.getTicket(request_id)
  if (!ticketResult.success) {
    return NextResponse.json(
      { error: ticketResult.error || 'Failed to get ticket from ServiceDesk' },
      { status: 400 }
    )
  }

  const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]
  if (!serviceDeskTicket) {
    return NextResponse.json(
      { error: 'Ticket not found in ServiceDesk' },
      { status: 404 }
    )
  }

  // Map ServiceDesk status to our status
  const statusMap: Record<string, string> = {
    'Open': 'BACKLOG',
    'In Progress': 'IN_PROGRESS',
    'Resolved': 'DONE',
    'Closed': 'CLOSED'
  }

  // Map ServiceDesk priority to our priority
  const priorityMap: Record<string, string> = {
    'Low': 'LOW',
    'Medium': 'MEDIUM',
    'High': 'HIGH',
    'Critical': 'URGENT'
  }

  // Update local ticket with ServiceDesk data
  const updateData: any = {}
  
  if (serviceDeskTicket.subject && serviceDeskTicket.subject !== ticket.title) {
    updateData.title = serviceDeskTicket.subject
  }
  
  if (serviceDeskTicket.description && serviceDeskTicket.description !== ticket.description) {
    updateData.description = serviceDeskTicket.description
  }
  
  if (serviceDeskTicket.status?.name) {
    const mappedStatus = statusMap[serviceDeskTicket.status.name] || ticket.status
    if (mappedStatus !== ticket.status) {
      updateData.status = mappedStatus
      if (mappedStatus === 'DONE' && !ticket.completedAt) {
        updateData.completedAt = new Date()
      }
    }
  }
  
  if (serviceDeskTicket.priority?.name) {
    const mappedPriority = priorityMap[serviceDeskTicket.priority.name] || ticket.priority
    if (mappedPriority !== ticket.priority) {
      updateData.priority = mappedPriority
    }
  }

  // Update ticket if there are changes
  if (Object.keys(updateData).length > 0) {
    await db.ticket.update({
      where: { id: ticket_id },
      data: updateData
    })
  }

  // Get and sync comments
  const commentsResult = await service.getComments(request_id)
  if (commentsResult.success) {
    const serviceDeskComments = commentsResult.data?.notes || commentsResult.data?.requests?.[0]?.notes || []
    // Store ServiceDesk request ID in ticket metadata for future syncs
    const metadata = (ticket.metadata as any) || {}
    metadata.serviceDeskRequestId = request_id
    metadata.lastSyncedAt = new Date().toISOString()
    metadata.serviceDeskComments = serviceDeskComments.length
    
    await db.ticket.update({
      where: { id: ticket_id },
      data: { metadata }
    })
  }

  // Log sync activity
  const updated = Object.keys(updateData).length > 0
  await query(
    `INSERT INTO servicedesk_sync_logs 
     (ticket_id, space_id, sync_type, event_type, success, details, created_at)
     VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())`,
    [
      ticket_id,
      space_id,
      'manual',
      'sync',
      true,
      JSON.stringify({ 
        updated, 
        updated_fields: Object.keys(updateData),
        requestId: request_id 
      })
    ]
  ).catch(() => {}) // Ignore if table doesn't exist yet

  return NextResponse.json({
    success: true,
    message: 'Ticket synced from ServiceDesk successfully',
    updated: updated,
    data: {
      ticket: serviceDeskTicket,
      comments: commentsResult.success ? (commentsResult.data?.notes || []) : []
    },
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
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/sync')
