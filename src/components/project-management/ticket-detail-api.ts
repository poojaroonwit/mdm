import type {
  GitLabRepository,
  IntegrationActionResult,
  IntegrationConfig,
  ProjectChildOption,
  ProjectOption,
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskConflictResult,
  ServiceDeskTimeLog,
  TicketAttachment,
  TicketComment,
  TicketDependencies,
  TicketSubtask,
  TicketTimeLog,
} from './ticket-detail-types'

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  if (!response.ok) return fallback
  return response.json() as Promise<T>
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json() as Promise<T>
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json() as Promise<T>
}

export async function fetchServiceDeskConfig(spaceId: string): Promise<IntegrationConfig | null> {
  const response = await fetch(`/api/integrations/manageengine-servicedesk?space_id=${spaceId}`)
  if (!response.ok) return null
  const data = await response.json() as { config?: IntegrationConfig }
  return data.config ?? null
}

export async function fetchActiveGitLabIntegration(): Promise<IntegrationConfig | null> {
  const response = await fetch('/api/admin/integrations/list')
  const data = await readJson<{ integrations?: Array<Record<string, unknown>> }>(response, {})
  const integration = data.integrations?.find((item) =>
    String(item.type || '').toLowerCase() === 'gitlab' &&
    item.status === 'active' &&
    item.isEnabled
  )

  return integration ? { isConfigured: true, ...integration } : null
}

export async function fetchGitLabRepositories(): Promise<GitLabRepository[]> {
  const response = await fetch('/api/integrations/gitlab/repositories')
  const data = await readJson<{ success?: boolean; repositories?: GitLabRepository[] }>(response, {})
  return data.success && data.repositories ? data.repositories : []
}

export async function fetchProjects(spaceId: string): Promise<ProjectOption[]> {
  const response = await fetch(`/api/projects?space_id=${spaceId}`)
  const data = await readJson<{ projects?: ProjectOption[] }>(response, {})
  return data.projects || []
}

export async function fetchProjectChildren(projectId: string) {
  const [modulesRes, milestonesRes, releasesRes] = await Promise.all([
    fetch(`/api/modules?project_id=${projectId}`),
    fetch(`/api/milestones?projectId=${projectId}`),
    fetch(`/api/releases?projectId=${projectId}`),
  ])

  const [modulesData, milestonesData, releasesData] = await Promise.all([
    readJson<{ modules?: ProjectChildOption[] }>(modulesRes, {}),
    readJson<{ milestones?: ProjectChildOption[] }>(milestonesRes, {}),
    readJson<{ releases?: ProjectChildOption[] }>(releasesRes, {}),
  ])

  return {
    modules: modulesData.modules || [],
    milestones: milestonesData.milestones || [],
    releases: releasesData.releases || [],
  }
}

export function pushTicketToGitLab(input: {
  ticketId: string
  spaceId: string
  repository?: string
}) {
  return postJson<IntegrationActionResult>('/api/integrations/gitlab/push', {
    ticket_id: input.ticketId,
    space_id: input.spaceId,
    syncComments: true,
    syncAttachments: false,
    repository: input.repository || undefined,
    projectId: input.repository || undefined,
  })
}

export async function fetchServiceDeskData(spaceId: string, requestId: string) {
  const [commentsRes, attachmentsRes, timeLogsRes] = await Promise.all([
    fetch(`/api/integrations/manageengine-servicedesk/comments?space_id=${spaceId}&request_id=${requestId}`),
    fetch(`/api/integrations/manageengine-servicedesk/attachments?space_id=${spaceId}&request_id=${requestId}`),
    fetch(`/api/integrations/manageengine-servicedesk/time-logs?space_id=${spaceId}&request_id=${requestId}`),
  ])

  const [commentsData, attachmentsData, timeLogsData] = await Promise.all([
    readJson<{ comments?: ServiceDeskComment[] }>(commentsRes, {}),
    readJson<{ attachments?: ServiceDeskAttachment[] }>(attachmentsRes, {}),
    readJson<{ timeLogs?: ServiceDeskTimeLog[] }>(timeLogsRes, {}),
  ])

  return {
    comments: commentsData.comments || [],
    attachments: attachmentsData.attachments || [],
    timeLogs: timeLogsData.timeLogs || [],
  }
}

export function pushTicketToServiceDesk(input: {
  ticketId: string
  spaceId: string
  requesterEmail?: string
}) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/push', {
    ticket_id: input.ticketId,
    space_id: input.spaceId,
    requesterEmail: input.requesterEmail,
    syncComments: true,
    syncAttachments: true,
    syncTimeLogs: true,
  })
}

export function checkServiceDeskConflicts(ticketId: string, spaceId: string, requestId: string) {
  return postJson<ServiceDeskConflictResult>('/api/integrations/manageengine-servicedesk/conflict-resolution', {
    ticket_id: ticketId,
    space_id: spaceId,
    request_id: requestId,
  })
}

export function resolveServiceDeskConflicts(
  ticketId: string,
  spaceId: string,
  requestId: string,
  resolution: Record<string, string>
) {
  return putJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/conflict-resolution', {
    ticket_id: ticketId,
    space_id: spaceId,
    request_id: requestId,
    resolution,
  })
}

