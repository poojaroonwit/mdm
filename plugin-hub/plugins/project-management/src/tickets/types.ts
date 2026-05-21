export interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  startDate?: string | null
  estimate?: number | null
  labels?: string[]
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      avatar?: string | null
    }
  }>
  spaces?: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  attributes?: Array<{
    id: string
    name: string
    displayName: string
    type: string
    value?: string | null
  }>
  tags?: Array<{
    id: string
    name: string
  }>
  timeLogs?: Array<{
    id: string
    hours: number | string
    description?: string | null
    loggedAt: string | Date
    user: {
      id: string
      name: string
      email?: string
      avatar?: string | null
    }
  }>
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type TicketStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'low' | 'medium' | 'high' | 'urgent'

export interface TicketFilters {
  status?: string
  priority?: string
  assigneeId?: string
  spaceId?: string | null
  projectId?: string | null
  cycleId?: string | null
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface TicketsListProps {
  spaceId?: string | null
  viewMode?: 'list' | 'kanban' | 'table' | 'timesheet' | 'gantt'
  showFilters?: boolean
  showSpaceSelector?: boolean
  projectId?: string
  cycleId?: string
}

