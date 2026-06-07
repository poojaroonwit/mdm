import type { ServiceDeskTicket } from './types'

export interface InternalTicketInput {
  title: string
  description?: string | null
  priority?: string
  status?: string
  assignedTo?: string
  dueDate?: string | Date | null
  requesterEmail?: string
  tags?: Array<{ name: string }>
  attributes?: Array<{ name: string; value: any }>
}

export function mapTicketToServiceDesk(ourTicket: InternalTicketInput): ServiceDeskTicket {
  const ticket: ServiceDeskTicket = {
    subject: ourTicket.title,
    description: ourTicket.description || '',
    priority: mapPriority(ourTicket.priority),
    status: mapStatus(ourTicket.status),
    requester: ourTicket.requesterEmail,
  }

  if (ourTicket.dueDate) {
    ticket.dueDate = ourTicket.dueDate instanceof Date
      ? ourTicket.dueDate.toISOString()
      : new Date(ourTicket.dueDate).toISOString()
  }

  const ticketType = findTicketType(ourTicket)
  if (ticketType) {
    ticket.category = normalizeTicketType(ticketType)
  } else if (ourTicket.tags && ourTicket.tags.length > 0) {
    ticket.category = ourTicket.tags[0].name
  }

  if (ourTicket.attributes && ourTicket.attributes.length > 0) {
    ticket.customFields = {}
    ourTicket.attributes.forEach((attr) => {
      ticket.customFields![attr.name] = attr.value
    })
  }

  return ticket
}

function findTicketType(ourTicket: InternalTicketInput) {
  if (ourTicket.attributes && ourTicket.attributes.length > 0) {
    const typeAttr = ourTicket.attributes.find((attr) =>
      attr.name.toLowerCase() === 'ticket type' ||
      attr.name.toLowerCase() === 'type' ||
      attr.name.toLowerCase() === 'tickettype'
    )
    if (typeAttr?.value) return String(typeAttr.value)
  }

  if (ourTicket.tags && ourTicket.tags.length > 0) {
    const typeTags = ['Request', 'Change', 'Change Request', 'Issue', 'Problem', 'Incident']
    return ourTicket.tags.find((tag) =>
      typeTags.some((type) => tag.name.toLowerCase().includes(type.toLowerCase()))
    )?.name || null
  }

  return null
}

function normalizeTicketType(type: string): string {
  const normalized = type.trim()
  const lower = normalized.toLowerCase()

  if (lower.includes('request') && !lower.includes('change')) return 'Request'
  if (lower.includes('change')) return 'Change Request'
  if (lower.includes('issue')) return 'Issue'
  if (lower.includes('problem')) return 'Problem'
  if (lower.includes('incident')) return 'Incident'

  return normalized
}

function mapPriority(priority?: string | null): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (!priority) return 'Medium'

  switch (priority.toUpperCase()) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    case 'CRITICAL':
    case 'URGENT':
      return 'Critical'
    default:
      return 'Medium'
  }
}

function mapStatus(status?: string | null): 'Open' | 'In Progress' | 'Resolved' | 'Closed' {
  if (!status) return 'Open'

  switch (status.toUpperCase()) {
    case 'BACKLOG':
    case 'TODO':
      return 'Open'
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'In Progress'
    case 'RESOLVED':
    case 'DONE':
      return 'Resolved'
    case 'CLOSED':
    case 'CANCELLED':
      return 'Closed'
    default:
      return 'Open'
  }
}
