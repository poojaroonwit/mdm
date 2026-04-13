import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { query } from '@/lib/db'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const body = await request.text()
    const payload = JSON.parse(body)

    // Verify webhook signature if configured
    const webhookSecret = headersList.get('x-webhook-secret')
    if (webhookSecret) {
      // Jira webhook verification logic would go here
      // For now, we'll accept all webhooks
    }

    // Process Jira webhook events
    const eventType = payload.webhookEvent
    const issue = payload.issue

    if (!issue || !issue.key) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Find ticket linked to this Jira issue
    const { rows: ticketRows } = await query(
      `SELECT id FROM tickets 
       WHERE metadata->>'jiraIssueKey' = $1 
         AND deleted_at IS NULL
       LIMIT 1`,
      [issue.key]
    )

    if (ticketRows.length === 0) {
      // No linked ticket, just acknowledge
      return NextResponse.json({ success: true, message: 'No linked ticket found' })
    }

    const ticketId = ticketRows[0].id

    // Handle different event types
    switch (eventType) {
      case 'jira:issue_updated':
        // Update ticket based on Jira issue changes
        const changelog = payload.changelog
        if (changelog && changelog.items) {
          for (const item of changelog.items) {
            if (item.field === 'status') {
              // Status changed - update ticket status
              const statusMap: Record<string, string> = {
                'To Do': 'BACKLOG',
                'In Progress': 'IN_PROGRESS',
                'Done': 'DONE',
                'Closed': 'CANCELLED',
                'Resolved': 'DONE'
              }
              const newStatus = statusMap[item.toString] || 'BACKLOG'
              await db.ticket.update({
                where: { id: ticketId },
                data: { status: newStatus }
              })
            }
            // Handle other field changes as needed
          }
        }
        break

      case 'jira:issue_created':
        // Issue created - already handled by push
        break

      case 'comment_created':
      case 'comment_updated':
        // Comment added/updated - could sync back to ticket
        break

      default:
        // Other events - log but don't process
        console.log('Unhandled Jira webhook event:', eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing Jira webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
