import { toDateInputValue } from '@/lib/date-formatters'
import {
  SERVICE_DESK_PRIORITY_BY_TICKET_PRIORITY,
  SERVICE_DESK_STATUS_BY_TICKET_STATUS,
} from './ticket-detail-helpers'
import type {
  TicketAttribute,
  TicketCustomField,
  TicketDetailSavePayload,
  TicketDetailTicket,
  TicketIntegrationMetadata,
} from './ticket-detail-types'

const TICKET_TYPE_ATTRIBUTE_NAMES = new Set(['ticket type', 'type', 'tickettype'])
const TICKET_TYPE_TAGS = ['Request', 'Change', 'Change Request', 'Issue', 'Problem', 'Incident']

export function normalizeTicketAttributes(attributes: TicketAttribute[] | undefined): TicketCustomField[] {
  return (attributes || []).map((attribute) => ({
    id: attribute.id,
    name: attribute.name,
    displayName: attribute.displayName || attribute.name,
    type: attribute.type || 'TEXT',
    value: attribute.type === 'DATE' ? toDateInputValue(attribute.value) : attribute.value || '',
    isRequired: attribute.isRequired || false,
    options: attribute.options || [],
    attributeType: attribute.attributeType || 'project',
    sharing: attribute.sharing || { mode: 'individual', projectIds: [] },
  }))
}

export function getTicketType(ticket: TicketDetailTicket) {
  const typeAttribute = ticket.attributes?.find((attribute) =>
    TICKET_TYPE_ATTRIBUTE_NAMES.has(attribute.name.toLowerCase())
  )

  if (typeAttribute) {
    return String(typeAttribute.value || '')
  }

  const typeTag = ticket.tags?.find((tag) =>
    TICKET_TYPE_TAGS.some((type) => tag.name.toLowerCase().includes(type.toLowerCase()))
  )

  return typeTag?.name || ''
}

export function getTicketIntegrationMetadata(ticket: TicketDetailTicket): TicketIntegrationMetadata {
  return ticket.metadata || {}
}

export function getTicketRepositoryFromMetadata(metadata: TicketIntegrationMetadata) {
  return metadata.gitlabRepository || metadata.gitlabProjectId || ''
}

export function buildServiceDeskUpdates(ticket: TicketDetailTicket): Record<string, string> {
  const updates: Record<string, string> = {}

  if (ticket.title) {
    updates.subject = ticket.title
  }
  if (ticket.description) {
    updates.description = ticket.description
  }
  if (ticket.status) {
    updates.status = SERVICE_DESK_STATUS_BY_TICKET_STATUS[ticket.status] || 'Open'
  }
  if (ticket.priority) {
    updates.priority = SERVICE_DESK_PRIORITY_BY_TICKET_PRIORITY[ticket.priority] || 'Medium'
  }
  if (ticket.dueDate) {
    updates.dueDate = ticket.dueDate && typeof ticket.dueDate === 'object' && 'toISOString' in ticket.dueDate
      ? ticket.dueDate.toISOString()
      : new Date(ticket.dueDate as string).toISOString()
  }

  return updates
}

export function buildTicketSavePayload(
  ticket: TicketDetailTicket,
  input: {
    title: string
    description: string
    status: string
    priority: string
    dueDate: string
    startDate: string
    estimate: string
    projectId: string
    moduleId: string
    milestoneId: string
    releaseId: string
    ticketType: string
    customFields: TicketCustomField[]
  }
): TicketDetailSavePayload {
  const nextAttributes = input.customFields.filter((field) => field.name.trim())
  const normalizedTicketType = input.ticketType.trim()
  const attributes = normalizedTicketType
    ? [
        ...nextAttributes.filter(
          (field) => !TICKET_TYPE_ATTRIBUTE_NAMES.has(field.name.toLowerCase())
        ),
        {
          name: 'Ticket Type',
          displayName: 'Ticket Type',
          type: 'SELECT',
          value: normalizedTicketType,
          attributeType: 'system' as const,
          sharing: { mode: 'individual' as const, projectIds: [] },
        },
      ]
    : nextAttributes

  return {
    ...ticket,
    title: input.title.trim(),
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate || null,
    startDate: input.startDate || null,
    estimate: input.estimate ? Number(input.estimate) : null,
    projectId: input.projectId || null,
    moduleId: input.moduleId || null,
    milestoneId: input.milestoneId || null,
    releaseId: input.releaseId || null,
    attributes,
  }
}
