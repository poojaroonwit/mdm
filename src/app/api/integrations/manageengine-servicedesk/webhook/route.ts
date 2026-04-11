import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { createAuditLog } from '@/lib/audit'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { getServiceDeskWebhookSecret } from '@/lib/system-runtime-settings'

// Webhook endpoint to receive updates from ServiceDesk
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.text()
    const signature = request.headers.get('x-servicedesk-signature') || 
                     request.headers.get('x-webhook-signature')
    
    // Verify webhook signature if configured
    const webhookSecret = await getServiceDeskWebhookSecret()
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const payload = JSON.parse(body)
    const { event_type, request: serviceDeskRequest } = payload

    if (!event_type || !serviceDeskRequest?.id) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Find local ticket by ServiceDesk request ID
    const tickets = await db.ticket.findMany({
      where: {
        metadata: {
          path: ['serviceDeskRequestId'],
          equals: serviceDeskRequest.id.toString()
        }
      },
      include: {
        spaces: {
          include: {
            space: true
          }
        }
      }
    })

    if (tickets.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Ticket not found locally, skipping sync' 
      })
    }

    const ticket = tickets[0]
    const spaceId = ticket.spaces[0]?.spaceId || ticket.spaces[0]?.space?.id

    if (!spaceId) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Get ServiceDesk service
    const service = await getServiceDeskService(spaceId)
    if (!service) {
      return NextResponse.json({ error: 'ServiceDesk config not found' }, { status: 404 })
    }

    // Get full ticket details from ServiceDesk
    const ticketResult = await service.getTicket(serviceDeskRequest.id.toString())
    if (!ticketResult.success) {
      return NextResponse.json({ error: 'Failed to get ticket from ServiceDesk' }, { status: 500 })
    }

    const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]
    if (!serviceDeskTicket) {
      return NextResponse.json({ error: 'Ticket not found in ServiceDesk' }, { status: 404 })
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
        where: { id: ticket.id },
        data: updateData
      })
    }

    // Log sync activity
    await query(
      `INSERT INTO servicedesk_sync_logs 
       (ticket_id, space_id, sync_type, event_type, success, details, created_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, NOW())`,
      [
        ticket.id,
        spaceId,
        'webhook',
        event_type,
        true,
        JSON.stringify({ updated: Object.keys(updateData), requestId: serviceDeskRequest.id })
      ]
    ).catch(() => {}) // Ignore if table doesn't exist yet

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      ticketId: ticket.id,
      updated: Object.keys(updateData).length > 0
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/webhook error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
