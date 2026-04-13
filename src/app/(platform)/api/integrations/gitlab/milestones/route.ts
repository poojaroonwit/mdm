import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { GitLabProjectManagementService } from '@/lib/gitlab-project-management'

// List GitLab milestones for a project
async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || searchParams.get('repository')
    const state = searchParams.get('state') as 'active' | 'closed' | undefined

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId or repository is required' },
        { status: 400 }
      )
    }

    // Get GitLab configuration
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
        { error: 'GitLab integration not configured' },
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

    // Get API token
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

    // Initialize GitLab service
    const gitlabService = new GitLabProjectManagementService({
      token,
      projectId,
      baseUrl: gitlabConfig.baseUrl
    })

    // List milestones
    const result = await gitlabService.listMilestones({
      state,
      perPage: 100
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list GitLab milestones' },
        { status: 500 }
      )
    }

    // Format milestones for frontend
    const milestones = (result.data || []).map((milestone: any) => ({
      id: milestone.id,
      iid: milestone.iid,
      title: milestone.title,
      description: milestone.description,
      state: milestone.state,
      dueDate: milestone.due_date,
      startDate: milestone.start_date,
      webUrl: milestone.web_url
    }))

    return NextResponse.json({
      success: true,
      milestones
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/gitlab/milestones')

