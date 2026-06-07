import type {
  JiraComment,
  JiraConfig,
  JiraIssue,
  JiraResponse,
  TicketToJiraInput,
} from './jira-service/types'
import { mapJiraStatusToTicketStatus, mapTicketToJiraIssue } from './jira-service/mappers'
import * as projectMetadata from './jira-service/project-metadata'

export type {
  JiraAttachment,
  JiraComment,
  JiraConfig,
  JiraIssue,
  JiraResponse,
  TicketToJiraInput,
} from './jira-service/types'
export class JiraService {
  private config: JiraConfig
  private enableRetry: boolean = true
  private authHeader: string

  constructor(config: JiraConfig, options?: { enableRetry?: boolean }) {
    this.config = config
    // Ensure baseUrl doesn't end with /
    this.config.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.enableRetry = options?.enableRetry !== false
    
    // Create Basic Auth header (email:apiToken base64 encoded)
    const credentials = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')
    this.authHeader = `Basic ${credentials}`
  }

  /**
   * Internal method to execute fetch with retry logic
   */
  private async executeFetch(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    if (!this.enableRetry) {
      return fetch(url, options)
    }

    const { executeWithRetry } = await import('./servicedesk-retry')
    
    return executeWithRetry(async () => {
      const response = await fetch(url, options)
      
      // If rate limited, throw to trigger retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (retryAfter) {
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
        }
        throw { status: 429, response }
      }
      
      return response
    })
  }

  /**
   * Test the connection to Jira
   */
  async testConnection(): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/myself`
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: `Connected as ${data.displayName || data.emailAddress}`,
          data
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Connection failed: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<JiraResponse> {
    return projectMetadata.getProjects(this.config, this.authHeader, this.executeFetch.bind(this))
  }

  /**
   * Get issue types for a project
   */
  async getIssueTypes(projectKey?: string): Promise<JiraResponse> {
    return projectMetadata.getIssueTypes(this.config, this.authHeader, this.executeFetch.bind(this), projectKey)
  }

  /**
   * Create an issue in Jira
   */
  async createIssue(issue: JiraIssue): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue`
      
      // Map priority from our system to Jira
      const priorityMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'URGENT': 'Highest'
      }

      const projectKey = issue.projectKey || this.config.projectKey
      if (!projectKey) {
        return {
          success: false,
          error: 'Project key is required'
        }
      }

      // Build Jira issue payload
      const payload: any = {
        fields: {
          project: {
            key: projectKey
          },
          summary: issue.summary,
          description: issue.description ? {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: issue.description
              }]
            }]
          } : undefined,
          issuetype: {
            name: issue.issueType || 'Task'
          }
        }
      }

      // Add priority if provided
      if (issue.priority) {
        const jiraPriority = priorityMap[issue.priority] || issue.priority
        payload.fields.priority = { name: jiraPriority }
      }

      // Add assignee if provided
      if (issue.assignee) {
        // Try to find user by email or account ID
        payload.fields.assignee = { accountId: issue.assignee }
      }

      // Add labels if provided
      if (issue.labels && issue.labels.length > 0) {
        payload.fields.labels = issue.labels
      }

      // Add due date if provided
      if (issue.dueDate) {
        payload.fields.duedate = issue.dueDate.split('T')[0] // YYYY-MM-DD format
      }

      // Add custom fields
      if (issue.customFields) {
        Object.assign(payload.fields, issue.customFields)
      }

      // Remove undefined fields
      Object.keys(payload.fields).forEach(key => {
        if (payload.fields[key] === undefined) {
          delete payload.fields[key]
        }
      })

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          issueKey: data.key,
          issueId: data.id,
          issueUrl: `${this.config.baseUrl}/browse/${data.key}`,
          message: 'Issue created successfully',
          data
        }
      } else {
        const errorData = await response.json().catch(async () => ({ errorMessages: [await response.text()] }))
        return {
          success: false,
          error: `Failed to create issue: ${errorData.errorMessages?.join(', ') || response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create issue'
      }
    }
  }

  /**
   * Update an issue in Jira
   */
  async updateIssue(issueKey: string, updates: Partial<JiraIssue>): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${issueKey}`
      
      const priorityMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'URGENT': 'Highest'
      }

      const fields: any = {}

      if (updates.summary) {
        fields.summary = updates.summary
      }

      if (updates.description !== undefined) {
        fields.description = updates.description ? {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: updates.description
            }]
          }]
        } : null
      }

      if (updates.priority) {
        const jiraPriority = priorityMap[updates.priority] || updates.priority
        fields.priority = { name: jiraPriority }
      }

      if (updates.assignee) {
        fields.assignee = { accountId: updates.assignee }
      }

      if (updates.labels) {
        fields.labels = updates.labels
      }

      if (updates.dueDate) {
        fields.duedate = updates.dueDate.split('T')[0]
      }

      if (updates.customFields) {
        Object.assign(fields, updates.customFields)
      }

      const payload = { fields }

      const response = await this.executeFetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return {
          success: true,
          issueKey,
          issueUrl: `${this.config.baseUrl}/browse/${issueKey}`,
          message: 'Issue updated successfully'
        }
      } else {
        const errorData = await response.json().catch(async () => ({ errorMessages: [await response.text()] }))
        return {
          success: false,
          error: `Failed to update issue: ${errorData.errorMessages?.join(', ') || response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update issue'
      }
    }
  }

  /**
   * Get an issue by key
   */
  async getIssue(issueKey: string): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${issueKey}`
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const issue = await response.json()
        return {
          success: true,
          issueKey: issue.key,
          issueId: issue.id,
          issueUrl: `${this.config.baseUrl}/browse/${issue.key}`,
          data: issue
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to get issue: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get issue'
      }
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, comment: JiraComment): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${issueKey}/comment`
      
      const payload: any = {
        body: {
          type: 'doc',
          version: 1,
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: comment.body
            }]
          }]
        }
      }

      if (comment.visibility) {
        payload.visibility = comment.visibility
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: 'Comment added successfully',
          data
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to add comment: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add comment'
      }
    }
  }

  /**
   * Transition an issue (change status)
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${issueKey}/transitions`
      
      const payload = {
        transition: {
          id: transitionId
        }
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        return {
          success: true,
          message: 'Issue transitioned successfully'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to transition issue: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transition issue'
      }
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<JiraResponse> {
    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${issueKey}/transitions`
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          data: data.transitions || []
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Failed to get transitions: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get transitions'
      }
    }
  }

  /**
   * Map ticket data to Jira issue format
   */
  mapTicketToJiraIssue(ticket: TicketToJiraInput): JiraIssue {
    return mapTicketToJiraIssue(ticket)
  }

  /**
   * Map Jira status to our status
   */
  mapJiraStatusToTicketStatus(jiraStatus: string): string {
    return mapJiraStatusToTicketStatus(jiraStatus)
  }
}

