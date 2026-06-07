import type { JiraIssue, TicketToJiraInput } from './types'

export function mapTicketToJiraIssue(ticket: TicketToJiraInput): JiraIssue {
  const labels = ticket.tags
    ?.map((tag) => tag.name)
    .filter((name): name is string => Boolean(name)) || []

  return {
    summary: ticket.title,
    description: ticket.description || undefined,
    projectKey: ticket.projectKey,
    issueType: ticket.issueType || 'Task',
    priority: mapPriorityToJira(ticket.priority),
    labels: labels.length > 0 ? labels : undefined,
  }
}

export function mapJiraStatusToTicketStatus(jiraStatus: string): string {
  const statusMap: Record<string, string> = {
    'To Do': 'BACKLOG',
    'In Progress': 'IN_PROGRESS',
    Done: 'DONE',
    Closed: 'CANCELLED',
    Resolved: 'DONE',
  }
  return statusMap[jiraStatus] || 'BACKLOG'
}

function mapPriorityToJira(priority?: string): 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest' | undefined {
  const map: Record<string, 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest'> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Highest',
  }
  return priority ? map[priority] || 'Medium' : undefined
}
