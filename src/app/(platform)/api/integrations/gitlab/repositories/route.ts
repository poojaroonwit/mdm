import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { GitLabProjectManagementService } from '@/lib/gitlab-project-management'

// List GitLab repositories/projects
async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

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

    // Initialize GitLab service (projectId not needed for listing projects)
    const gitlabService = new GitLabProjectManagementService({
      token,
      projectId: 'dummy', // Not used for listing
      baseUrl: gitlabConfig.baseUrl
    })

    // List projects
    const result = await gitlabService.listProjects({
      search,
      membership: true, // Only show projects user is member of
      orderBy: 'last_activity_at',
      sort: 'desc',
      perPage: 50
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to list GitLab repositories' },
        { status: 500 }
      )
    }

    // Format projects for frontend
    const repositories = (result.data || []).map((project: any) => ({
      id: project.id,
      projectId: project.path_with_namespace || `${project.namespace?.path}/${project.path}`,
      name: project.name,
      path: project.path_with_namespace || project.path,
      description: project.description,
      webUrl: project.web_url,
      defaultBranch: project.default_branch,
      visibility: project.visibility,
      lastActivityAt: project.last_activity_at
    }))

    return NextResponse.json({
      success: true,
      repositories
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/integrations/gitlab/repositories')

