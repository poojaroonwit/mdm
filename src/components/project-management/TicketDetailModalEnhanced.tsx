'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Clock, MessageSquare, Paperclip,
  ListChecks, GitBranch, ExternalLink, Network,
  AlignLeft
} from 'lucide-react'
import { RichMarkdownEditor } from '@/components/knowledge-base/RichMarkdownEditor'
import { format } from 'date-fns'
import { toDateInputValue } from '@/lib/date-formatters'
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'
import { DEFAULT_PROJECT_STATUSES, ProjectStatusDefinition, normalizeProjectMetadata } from './project-config'
import { SearchableSelect } from './SearchableSelect'
import type {
  GitLabRepository,
  IntegrationConfig,
  ProjectChildOption,
  ProjectCustomFieldDefinition,
  ProjectOption,
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskTimeLog,
  TicketAttachment,
  TicketComment,
  TicketDependencies,
  TicketSubtask,
  TicketTimeLog,
  TicketAttribute,
  TicketCustomField,
  TicketDetailModalProps,
} from './ticket-detail-types'
import {
  addServiceDeskComment,
  addTicketComment,
  addTicketSubtask,
  addTicketTimeLog,
  checkServiceDeskConflicts,
  deleteServiceDeskTicket,
  fetchActiveGitLabIntegration,
  fetchGitLabRepositories,
  fetchProjectChildren,
  fetchProjects,
  fetchServiceDeskConfig,
  fetchServiceDeskData,
  fetchTicketActivity,
  linkServiceDeskTickets,
  logServiceDeskTime,
  pushTicketToGitLab,
  pushTicketToServiceDesk,
  resolveServiceDeskConflicts,
  setServiceDeskResolution,
  syncTicketFromServiceDesk,
  updateServiceDeskTicket,
  updateTicketStatus,
  uploadServiceDeskAttachment,
  uploadTicketAttachment,
} from './ticket-detail-api'
import {
  getTicketSpaceId,
} from './ticket-detail-helpers'
import {
  buildServiceDeskUpdates,
  buildTicketSavePayload,
  getTicketIntegrationMetadata,
  getTicketRepositoryFromMetadata,
  getTicketType,
  normalizeTicketAttributes,
} from './ticket-detail-mappers'
import {
  AttachmentsTab,
  CommentsTab,
  DependenciesTab,
  RelationshipsTab,
  SubtasksTab,
  TimeTab,
} from './ticket-detail-activity-tabs'
import {
  TicketCustomFieldsPanel,
} from './TicketCustomFieldsPanel'
import { TicketFooterActions } from './TicketFooterActions'
import { TicketDetailsSidebar } from './TicketDetailsSidebar'
import { TicketServiceDeskTab } from './TicketServiceDeskTab'
import { TicketDetailModalEnhancedView } from './TicketDetailModalEnhancedView'
import { useTicketDetailIntegrationActions } from './ticket-detail-integration-actions'
import { useTicketDetailActivityActions } from './ticket-detail-activity-actions'