export function syncTicketFromServiceDesk(ticketId: string, spaceId: string, requestId: string) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/sync', {
    ticket_id: ticketId,
    space_id: spaceId,
    request_id: requestId,
  })
}

export function addServiceDeskComment(input: {
  ticketId: string
  spaceId: string
  requestId: string
  content: string
}) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/comments', {
    ticket_id: input.ticketId,
    space_id: input.spaceId,
    request_id: input.requestId,
    content: input.content,
    isPublic: true,
  })
}

export function setServiceDeskResolution(spaceId: string, requestId: string, resolution: string) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/resolution', {
    space_id: spaceId,
    request_id: requestId,
    resolution,
  })
}

export function logServiceDeskTime(input: {
  spaceId: string
  requestId: string
  hours: number
  minutes?: number
  description?: string
}) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/time-logs', {
    space_id: input.spaceId,
    request_id: input.requestId,
    hours: input.hours,
    minutes: input.minutes,
    description: input.description,
  })
}

export function linkServiceDeskTickets(input: {
  spaceId: string
  requestId: string
  linkedRequestId: string
  linkType: string
}) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/link', {
    space_id: input.spaceId,
    request_id: input.requestId,
    linked_request_id: input.linkedRequestId,
    link_type: input.linkType,
  })
}

export async function uploadServiceDeskAttachment(input: {
  spaceId: string
  requestId: string
  ticketId: string
  file: File
}) {
  const formData = new FormData()
  formData.append('space_id', input.spaceId)
  formData.append('request_id', input.requestId)
  formData.append('file', input.file)
  formData.append('description', `Uploaded from internal ticket ${input.ticketId}`)

  const response = await fetch('/api/integrations/manageengine-servicedesk/attachments', {
    method: 'POST',
    body: formData,
  })
  return response.json() as Promise<IntegrationActionResult>
}

export function updateServiceDeskTicket(spaceId: string, requestId: string, updates: Record<string, string>) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/update', {
    space_id: spaceId,
    request_id: requestId,
    updates,
  })
}

export function deleteServiceDeskTicket(spaceId: string, requestId: string, ticketId: string) {
  return postJson<IntegrationActionResult>('/api/integrations/manageengine-servicedesk/delete', {
    space_id: spaceId,
    request_id: requestId,
    ticket_id: ticketId,
  })
}

export async function fetchTicketActivity(ticketId: string) {
  const [commentsRes, attachmentsRes, subtasksRes, depsRes, timeLogsRes] = await Promise.all([
    fetch(`/api/tickets/${ticketId}/comments`),
    fetch(`/api/tickets/${ticketId}/attachments`),
    fetch(`/api/tickets/${ticketId}/subtasks`),
    fetch(`/api/tickets/${ticketId}/dependencies`),
    fetch(`/api/tickets/${ticketId}/time-logs`),
  ])

  const [commentsData, attachmentsData, subtasksData, dependenciesData, timeLogsData] = await Promise.all([
    readJson<{ comments?: TicketComment[] }>(commentsRes, {}),
    readJson<{ attachments?: TicketAttachment[] }>(attachmentsRes, {}),
    readJson<{ subtasks?: TicketSubtask[] }>(subtasksRes, {}),
    readJson<TicketDependencies>(depsRes, { dependencies: [], dependents: [] }),
    readJson<{ timeLogs?: TicketTimeLog[] }>(timeLogsRes, {}),
  ])

  return {
    comments: commentsData.comments || [],
    attachments: attachmentsData.attachments || [],
    subtasks: subtasksData.subtasks || [],
    dependencies: dependenciesData,
    timeLogs: timeLogsData.timeLogs || [],
  }
}

export async function addTicketComment(ticketId: string, content: string) {
  const response = await fetch(`/api/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  return response.ok ? response.json() as Promise<TicketComment> : null
}

export async function uploadTicketAttachment(ticketId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
    method: 'POST',
    body: formData,
  })
  return response.ok ? response.json() as Promise<TicketAttachment> : null
}

export async function addTicketSubtask(ticketId: string, subtask: { title: string; status: string }) {
  const response = await fetch(`/api/tickets/${ticketId}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subtask),
  })
  return response.ok ? response.json() as Promise<TicketSubtask> : null
}

export async function addTicketTimeLog(input: {
  ticketId: string
  hours: number
  description: string
  loggedAt: string
}) {
  const response = await fetch(`/api/tickets/${input.ticketId}/time-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hours: input.hours,
      description: input.description,
      loggedAt: input.loggedAt,
    }),
  })
  return response.ok ? response.json() as Promise<TicketTimeLog> : null
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const response = await fetch(`/api/tickets/${ticketId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return response.ok
}

export async function searchServiceDeskTickets(spaceId: string, search: string) {
  const response = await fetch(
    `/api/integrations/manageengine-servicedesk/list?space_id=${spaceId}&search=${encodeURIComponent(search)}&row_count=10`
  )
  return readJson<{ total?: number }>(response, {})
}
