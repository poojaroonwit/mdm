// @ts-ignore - @gitbeaker/node has incorrect type definitions
// The package structure has changed, so we need to create a wrapper
let GitLab: any
try {
  const GitLabModule = require('@gitbeaker/node')
  // Try to find a constructor or create a wrapper
  if (typeof GitLabModule === 'function') {
    GitLab = GitLabModule
  } else if (GitLabModule.default && typeof GitLabModule.default === 'function') {
    GitLab = GitLabModule.default
  } else if (GitLabModule.GitLab && typeof GitLabModule.GitLab === 'function') {
    GitLab = GitLabModule.GitLab
  } else {
    // Create a wrapper class that uses the package's API modules
    GitLab = class {
      constructor(options: any) {
        // Store options for later use
        this._options = options
        // Bind API modules from the package
        const api = GitLabModule
        this.Projects = api.Projects || {}
        this.Issues = api.Issues || {}
        this.ProjectMilestones = api.ProjectMilestones || {}
        this.Tags = api.Tags || {}
        this.Releases = api.Releases || {}
      }
      _options: any
      Projects: any
      Issues: any
      ProjectMilestones: any
      Tags: any
      Releases: any
    }
  }
} catch (e) {
  console.error('Failed to load @gitbeaker/node:', e)
  // Fallback: create a stub class
  GitLab = class {
    constructor(options: any) {
      throw new Error('@gitbeaker/node package is not properly installed or configured')
    }
  }
}

export interface GitLabProjectManagementConfig {
  token: string // GitLab personal access token or project access token
  projectId: string // GitLab project ID (e.g., "group/project" or numeric ID)
  baseUrl?: string // Optional: GitLab instance URL (defaults to gitlab.com)
}

export interface GitLabIssue {
  title: string
  description?: string
  labels?: string[]
  assigneeIds?: number[]
  milestoneId?: number
  weight?: number
  dueDate?: string // ISO 8601 date (YYYY-MM-DD)
  confidential?: boolean
}

export interface GitLabIssueResponse {
  success: boolean
  issueIid?: number // GitLab issue IID (internal ID)
  issueId?: number // GitLab issue ID
  issueUrl?: string
  message?: string
  error?: string
  data?: any
}

export interface GitLabComment {
  body: string
}

export interface GitLabIssueUpdate {
  title?: string
  description?: string
  stateEvent?: 'close' | 'reopen'
  labels?: string[]
  assigneeIds?: number[]
  milestoneId?: number
  weight?: number
  dueDate?: string
  confidential?: boolean
}

export class GitLabProjectManagementService {
  private config: GitLabProjectManagementConfig
  private gitlab: typeof GitLab

  constructor(config: GitLabProjectManagementConfig) {
    this.config = config
    this.gitlab = new GitLab({
      token: config.token,
      host: config.baseUrl || 'https://gitlab.com'
    })
  }

