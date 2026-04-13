import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { JiraService } from '@/lib/jira-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Sync ticket from Jira (pull updates)
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, issue_key } = body

  if (!ticket_id || !space_id || !issue_key) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, and issue_key are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(space_id, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get Jira configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_apikey_value, api_auth_username
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%Jira%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [space_id]
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'Jira integration not configured for this space' },
        { status: 400 }
      )
    }

    const config = configRows[0]
    
    // Get API credentials
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let apiToken: string
    let email: string
    
    if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
      const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
      const connectionId = vaultPath.split('/')[0]
      const creds = await secretsManager.getSecret(`jira-integrations/${connectionId}/credentials`)
      apiToken = creds?.apiToken || ''
      email = creds?.email || config.api_auth_username || ''
    } else {
      apiToken = decryptApiKey(config.api_auth_apikey_value) || ''
      email = decryptApiKey(config.api_auth_username || '') || config.api_auth_username || ''
    }

    if (!apiToken || !email) {
      return NextResponse.json(
        { error: 'Failed to retrieve Jira credentials' },
        { status: 500 }
      )
    }

    // Initialize Jira service
    const jiraService = new JiraService({
      baseUrl: config.api_url,
      email,
      apiToken
    })

    // Get issue from Jira
    const issueResult = await jiraService.getIssue(issue_key)
    if (!issueResult.success || !issueResult.data) {
      return NextResponse.json(
        { error: issueResult.error || 'Failed to get issue from Jira' },
        { status: 400 }
      )
    }

    const jiraIssue = issueResult.data
    const fields = jiraIssue.fields || {}

    // Map Jira status to our status
    const statusMap: Record<string, string> = {
      'To Do': 'BACKLOG',
      'In Progress': 'IN_PROGRESS',
      'Done': 'DONE',
      'Closed': 'CANCELLED',
      'Resolved': 'DONE'
    }

    // Map Jira priority to our priority
    const priorityMap: Record<string, string> = {
      'Lowest': 'LOW',
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
      'Highest': 'URGENT'
    }

    // Update local ticket with Jira data
    const updateData: any = {}
    
    if (fields.summary && fields.summary !== ticket.title) {
      updateData.title = fields.summary
    }
    
    // Extract description from Jira's ADF format
    let description = ''
    if (fields.description) {
      if (typeof fields.description === 'string') {
        description = fields.description
      } else if (fields.description.content) {
        // Parse Atlassian Document Format
        const extractText = (content: any): string => {
          if (typeof content === 'string') return content
          if (Array.isArray(content)) {
            return content.map((item: any) => {
              if (item.type === 'text') return item.text || ''
              if (item.content) return extractText(item.content)
              return ''
            }).join(' ')
          }
          return ''
        }
        description = extractText(fields.description.content)
      }
    }
    
    if (description && description !== ticket.description) {
      updateData.description = description
    }
    
    if (fields.status?.name) {
      const mappedStatus = statusMap[fields.status.name] || jiraService.mapJiraStatusToTicketStatus(fields.status.name)
      if (mappedStatus !== ticket.status) {
        updateData.status = mappedStatus
      }
    }
    
    if (fields.priority?.name) {
      const mappedPriority = priorityMap[fields.priority.name] || 'MEDIUM'
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

      // Update metadata
      const metadata = (ticket.metadata as any) || {}
      await db.ticket.update({
        where: { id: ticket_id },
        data: {
          metadata: {
            ...metadata,
            jiraLastSyncedAt: new Date().toISOString()
          }
        }
      })

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ticket_jira_sync',
        entityId: ticket_id,
        userId: session.user.id,
        newValue: JSON.stringify(updateData)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket synced from Jira successfully',
      updated: Object.keys(updateData).length > 0,
      data: {
        issueKey: issueResult.issueKey,
        issueUrl: issueResult.issueUrl
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/jira/sync')

