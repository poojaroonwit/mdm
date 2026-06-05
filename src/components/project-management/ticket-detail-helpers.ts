import type { TicketDetailTicket } from './ticket-detail-types'
import type { SearchableSelectOption } from './SearchableSelect'

export const NONE_SELECT_OPTION: SearchableSelectOption = { value: '__none__', label: 'None' }

export const ATTRIBUTE_INPUT_CLASS = 'h-9 rounded-md border-0 bg-muted/70 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-800/80 dark:text-zinc-50 dark:placeholder:text-zinc-400'
export const ATTRIBUTE_GROUP_CLASS = 'space-y-4'
export const ATTRIBUTE_FIELD_CLASS = 'space-y-1.5'

export const PRIORITY_OPTIONS: SearchableSelectOption[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

export const SERVICE_DESK_TICKET_TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: '', label: 'None' },
  { value: 'Request', label: 'Request' },
  { value: 'Change Request', label: 'Change Request' },
  { value: 'Issue', label: 'Issue' },
  { value: 'Problem', label: 'Problem' },
  { value: 'Incident', label: 'Incident' },
]

export const SERVICE_DESK_STATUS_BY_TICKET_STATUS: Record<string, string> = {
  BACKLOG: 'Open',
  TODO: 'Open',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Progress',
  DONE: 'Resolved',
  CLOSED: 'Closed',
}

export const SERVICE_DESK_PRIORITY_BY_TICKET_PRIORITY: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Critical',
}

export function getTicketSpaceId(ticket: Pick<TicketDetailTicket, 'spaces'> | null | undefined) {
  const primarySpace = ticket?.spaces?.[0]
  return primarySpace?.spaceId || primarySpace?.space?.id || ''
}