  /**
   * Test the connection to GitLab
   */
  async testConnection(): Promise<GitLabIssueResponse> {
    try {
      // Try to fetch project info
      const project = await this.gitlab.Projects.show(this.config.projectId)
      
      return {
        success: true,
        message: `Connected to GitLab project: ${project.name || project.path_with_namespace}`,
        data: {
          projectId: project.id,
          projectName: project.name,
          projectPath: project.path_with_namespace
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to GitLab'
      }
    }
  }

  /**
   * Create a GitLab issue from a ticket
   */
  async createIssue(issue: GitLabIssue): Promise<GitLabIssueResponse> {
    try {
      const issueData: any = {
        title: issue.title,
        description: issue.description || '',
      }

      if (issue.labels && issue.labels.length > 0) {
        issueData.labels = issue.labels.join(',')
      }

      if (issue.assigneeIds && issue.assigneeIds.length > 0) {
        issueData.assigneeIds = issue.assigneeIds
      }

      if (issue.milestoneId) {
        issueData.milestoneId = issue.milestoneId
      }

      if (issue.weight !== undefined) {
        issueData.weight = issue.weight
      }

      if (issue.dueDate) {
        issueData.dueDate = issue.dueDate
      }

      if (issue.confidential !== undefined) {
        issueData.confidential = issue.confidential
      }

      const createdIssue = await this.gitlab.Issues.create(this.config.projectId, issueData)

      return {
        success: true,
        issueIid: createdIssue.iid,
        issueId: createdIssue.id,
        issueUrl: createdIssue.web_url,
        message: 'Issue created successfully',
        data: createdIssue
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create GitLab issue'
      }
    }
  }

  /**
   * Update a GitLab issue
   */
  async updateIssue(issueIid: number, update: GitLabIssueUpdate): Promise<GitLabIssueResponse> {
    try {
      const updateData: any = {}

      if (update.title) {
        updateData.title = update.title
      }

      if (update.description !== undefined) {
        updateData.description = update.description
      }

      if (update.stateEvent) {
        updateData.stateEvent = update.stateEvent
      }

      if (update.labels) {
        updateData.labels = update.labels.join(',')
      }

      if (update.assigneeIds) {
        updateData.assigneeIds = update.assigneeIds
      }

      if (update.milestoneId !== undefined) {
        updateData.milestoneId = update.milestoneId
      }

      if (update.weight !== undefined) {
        updateData.weight = update.weight
      }

      if (update.dueDate !== undefined) {
        updateData.dueDate = update.dueDate
      }

      if (update.confidential !== undefined) {
        updateData.confidential = update.confidential
      }

      const updatedIssue = await this.gitlab.Issues.edit(
        this.config.projectId,
        issueIid,
        updateData
      )

      return {
        success: true,
        issueIid: updatedIssue.iid,
        issueId: updatedIssue.id,
        issueUrl: updatedIssue.web_url,
        message: 'Issue updated successfully',
        data: updatedIssue
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update GitLab issue'
      }
    }
  }

  /**
   * Get a GitLab issue by IID
   */
  async getIssue(issueIid: number): Promise<GitLabIssueResponse> {
    try {
      const issue = await this.gitlab.Issues.show(this.config.projectId, issueIid)

      return {
        success: true,
        issueIid: issue.iid,
        issueId: issue.id,
        issueUrl: issue.web_url,
        data: issue
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch GitLab issue'
      }
    }
  }

  /**
   * List all issues for the project
   */
  async listIssues(options?: {
    state?: 'opened' | 'closed'
    labels?: string[]
    assigneeId?: number
    milestone?: string
    search?: string
    page?: number
    perPage?: number
  }): Promise<GitLabIssueResponse> {
    try {
      const issues = await this.gitlab.Issues.all(this.config.projectId, options || {})

      return {
        success: true,
        message: `Found ${Array.isArray(issues) ? issues.length : 0} issues`,
        data: issues
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list GitLab issues'
      }
    }
  }

  /**
   * List all projects/repositories accessible with the token
   */
  async listProjects(options?: {
    search?: string
    membership?: boolean
    orderBy?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at'
    sort?: 'asc' | 'desc'
    page?: number
    perPage?: number
  }): Promise<GitLabIssueResponse> {
    try {
      const projects = await this.gitlab.Projects.all(options || {})

      return {
        success: true,
        message: `Found ${Array.isArray(projects) ? projects.length : 0} projects`,
        data: projects
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list GitLab projects'
      }
    }
  }

  /**
   * List all milestones for a project
   */
  async listMilestones(options?: {
    state?: 'active' | 'closed'
    search?: string
    page?: number
    perPage?: number
  }): Promise<GitLabIssueResponse> {
    try {
      const milestones = await this.gitlab.ProjectMilestones.all(this.config.projectId, options || {})

      return {
        success: true,
        message: `Found ${Array.isArray(milestones) ? milestones.length : 0} milestones`,
        data: milestones
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list GitLab milestones'
      }
    }
  }

  /**
   * Create a milestone in GitLab
   */
  async createMilestone(name: string, options?: {
    description?: string
    dueDate?: string
    startDate?: string
  }): Promise<GitLabIssueResponse> {
    try {
      const milestoneData: any = {
        title: name
      }

      if (options?.description) {
        milestoneData.description = options.description
      }

      if (options?.dueDate) {
        milestoneData.dueDate = options.dueDate
      }

      if (options?.startDate) {
        milestoneData.startDate = options.startDate
      }

      const milestone = await this.gitlab.ProjectMilestones.create(this.config.projectId, milestoneData)

      return {
        success: true,
        message: 'Milestone created successfully',
        data: milestone
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create GitLab milestone'
      }
    }
  }

  /**
   * List all releases for a project
   */
  async listReleases(options?: {
    page?: number
    perPage?: number
  }): Promise<GitLabIssueResponse> {
    try {
      const releases = await this.gitlab.Releases.all(this.config.projectId, options || {})

      return {
        success: true,
        message: `Found ${Array.isArray(releases) ? releases.length : 0} releases`,
        data: releases
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list GitLab releases'
      }
    }
  }

  /**
   * Create a release in GitLab
   */
  async createRelease(tagName: string, options?: {
    name?: string
    description?: string
    ref?: string
    milestones?: string[]
  }): Promise<GitLabIssueResponse> {
    try {
      const releaseData: any = {
        tag_name: tagName
      }

      if (options?.name) {
        releaseData.name = options.name
      }

      if (options?.description) {
        releaseData.description = options.description
      }

      if (options?.ref) {
        releaseData.ref = options.ref
      } else {
        releaseData.ref = 'main' // Default to main branch
      }

      if (options?.milestones && options.milestones.length > 0) {
        releaseData.milestones = options.milestones
      }

      const release = await this.gitlab.Releases.create(this.config.projectId, releaseData)

      return {
        success: true,
        message: 'Release created successfully',
        data: release
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create GitLab release'
      }
    }
  }

  /**
   * List all tags for a project
   */
  async listTags(options?: {
    search?: string
    page?: number
    perPage?: number
  }): Promise<GitLabIssueResponse> {
    try {
      const tags = await this.gitlab.Tags.all(this.config.projectId, options || {})

      return {
        success: true,
        message: `Found ${Array.isArray(tags) ? tags.length : 0} tags`,
        data: tags
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list GitLab tags'
      }
    }
  }

  /**
   * Map ticket data to GitLab issue format
   */
  mapTicketToGitLabIssue(ticket: {
    title: string
    description?: string | null
    priority?: string
    status?: string
    dueDate?: string | Date | null
    assignees?: Array<{ user?: { email?: string } }>
    tags?: Array<{ name?: string }>
    estimate?: number | null
    labels?: string[]
    milestoneId?: number
  }): GitLabIssue {
    // Map priority to GitLab labels
    const labels: string[] = []
    if (ticket.priority) {
      labels.push(`priority:${ticket.priority.toLowerCase()}`)
    }
    if (ticket.status) {
      labels.push(`status:${ticket.status.toLowerCase()}`)
    }
    if (ticket.tags) {
      ticket.tags.forEach(tag => {
        if (tag.name) labels.push(tag.name)
      })
    }
    if (ticket.labels) {
      labels.push(...ticket.labels)
    }

    // Format due date
    let dueDate: string | undefined
    if (ticket.dueDate) {
      const date = ticket.dueDate instanceof Date 
        ? ticket.dueDate 
        : new Date(ticket.dueDate)
      dueDate = date.toISOString().split('T')[0] // YYYY-MM-DD format
    }

    // Build description with metadata
    let description = ticket.description || ''
    if (ticket.estimate) {
      description += `\n\n**Estimate:** ${ticket.estimate} story points`
    }

    return {
      title: ticket.title,
      description: description.trim() || undefined,
      labels: labels.length > 0 ? labels : undefined,
      weight: ticket.estimate || undefined,
      dueDate,
      milestoneId: ticket.milestoneId
    }
  }

  /**
   * Map ticket status to GitLab issue state
   */
  mapTicketStatusToGitLabState(status: string): 'close' | 'reopen' | undefined {
    const closedStatuses = ['DONE', 'CANCELLED', 'closed']
    const openStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'open']
    
    if (closedStatuses.includes(status.toUpperCase())) {
      return 'close'
    } else if (openStatuses.includes(status.toUpperCase())) {
      return 'reopen'
    }
    
    return undefined
  }
}