export function TicketDetailModalEnhanced({
  ticket,
  open,
  onOpenChange,
  onSave,
  onDelete,
  displayMode = 'modal',
}: TicketDetailModalProps) {
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState('BACKLOG')
  const [editPriority, setEditPriority] = useState('MEDIUM')
  const [editDueDate, setEditDueDate] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEstimate, setEditEstimate] = useState('')
  const [customFields, setCustomFields] = useState<TicketCustomField[]>([])

  const [activeTab, setActiveTab] = useState('details')
  const [comments, setComments] = useState<TicketComment[]>([])
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [subtasks, setSubtasks] = useState<TicketSubtask[]>([])
  const [dependencies, setDependencies] = useState<TicketDependencies>({ dependencies: [], dependents: [] })
  const [timeLogs, setTimeLogs] = useState<TicketTimeLog[]>([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState({ title: '', status: 'BACKLOG' })
  const [newTimeLog, setNewTimeLog] = useState({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })
  const [pushingToServiceDesk, setPushingToServiceDesk] = useState(false)
  const [serviceDeskConfig, setServiceDeskConfig] = useState<IntegrationConfig | null>(null)
  const [ticketType, setTicketType] = useState<string>('')
  const [serviceDeskRequestId, setServiceDeskRequestId] = useState<string | null>(null)
  const [serviceDeskComments, setServiceDeskComments] = useState<ServiceDeskComment[]>([])
  const [serviceDeskAttachments, setServiceDeskAttachments] = useState<ServiceDeskAttachment[]>([])
  const [serviceDeskTimeLogs, setServiceDeskTimeLogs] = useState<ServiceDeskTimeLog[]>([])
  const [syncingFromServiceDesk, setSyncingFromServiceDesk] = useState(false)
  const [newServiceDeskComment, setNewServiceDeskComment] = useState('')
  const [newServiceDeskResolution, setNewServiceDeskResolution] = useState('')
  const [newServiceDeskTimeLog, setNewServiceDeskTimeLog] = useState({ hours: '', minutes: '', description: '' })
  const [newServiceDeskLink, setNewServiceDeskLink] = useState({ requestId: '', linkType: 'relates_to' })
  const [updatingServiceDesk, setUpdatingServiceDesk] = useState(false)
  const [deletingServiceDesk, setDeletingServiceDesk] = useState(false)
  const [pushingToGitLab, setPushingToGitLab] = useState(false)
  const [gitLabConfig, setGitLabConfig] = useState<IntegrationConfig | null>(null)
  const [gitLabIssueUrl, setGitLabIssueUrl] = useState<string | null>(null)
  const [gitLabRepositories, setGitLabRepositories] = useState<GitLabRepository[]>([])
  const [selectedRepository, setSelectedRepository] = useState<string>('')
  const [loadingRepositories, setLoadingRepositories] = useState(false)
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatusDefinition[]>(DEFAULT_PROJECT_STATUSES)
  const [, setProjectCustomFields] = useState<ProjectCustomFieldDefinition[]>([])
  const [modules, setModules] = useState<ProjectChildOption[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [milestones, setMilestones] = useState<ProjectChildOption[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<string>('')
  const [releases, setReleases] = useState<ProjectChildOption[]>([])
  const [selectedRelease, setSelectedRelease] = useState<string>('')

  const normalizedDescription = useMemo(() => {
    const value = editDescription || ''
    return value.trim() === '<p></p>' ? '' : value
  }, [editDescription])

  const applyProjectFieldDefinitions = (
    projectId: string,
    availableProjects: ProjectOption[],
    sourceAttributes?: TicketAttribute[]
  ) => {
    const project = availableProjects.find((item) => item.id === projectId)
    const metadata = normalizeProjectMetadata(project?.metadata)
    const definitions = metadata.customFields || []
    setProjectCustomFields(definitions)
    const nextStatuses = metadata.ticketConfig?.statuses || DEFAULT_PROJECT_STATUSES
    setProjectStatuses(nextStatuses)
    setEditStatus((current) =>
      nextStatuses.some((status) => status.value === current)
        ? current
        : nextStatuses[0]?.value || 'BACKLOG'
    )

    if (!projectId || definitions.length === 0) {
      setCustomFields([])
      return
    }

    const values = sourceAttributes || customFields
    setCustomFields(
      definitions.map((field) => {
        const existing = values.find((item) => item.name === field.name)
        return {
          id: existing && 'id' in existing ? String(existing.id) : undefined,
          name: field.name,
          displayName: field.displayName || field.name,
          type: field.type || 'TEXT',
          value: field.type === 'DATE' ? toDateInputValue(existing?.value) : existing?.value || '',
          isRequired: field.isRequired || false,
          options: field.options || [],
          attributeType: field.attributeType || 'project',
          sharing: field.sharing || { mode: 'individual', projectIds: [] },
        }
      })
    )
  }

  const {
    loadGitLabRepositories,
    loadServiceDeskData,
    handlePushToGitLab,
    handlePushToServiceDesk,
    handleSyncFromServiceDesk,
    handleAddServiceDeskComment,
    handleSetServiceDeskResolution,
    handleLogServiceDeskTime,
    handleLinkServiceDeskTickets,
    handleUploadServiceDeskAttachment,
    handleUpdateServiceDeskTicket,
    handleDeleteServiceDeskTicket,
  } = useTicketDetailIntegrationActions({
    ticket,
    onSave,
    selectedRepository,
    setLoadingRepositories,
    setGitLabRepositories,
    setPushingToGitLab,
    setGitLabIssueUrl,
    setServiceDeskComments,
    setServiceDeskAttachments,
    setServiceDeskTimeLogs,
    setPushingToServiceDesk,
    setServiceDeskRequestId,
    serviceDeskRequestId,
    setSyncingFromServiceDesk,
    newServiceDeskComment,
    setNewServiceDeskComment,
    newServiceDeskResolution,
    setNewServiceDeskResolution,
    newServiceDeskTimeLog,
    setNewServiceDeskTimeLog,
    newServiceDeskLink,
    setNewServiceDeskLink,
    setUpdatingServiceDesk,
    setDeletingServiceDesk,
  })
  const {
    loadAllData,
    handleAddComment,
    handleUploadAttachment,
    handleAddSubtask,
    handleToggleSubtaskStatus,
    handleAddTimeLog,
  } = useTicketDetailActivityActions({
    ticket,
    comments,
    setComments,
    attachments,
    setAttachments,
    subtasks,
    setSubtasks,
    setDependencies,
    timeLogs,
    setTimeLogs,
    newComment,
    setNewComment,
    newSubtask,
    setNewSubtask,
    newTimeLog,
    setNewTimeLog,
  })
  useEffect(() => {
    if (ticket && open) {
      setEditTitle(ticket.title || '')
      setEditDescription(ticket.description || '')
      setEditStatus(ticket.status || 'BACKLOG')
      setEditPriority(ticket.priority || 'MEDIUM')
      setEditDueDate(toDateInputValue(ticket.dueDate))
      setEditStartDate(toDateInputValue(ticket.startDate))
      setEditEstimate(ticket.estimate?.toString() || '')
      setCustomFields(normalizeTicketAttributes(ticket.attributes))
    }
  }, [ticket, open])

  useEffect(() => {
    if (ticket?.id && open) {
      loadAllData()
      checkServiceDeskConfig()
      checkGitLabConfig()
      loadProjectsAndModules(ticket.projectId || '')
      setTicketType(getTicketType(ticket))

      const metadata = getTicketIntegrationMetadata(ticket)
      if (metadata?.serviceDeskRequestId) {
        setServiceDeskRequestId(metadata.serviceDeskRequestId)
        loadServiceDeskData(metadata.serviceDeskRequestId)
      }

      if (metadata?.gitlabIssueUrl) {
        setGitLabIssueUrl(metadata.gitlabIssueUrl)
      }
      const repository = getTicketRepositoryFromMetadata(metadata)
      if (repository) {
        setSelectedRepository(repository)
      }
      if (ticket.projectId) {
        setSelectedProject(ticket.projectId)
      }
      if (ticket.moduleId) {
        setSelectedModule(ticket.moduleId)
      }
      if (ticket.milestoneId) {
        setSelectedMilestone(ticket.milestoneId)
      }
      if (ticket.releaseId) {
        setSelectedRelease(ticket.releaseId)
      }
    }
  }, [ticket?.id, open, ticket?.attributes, ticket?.tags])

  const checkServiceDeskConfig = async () => {
    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      setServiceDeskConfig(await fetchServiceDeskConfig(spaceId))
    } catch (error) {
      console.error('Failed to check ServiceDesk config:', error)
    }
  }

  const checkGitLabConfig = async () => {
    try {
      const gitlabIntegration = await fetchActiveGitLabIntegration()
      if (gitlabIntegration) {
        setGitLabConfig(gitlabIntegration)
        loadGitLabRepositories()
      }
    } catch (error) {
      console.error('Failed to check GitLab config:', error)
    }
  }

  const loadProjectsAndModules = async (projectIdOverride?: string) => {
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return
    const targetProjectId = projectIdOverride ?? selectedProject ?? ticket.projectId ?? ''

    try {
      const availableProjects = await fetchProjects(spaceId)
      setProjects(availableProjects)
      if (targetProjectId) {
          applyProjectFieldDefinitions(targetProjectId, availableProjects, ticket.attributes)
      } else {
        setProjectCustomFields([])
        setCustomFields([])
        setProjectStatuses(DEFAULT_PROJECT_STATUSES)
      }

      if (targetProjectId) {
        const children = await fetchProjectChildren(targetProjectId)
        setModules(children.modules)
        setMilestones(children.milestones)
        setReleases(children.releases)
      } else {
        setModules([])
        setMilestones([])
        setReleases([])
      }
    } catch (error) {
      console.error('Failed to load projects/modules:', error)
    }
  }

  useEffect(() => {
    if (open && ticket) {
      loadProjectsAndModules(selectedProject || ticket.projectId || '')
    }
  }, [selectedProject])

  return <TicketDetailModalEnhancedView {...{ ticket, open, onOpenChange, onSave, onDelete, displayMode, editTitle, setEditTitle, editDescription, setEditDescription, normalizedDescription, editStatus, setEditStatus, editPriority, setEditPriority, editDueDate, setEditDueDate, editStartDate, setEditStartDate, editEstimate, setEditEstimate, customFields, setCustomFields, activeTab, setActiveTab, comments, attachments, subtasks, dependencies, timeLogs, newComment, setNewComment, newSubtask, setNewSubtask, newTimeLog, setNewTimeLog, serviceDeskConfig, serviceDeskRequestId, serviceDeskComments, serviceDeskAttachments, serviceDeskTimeLogs, syncingFromServiceDesk, newServiceDeskComment, setNewServiceDeskComment, newServiceDeskResolution, setNewServiceDeskResolution, newServiceDeskTimeLog, setNewServiceDeskTimeLog, newServiceDeskLink, setNewServiceDeskLink, updatingServiceDesk, deletingServiceDesk, pushingToServiceDesk, gitLabConfig, gitLabIssueUrl, gitLabRepositories, selectedRepository, setSelectedRepository, loadingRepositories, pushingToGitLab, projects, selectedProject, setSelectedProject, projectStatuses, modules, setSelectedModule, selectedModule, milestones, setSelectedMilestone, selectedMilestone, releases, setSelectedRelease, selectedRelease, applyProjectFieldDefinitions, handlePushToServiceDesk, handlePushToGitLab, handleAddComment, handleUploadAttachment, handleAddSubtask, handleToggleSubtaskStatus, handleAddTimeLog, handleUpdateServiceDeskTicket, handleSyncFromServiceDesk, handleDeleteServiceDeskTicket, handleAddServiceDeskComment, handleUploadServiceDeskAttachment, handleLogServiceDeskTime, handleSetServiceDeskResolution, handleLinkServiceDeskTickets }} />
}

