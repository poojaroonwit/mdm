export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey?: string
}

export interface JiraIssue {
  summary: string
  description?: string
  projectKey?: string
  issueType?: string
  priority?: 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest'
  assignee?: string
  labels?: string[]
  dueDate?: string
  customFields?: Record<string, any>
}

export interface JiraResponse {
  success: boolean
  issueKey?: string
  issueId?: string
  issueUrl?: string
  message?: string
  error?: string
  data?: any
}

export interface JiraComment {
  body: string
  visibility?: {
    type: 'role' | 'group'
    value: string
  }
}

export interface JiraAttachment {
  file: File | Blob
  fileName: string
}

export interface TicketToJiraInput {
  title: string
  description?: string | null
  priority?: string
  status?: string
  assignees?: Array<{ user?: { email?: string } }>
  tags?: Array<{ name?: string }>
  projectKey?: string
  issueType?: string
}
