import type { ProjectFieldDefinition } from './project-config'

export interface TicketIntegrationMetadata {
  serviceDeskRequestId?: string
  gitlabIssueUrl?: string
  gitlabRepository?: string
  gitlabProjectId?: string
}

export interface TicketDetailTicket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | Date | null
  startDate?: string | Date | null
  estimate?: number | null
  projectId?: string | null
  moduleId?: string | null
  milestoneId?: string | null
  releaseId?: string | null
  metadata?: TicketIntegrationMetadata | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      avatar?: string | null
      email?: string
    }
  }>
  tags?: Array<{
    id: string
    name: string
    color?: string | null
  }>
  spaces?: Array<{
    spaceId: string
    space?: {
      id: string
      name: string
    }
  }>
  creator?: {
    email?: string
  }
  attributes?: TicketAttribute[]
}

export interface TicketAttribute {
  id?: string
  name: string
  value?: string | null
  jsonValue?: unknown
  displayName?: string
  type?: string
  isRequired?: boolean
  options?: ProjectFieldDefinition['options']
  attributeType?: 'system' | 'project'
  sharing?: ProjectFieldDefinition['sharing']
}

export interface TicketDetailSavePayload extends TicketDetailTicket {
  startDate?: string | null
  projectId?: string | null
  moduleId?: string | null
  milestoneId?: string | null
  releaseId?: string | null
  attributes?: Array<TicketAttribute | TicketCustomField>
}

export interface TicketDetailModalProps {
  ticket: TicketDetailTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (ticket: TicketDetailTicket | TicketDetailSavePayload) => void
  onDelete?: (ticketId: string) => void
  displayMode?: 'modal' | 'drawer'
}

export type ProjectCustomFieldDefinition = ProjectFieldDefinition

export interface ProjectOption {
  id: string
  name: string
  metadata?: Record<string, unknown> | null
}

export interface ProjectChildOption {
  id: string
  name: string
  projectId: string
}

export interface GitLabRepository {
  id: number
  projectId: string
  name: string
  path: string
}

export interface IntegrationConfig {
  isConfigured?: boolean
  [key: string]: unknown
}

export interface TicketUserSummary {
  name?: string
  avatar?: string | null
}

export interface TicketComment {
  id: string
  content?: string
  createdAt: string
  author?: TicketUserSummary
}

export interface TicketAttachment {
  id: string
  fileName: string
  fileSize: number
}

export interface TicketSubtask {
  id: string
  title: string
  status: string
  metadata?: {
    gitlabRepository?: string
  } | null
}

export interface TicketTimeLog {
  id: string
  hours: number | string
  loggedAt: string
  description?: string | null
  user?: TicketUserSummary
}

export interface TicketDependencyLink {
  id: string
  type?: string
  dependsOn?: {
    title?: string
  }
  ticket?: {
    title?: string
  }
}

export interface TicketDependencies {
  dependencies: TicketDependencyLink[]
  dependents: TicketDependencyLink[]
}

export interface ServiceDeskComment {
  content?: string
  description?: string
  created_time?: string
  technician?: TicketUserSummary
}

export interface ServiceDeskAttachment {
  file_name?: string
  name?: string
  file_size?: number
}

export interface ServiceDeskTimeLog {
  hours?: number
  minutes?: number
  description?: string
  technician?: TicketUserSummary
  created_by?: TicketUserSummary
}

export interface ServiceDeskSyncCounts {
  comments?: number
  attachments?: number
  timeLogs?: number
}

export interface IntegrationActionResult {
  success?: boolean
  error?: string
  message?: string
  requestId?: string
  updated?: boolean
  synced?: ServiceDeskSyncCounts
  data?: {
    issueUrl?: string
    issueIid?: string | number
  }
}

export interface ServiceDeskConflict {
  field: string
}

export interface ServiceDeskConflictResult {
  has_conflicts?: boolean
  conflicts?: ServiceDeskConflict[]
}

export interface TicketCustomField extends ProjectFieldDefinition {
  id?: string
  value?: string | null
}
