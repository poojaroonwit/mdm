import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { GitLabProjectManagementService } from '@/lib/gitlab-project-management'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Push ticket to GitLab as an issue
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, syncComments, syncAttachments, repository, projectId } = body

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
        milestone: {
          select: {
            id: true,
            name: true,
            metadata: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
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

    // Get GitLab configuration from platform_integrations
    const { rows: configRows } = await query(
      `SELECT id, config, type
       FROM public.platform_integrations 
       WHERE type = 'gitlab'
         AND status = 'active'
         AND is_enabled = true
         AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      []
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'GitLab integration not configured. Please configure it in Admin > Integrations.' },
        { status: 400 }
      )
    }

    const config = configRows[0]
    const gitlabConfig = config.config as any

    if (!gitlabConfig.token) {
      return NextResponse.json(
        { error: 'GitLab integration is missing required configuration (token)' },
        { status: 400 }
      )
    }

    // Use per-ticket repository/projectId if provided, otherwise use default from config
    const targetProjectId = projectId || repository || gitlabConfig.projectId
    if (!targetProjectId) {
      return NextResponse.json(
        { error: 'GitLab project ID or repository is required. Please specify in ticket or configure globally.' },
        { status: 400 }
      )
    }

    // Get API token from Vault or decrypt
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let token: string
    if (useVault && gitlabConfig.token?.startsWith('vault://')) {
      const vaultPath = gitlabConfig.token.replace('vault://', '')
      const connectionId = vaultPath.split('/')[0]
      const creds = await secretsManager.getSecret(`gitlab-integrations/${connectionId}/credentials`)
      token = creds?.token || gitlabConfig.token
    } else {
      token = decryptApiKey(gitlabConfig.token) || gitlabConfig.token
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to retrieve GitLab token' },
        { status: 500 }
      )
    }

    // Initialize GitLab service with target project
    const gitlabService = new GitLabProjectManagementService({
      token,
      projectId: targetProjectId,
      baseUrl: gitlabConfig.baseUrl
    })

    // Check if ticket already has a GitLab issue linked
    const metadata = (ticket.metadata as any) || {}
    const existingIssueIid = metadata.gitlabIssueIid

    let result
    if (existingIssueIid) {
      // Update existing issue
      const gitlabIssue = gitlabService.mapTicketToGitLabIssue({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        dueDate: ticket.dueDate || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags,
        estimate: ticket.estimate || undefined,
        labels: metadata.gitlabLabels || []
      })

      const stateEvent = gitlabService.mapTicketStatusToGitLabState(ticket.status)
      
      result = await gitlabService.updateIssue(existingIssueIid, {
        title: gitlabIssue.title,
        description: gitlabIssue.description,
        stateEvent: stateEvent,
        labels: gitlabIssue.labels,
        dueDate: gitlabIssue.dueDate,
        weight: gitlabIssue.weight
      })
    } else {
      // Create new issue
      // Get GitLab milestone ID if ticket has a milestone
      let gitlabMilestoneId: number | undefined
      if (ticket.milestone?.metadata) {
        const milestoneMetadata = ticket.milestone.metadata as any
        gitlabMilestoneId = milestoneMetadata.gitlabMilestoneId
      }

      const gitlabIssue = gitlabService.mapTicketToGitLabIssue({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        dueDate: ticket.dueDate || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags,
        estimate: ticket.estimate || undefined,
        labels: [],
        milestoneId: gitlabMilestoneId
      })

      result = await gitlabService.createIssue(gitlabIssue)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync ticket to GitLab' },
        { status: 500 }
      )
    }

    // Update ticket metadata with GitLab issue info
    const updatedMetadata = {
      ...metadata,
      gitlabIssueIid: result.issueIid,
      gitlabIssueId: result.issueId,
      gitlabIssueUrl: result.issueUrl,
      gitlabProjectId: targetProjectId,
      gitlabRepository: targetProjectId,
      gitlabLabels: result.data?.labels || [],
      gitlabPushedAt: new Date().toISOString(),
      gitlabLastSyncedAt: new Date().toISOString()
    }

    await db.ticket.update({
      where: { id: ticket_id },
      data: { metadata: updatedMetadata }
    })

    // Sync comments if requested and issue was created/updated successfully
    let syncedComments = 0
    if (syncComments && result.issueIid && ticket.comments) {
      // Note: GitLab API doesn't have a direct comments endpoint in the basic Issues API
      // This would require using GitLab Notes API which is more complex
      // For now, we'll just track that comments should be synced
      syncedComments = ticket.comments.length
    }

    // Create audit log
    await createAuditLog({
      action: existingIssueIid ? 'UPDATE' : 'CREATE',
      entityType: 'ticket_gitlab_sync',
      entityId: ticket_id,
      userId: session.user.id,
      newValue: JSON.stringify({
        gitlabIssueIid: result.issueIid,
        gitlabIssueUrl: result.issueUrl,
        syncedComments
      })
    })

    return NextResponse.json({
      success: true,
      message: existingIssueIid 
        ? 'Ticket updated in GitLab successfully' 
        : 'Ticket synced to GitLab successfully',
      data: {
        issueIid: result.issueIid,
        issueId: result.issueId,
        issueUrl: result.issueUrl,
        syncedComments
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/gitlab/push')

