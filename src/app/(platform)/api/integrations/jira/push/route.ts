import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { JiraService } from '@/lib/jira-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Push ticket to Jira as an issue
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, syncComments, projectKey, issueType } = body

  if (!ticket_id || !space_id) {
    return NextResponse.json(
      { error: 'ticket_id and space_id are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(space_id, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        creator: {
          select: {
            email: true,
            name: true
          }
        },
        tags: true,
        attributes: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        comments: syncComments ? {
          include: {
            author: {
              select: {
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        } : false
      }
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
    
    // Get API credentials from Vault or decrypt
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
      apiToken,
      projectKey: projectKey
    })

    // Check if ticket already has a Jira issue linked
    const metadata = (ticket.metadata as any) || {}
    const existingIssueKey = metadata.jiraIssueKey

    let result
    if (existingIssueKey) {
      // Update existing issue
      const jiraIssue = jiraService.mapTicketToJiraIssue({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags,
        projectKey: projectKey || metadata.jiraProjectKey,
        issueType: issueType || metadata.jiraIssueType
      })

      result = await jiraService.updateIssue(existingIssueKey, {
        summary: jiraIssue.summary,
        description: jiraIssue.description,
        priority: jiraIssue.priority,
        labels: jiraIssue.labels
      })
    } else {
      // Create new issue
      const jiraIssue = jiraService.mapTicketToJiraIssue({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags,
        projectKey: projectKey,
        issueType: issueType || 'Task'
      })

      result = await jiraService.createIssue(jiraIssue)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync ticket to Jira' },
        { status: 500 }
      )
    }

    // Update ticket metadata with Jira issue info
    const updatedMetadata = {
      ...metadata,
      jiraIssueKey: result.issueKey,
      jiraIssueId: result.issueId,
      jiraIssueUrl: result.issueUrl,
      jiraProjectKey: projectKey || metadata.jiraProjectKey,
      jiraIssueType: issueType || metadata.jiraIssueType || 'Task',
      jiraPushedAt: new Date().toISOString(),
      jiraLastSyncedAt: new Date().toISOString()
    }

    await db.ticket.update({
      where: { id: ticket_id },
      data: { metadata: updatedMetadata }
    })

    // Sync comments if requested and issue was created/updated successfully
    let syncedComments = 0
    if (syncComments && result.issueKey && ticket.comments) {
      for (const comment of ticket.comments) {
        try {
          await jiraService.addComment(result.issueKey, {
            body: `${(comment as any).author?.name || 'User'}: ${comment.content}`
          })
          syncedComments++
        } catch (error) {
          console.error('Failed to sync comment:', error)
        }
      }
    }

    // Create audit log
    await createAuditLog({
      action: existingIssueKey ? 'UPDATE' : 'CREATE',
      entityType: 'ticket_jira_sync',
      entityId: ticket_id,
      userId: session.user.id,
      newValue: JSON.stringify({
        jiraIssueKey: result.issueKey,
        jiraIssueUrl: result.issueUrl,
        syncedComments
      })
    })

    return NextResponse.json({
      success: true,
      message: existingIssueKey 
        ? 'Ticket updated in Jira successfully' 
        : 'Ticket synced to Jira successfully',
      data: {
        issueKey: result.issueKey,
        issueId: result.issueId,
        issueUrl: result.issueUrl,
        syncedComments
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/jira/push')

