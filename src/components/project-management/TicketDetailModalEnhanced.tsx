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
import { Textarea } from '@/components/ui/textarea'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Clock, MessageSquare, Paperclip,
  ListChecks, GitBranch, Trash2, Edit, ExternalLink, Loader, Network,
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
  searchServiceDeskTickets,
  setServiceDeskResolution,
  syncTicketFromServiceDesk,
  updateServiceDeskTicket,
  updateTicketStatus,
  uploadServiceDeskAttachment,
  uploadTicketAttachment,
} from './ticket-detail-api'
import {
  ATTRIBUTE_FIELD_CLASS,
  ATTRIBUTE_GROUP_CLASS,
  ATTRIBUTE_INPUT_CLASS,
  NONE_SELECT_OPTION,
  PRIORITY_OPTIONS,
  SERVICE_DESK_TICKET_TYPE_OPTIONS,
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

  const loadGitLabRepositories = async () => {
    setLoadingRepositories(true)
    try {
      setGitLabRepositories(await fetchGitLabRepositories())
    } catch (error) {
      console.error('Failed to load GitLab repositories:', error)
    } finally {
      setLoadingRepositories(false)
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

  const handlePushToGitLab = async () => {
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) {
      showError('Unable to determine space')
      return
    }

    setPushingToGitLab(true)
    try {
      const result = await pushTicketToGitLab({
        ticketId: ticket.id,
        spaceId,
        repository: selectedRepository,
      })

      if (result.success) {
        if (result.data?.issueUrl) {
          setGitLabIssueUrl(result.data.issueUrl)
        }
        showSuccess(result.message || `Ticket ${result.data?.issueIid ? 'updated' : 'synced'} to GitLab successfully. Issue #${result.data?.issueIid || 'N/A'}`)
        // Refresh ticket to get updated metadata
        if (onSave) {
          onSave(ticket)
        }
      } else {
        showError(result.error || 'Failed to push ticket to GitLab')
      }
    } catch (error) {
      showError('Failed to push ticket to GitLab')
    } finally {
      setPushingToGitLab(false)
    }
  }

  const loadServiceDeskData = async (requestId: string) => {
    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      const data = await fetchServiceDeskData(spaceId, requestId)
      setServiceDeskComments(data.comments)
      setServiceDeskAttachments(data.attachments)
      setServiceDeskTimeLogs(data.timeLogs)
    } catch (error) {
      console.error('Error loading ServiceDesk data:', error)
    }
  }

  const handlePushToServiceDesk = async () => {
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) {
      showError('Ticket must belong to a space')
      return
    }

    setPushingToServiceDesk(true)
    try {
      const result = await pushTicketToServiceDesk({
        ticketId: ticket.id,
        spaceId,
        requesterEmail: ticket.creator?.email,
      })

      if (result.success) {
        setServiceDeskRequestId(result.requestId || null)
        if (result.requestId) {
          await loadServiceDeskData(result.requestId)
        }
        showSuccess(`Ticket pushed to ServiceDesk successfully. Request ID: ${result.requestId}${result.synced ? ` (Synced: ${result.synced.comments} comments, ${result.synced.attachments} attachments, ${result.synced.timeLogs} time logs)` : ''}`)
      } else {
        showError(result.error || 'Failed to push ticket to ServiceDesk')
      }
    } catch (error) {
      showError('Failed to push ticket to ServiceDesk')
    } finally {
      setPushingToServiceDesk(false)
    }
  }

  const handleSyncFromServiceDesk = async () => {
    if (!serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return

    setSyncingFromServiceDesk(true)
    try {
      const conflictData = await checkServiceDeskConflicts(ticket.id, spaceId, serviceDeskRequestId)
      const conflicts = conflictData.conflicts || []

      if (conflictData.has_conflicts && conflicts.length > 0) {
        const resolution: Record<string, string> = {}
        for (const conflict of conflicts) {
          // For now, default to keeping ServiceDesk version
          // In a full implementation, you'd show a dialog to let user choose
          resolution[conflict.field] = 'keep_servicedesk'
        }

        const resolveResult = await resolveServiceDeskConflicts(ticket.id, spaceId, serviceDeskRequestId, resolution)
        if (!resolveResult.success) {
          showError(resolveResult.error || 'Failed to resolve conflicts')
          setSyncingFromServiceDesk(false)
          return
        }
      }

      const result = await syncTicketFromServiceDesk(ticket.id, spaceId, serviceDeskRequestId)

      if (result.success) {
        await loadServiceDeskData(serviceDeskRequestId)
        showSuccess(`Ticket synced from ServiceDesk successfully${result.updated ? ' (Updated)' : ''}`)
        if (onSave) {
          onSave(ticket)
        }
      } else {
        showError(result.error || 'Failed to sync ticket from ServiceDesk')
      }
    } catch (error) {
      showError('Failed to sync ticket from ServiceDesk')
    } finally {
      setSyncingFromServiceDesk(false)
    }
  }

  const handleAddServiceDeskComment = async () => {
    if (!newServiceDeskComment.trim() || !serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return

    try {
      const result = await addServiceDeskComment({
        ticketId: ticket.id,
        spaceId,
        requestId: serviceDeskRequestId,
        content: newServiceDeskComment,
      })

      if (result.success) {
        setNewServiceDeskComment('')
        await loadServiceDeskData(serviceDeskRequestId)
        showSuccess('Comment added to ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to add comment to ServiceDesk')
      }
    } catch (error) {
      showError('Failed to add comment to ServiceDesk')
    }
  }

  const handleSetServiceDeskResolution = async () => {
    if (!newServiceDeskResolution.trim() || !serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      const result = await setServiceDeskResolution(spaceId, serviceDeskRequestId, newServiceDeskResolution)

      if (result.success) {
        setNewServiceDeskResolution('')
        showSuccess('Resolution set in ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to set resolution in ServiceDesk')
      }
    } catch (error) {
      showError('Failed to set resolution in ServiceDesk')
    }
  }

  const handleLogServiceDeskTime = async () => {
    if (!newServiceDeskTimeLog.hours || !serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      const result = await logServiceDeskTime({
        spaceId,
        requestId: serviceDeskRequestId,
        hours: parseFloat(newServiceDeskTimeLog.hours),
        minutes: newServiceDeskTimeLog.minutes ? parseInt(newServiceDeskTimeLog.minutes) : undefined,
        description: newServiceDeskTimeLog.description || undefined,
      })

      if (result.success) {
        setNewServiceDeskTimeLog({ hours: '', minutes: '', description: '' })
        await loadServiceDeskData(serviceDeskRequestId)
        showSuccess('Time logged to ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to log time to ServiceDesk')
      }
    } catch (error) {
      showError('Failed to log time to ServiceDesk')
    }
  }

  const handleLinkServiceDeskTickets = async () => {
    if (!newServiceDeskLink.requestId || !serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      const result = await linkServiceDeskTickets({
        spaceId,
        requestId: serviceDeskRequestId,
        linkedRequestId: newServiceDeskLink.requestId,
        linkType: newServiceDeskLink.linkType,
      })

      if (result.success) {
        setNewServiceDeskLink({ requestId: '', linkType: 'relates_to' })
        showSuccess('Tickets linked in ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to link tickets in ServiceDesk')
      }
    } catch (error) {
      showError('Failed to link tickets in ServiceDesk')
    }
  }

  const handleUploadServiceDeskAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return

    try {
      const result = await uploadServiceDeskAttachment({
        spaceId,
        requestId: serviceDeskRequestId,
        ticketId: ticket.id,
        file,
      })

      if (result.success) {
        await loadServiceDeskData(serviceDeskRequestId)
        showSuccess('Attachment uploaded to ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to upload attachment to ServiceDesk')
      }
    } catch (error) {
      showError('Failed to upload attachment to ServiceDesk')
    }
  }

  const handleUpdateServiceDeskTicket = async () => {
    if (!serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return

    setUpdatingServiceDesk(true)
    try {
      const updates = buildServiceDeskUpdates(ticket)
      const result = await updateServiceDeskTicket(spaceId, serviceDeskRequestId, updates)

      if (result.success) {
        showSuccess('Ticket updated in ServiceDesk successfully')
      } else {
        showError(result.error || 'Failed to update ticket in ServiceDesk')
      }
    } catch (error) {
      showError('Failed to update ticket in ServiceDesk')
    } finally {
      setUpdatingServiceDesk(false)
    }
  }

  const handleDeleteServiceDeskTicket = async () => {
    if (!serviceDeskRequestId) return
    const spaceId = getTicketSpaceId(ticket)
    if (!ticket || !spaceId) return

    if (!confirm(`Are you sure you want to delete ticket ${serviceDeskRequestId} from ServiceDesk? This action cannot be undone.`)) {
      return
    }

    setDeletingServiceDesk(true)
    try {
      const result = await deleteServiceDeskTicket(spaceId, serviceDeskRequestId, ticket.id)

      if (result.success) {
        setServiceDeskRequestId(null)
        setServiceDeskComments([])
        setServiceDeskAttachments([])
        setServiceDeskTimeLogs([])
        showSuccess('Ticket deleted from ServiceDesk successfully')
        if (onSave) {
          onSave(ticket)
        }
      } else {
        showError(result.error || 'Failed to delete ticket from ServiceDesk')
      }
    } catch (error) {
      showError('Failed to delete ticket from ServiceDesk')
    } finally {
      setDeletingServiceDesk(false)
    }
  }

  const loadAllData = async () => {
    if (!ticket?.id) return

    try {
      const data = await fetchTicketActivity(ticket.id)
      setComments(data.comments)
      setAttachments(data.attachments)
      setSubtasks(data.subtasks)
      setDependencies(data.dependencies)
      setTimeLogs(data.timeLogs)
    } catch (error) {
      console.error('Error loading ticket data:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket?.id) return

    try {
      const comment = await addTicketComment(ticket.id, newComment)
      if (comment) {
        setComments([...comments, comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !ticket?.id) return

    try {
      const attachment = await uploadTicketAttachment(ticket.id, file)
      if (attachment) {
        setAttachments([...attachments, attachment])
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim() || !ticket?.id) return

    try {
      const subtask = await addTicketSubtask(ticket.id, newSubtask)
      if (subtask) {
        setSubtasks([...subtasks, subtask])
        setNewSubtask({ title: '', status: 'BACKLOG' })
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const handleToggleSubtaskStatus = async (subtask: TicketSubtask) => {
    const isCompleted = subtask.status === 'DONE' || subtask.status === 'CANCELLED'
    const newStatus = isCompleted ? 'TODO' : 'DONE'

    try {
      if (await updateTicketStatus(subtask.id, newStatus)) {
        loadAllData()
        showSuccess(`Subtask ${newStatus === 'DONE' ? 'completed' : 'reopened'}`)
      }
    } catch (error) {
      showError('Failed to update subtask')
    }
  }

  const handleAddTimeLog = async () => {
    if (!newTimeLog.hours || !ticket?.id) return

    try {
      const timeLog = await addTicketTimeLog({
        ticketId: ticket.id,
        hours: parseFloat(newTimeLog.hours),
        description: newTimeLog.description,
        loggedAt: newTimeLog.loggedAt,
      })
      if (timeLog) {
        setTimeLogs([...timeLogs, timeLog])
        setNewTimeLog({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })
      }
    } catch (error) {
      console.error('Error adding time log:', error)
    }
  }

  if (!ticket) return null

  const isNew = !ticket.id
  const isDrawer = displayMode === 'drawer'
  const ticketAssignees = ticket.assignees || []
  const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)

  const handleSave = async () => {
    onSave?.(buildTicketSavePayload(ticket, {
      title: editTitle,
      description: normalizedDescription,
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate,
      startDate: editStartDate,
      estimate: editEstimate,
      projectId: selectedProject,
      moduleId: selectedModule,
      milestoneId: selectedMilestone,
      releaseId: selectedRelease,
      ticketType,
      customFields,
    }))
  }

  const projectOptions = [
    NONE_SELECT_OPTION,
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ]
  const moduleOptions = [
    NONE_SELECT_OPTION,
    ...modules.map((module) => ({ value: module.id, label: module.name })),
  ]
  const milestoneOptions = [
    NONE_SELECT_OPTION,
    ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.name })),
  ]
  const releaseOptions = [
    NONE_SELECT_OPTION,
    ...releases.map((release) => ({ value: release.id, label: release.name })),
  ]

  const renderFieldInput = (
    field: {
      name: string
      displayName: string
      type: string
      value?: string | null
      isRequired?: boolean
      options?: TicketCustomField['options']
    },
    index: number
  ) => {
    const updateField = (value: string) => {
      setCustomFields((prev) =>
        prev.map((item, itemIndex) =>
          itemIndex === index ? { ...item, value } : item
        )
      )
    }

    if (field.type === 'SELECT') {
      return (
        <SearchableSelect
          value={field.value || '__none__'}
          onValueChange={(value) => updateField(value === '__none__' ? '' : value)}
          options={[
            { value: '__none__', label: 'None' },
            ...(field.options || []).map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
          placeholder="Select value"
          searchPlaceholder={`Search ${field.displayName.toLowerCase()}...`}
          className={ATTRIBUTE_INPUT_CLASS}
        />
      )
    }

    if (field.type === 'DATE') {
      return <Input type="date" value={toDateInputValue(field.value)} onChange={(e) => updateField(e.target.value)} className={ATTRIBUTE_INPUT_CLASS} />
    }

    if (field.type === 'NUMBER') {
      return <Input type="number" value={field.value || ''} onChange={(e) => updateField(e.target.value)} placeholder="Value" className={ATTRIBUTE_INPUT_CLASS} />
    }

    return <Input value={field.value || ''} onChange={(e) => updateField(e.target.value)} placeholder="Value" className={ATTRIBUTE_INPUT_CLASS} />
  }

  const projectFields = customFields.filter((field) => field.attributeType !== 'system')

  // Common header content
  const headerContent = (
      <div className="space-y-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Ticket title"
          className="h-11 rounded-md border-transparent bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
        />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="rounded-md">{isNew ? 'New ticket' : ticket.id.slice(0, 8)}</Badge>
        <span>{projectStatuses.find((status) => status.value === editStatus)?.label || editStatus}</span>
        <span>{editPriority}</span>
        {selectedProject && <span>{projects.find((project) => project.id === selectedProject)?.name}</span>}
      </div>
    </div>
  )

  const customFieldsPanel = (
    <div className="space-y-6 rounded-md border border-border bg-background p-4">
      <div className={ATTRIBUTE_GROUP_CLASS}>
        <h3 className="text-sm font-medium">Details</h3>
        <div className="grid gap-3">
          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Status</Label>
            <SearchableSelect
              value={editStatus}
              onValueChange={setEditStatus}
              options={projectStatuses.map((status) => ({ value: status.value, label: status.label }))}
              placeholder="Select status"
              searchPlaceholder="Search statuses..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Priority</Label>
            <SearchableSelect
              value={editPriority}
              onValueChange={setEditPriority}
              options={PRIORITY_OPTIONS}
              placeholder="Select priority"
              searchPlaceholder="Search priorities..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
          </div>

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Estimate (hours)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={editEstimate}
              onChange={(e) => setEditEstimate(e.target.value)}
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          {!isNew && (
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label htmlFor="ticketType">Ticket Type</Label>
              <SearchableSelect
                id="ticketType"
                value={ticketType}
                onValueChange={setTicketType}
                options={SERVICE_DESK_TICKET_TYPE_OPTIONS}
                placeholder="Select ticket type"
                searchPlaceholder="Search ticket types..."
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
          )}

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label htmlFor={isNew ? 'project-create' : 'project'}>Project</Label>
            <SearchableSelect
              id={isNew ? 'project-create' : 'project'}
              value={selectedProject || '__none__'}
              onValueChange={(value) => {
                const nextProjectId = value === '__none__' ? '' : value
                setSelectedProject(nextProjectId)
                setSelectedModule('')
                setSelectedMilestone('')
                setSelectedRelease('')
                applyProjectFieldDefinitions(nextProjectId, projects)
              }}
              options={projectOptions}
              placeholder="Select project"
              searchPlaceholder="Search projects..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          {selectedProject && (
            <>
              <div className={ATTRIBUTE_FIELD_CLASS}>
                <Label htmlFor={isNew ? 'module-create' : 'module'}>Module</Label>
                <SearchableSelect
                  id={isNew ? 'module-create' : 'module'}
                  value={selectedModule || '__none__'}
                  onValueChange={(value) => setSelectedModule(value === '__none__' ? '' : value)}
                  options={moduleOptions}
                  placeholder="Select module"
                  searchPlaceholder="Search modules..."
                  className={ATTRIBUTE_INPUT_CLASS}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className={ATTRIBUTE_FIELD_CLASS}>
                  <Label htmlFor={isNew ? 'milestone-create' : 'milestone'}>Milestone</Label>
                  <SearchableSelect
                    id={isNew ? 'milestone-create' : 'milestone'}
                    value={selectedMilestone || '__none__'}
                    onValueChange={(value) => setSelectedMilestone(value === '__none__' ? '' : value)}
                    options={milestoneOptions}
                    placeholder="Select milestone"
                    searchPlaceholder="Search milestones..."
                    className={ATTRIBUTE_INPUT_CLASS}
                  />
                </div>

                <div className={ATTRIBUTE_FIELD_CLASS}>
                  <Label htmlFor={isNew ? 'release-create' : 'release'}>Release</Label>
                  <SearchableSelect
                    id={isNew ? 'release-create' : 'release'}
                    value={selectedRelease || '__none__'}
                    onValueChange={(value) => setSelectedRelease(value === '__none__' ? '' : value)}
                    options={releaseOptions}
                    placeholder="Select release"
                    searchPlaceholder="Search releases..."
                    className={ATTRIBUTE_INPUT_CLASS}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`${ATTRIBUTE_GROUP_CLASS} border-t border-border pt-5`}>
        <h3 className="text-sm font-medium">Project attributes</h3>
        {!selectedProject ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Select a project to load project attributes.
          </div>
        ) : projectFields.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            This project has no configured attributes yet.
          </div>
        ) : (
          <div className="space-y-3">
            {projectFields.map((field) => {
              const index = customFields.findIndex((item) => item.name === field.name)
              return (
                <div key={field.name} className={ATTRIBUTE_FIELD_CLASS}>
                  <Label>{field.displayName}</Label>
                  {renderFieldInput(field, index)}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const ticketDetailsFields = (
    <div className="space-y-5">
      <div className="rounded-md bg-white">
        <RichMarkdownEditor
          content={editDescription}
          onChange={setEditDescription}
          placeholder='Add description, or type "/" for tools...'
          editable
          showToolbar={false}
          className="bg-white [&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:p-0 [&_.ProseMirror_p]:my-2"
        />
      </div>

      {!isNew && ticketAssignees.length > 0 && (
        <div>
          <Label>Assignees</Label>
          <div className="mt-2 flex gap-2">
            {ticketAssignees.map((assignee) => (
              <Avatar key={assignee.user.id} className="h-8 w-8">
                <AvatarImage src={assignee.user.avatar || undefined} />
                <AvatarFallback>
                  {assignee.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const detailsLayout = (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
      <div className="min-w-0">
        {ticketDetailsFields}
      </div>
      <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
        {customFieldsPanel}
      </div>
    </div>
  )

  const createTicketBodyContent = (
    <div className="mt-4 flex-1 overflow-y-auto">
      <div className="pb-2">
        {detailsLayout}
      </div>
    </div>
  )

  // Common footer
  const footerContent = (
    <div className="flex flex-col items-end gap-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!isNew && serviceDeskConfig?.isConfigured && (
          <Button variant="outline" onClick={handlePushToServiceDesk} disabled={pushingToServiceDesk}>
            {pushingToServiceDesk ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
            Push to ServiceDesk
          </Button>
        )}
        {!isNew && gitLabConfig?.isConfigured && (
          <>
            {gitLabRepositories.length > 0 && (
              <SearchableSelect
                value={selectedRepository}
                onValueChange={setSelectedRepository}
                options={[
                  { value: '', label: 'Default Repository' },
                  ...gitLabRepositories.map((repo) => ({ value: repo.projectId, label: repo.name })),
                ]}
                placeholder="Repository"
                searchPlaceholder="Search repositories..."
                className="w-48"
              />
            )}
            <Button variant="outline" onClick={handlePushToGitLab} disabled={pushingToGitLab || loadingRepositories}>
              {pushingToGitLab ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <GitBranch className="h-4 w-4 mr-2" />}
              {gitLabIssueUrl ? 'Update GitLab Issue' : 'Push to GitLab'}
            </Button>
          </>
        )}
        {!isNew && gitLabIssueUrl && (
          <Button variant="outline" onClick={() => window.open(gitLabIssueUrl, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View in GitLab
          </Button>
        )}
        {onDelete && !isNew && (
          <Button variant="destructive" onClick={() => onDelete(ticket.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[160px]">
          {isNew ? 'Create Ticket' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )

  // Body content — simple form for new, full tabs for existing
  const bodyContent = (
    <div className="mt-4 flex-1 overflow-y-auto">
      {isNew ? (
        // Simple create form — same fields, no inapplicable tabs
        <div className="space-y-4">
          <div>
            <Label>Ticket Description</Label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <RichMarkdownEditor
                content={editDescription}
                onChange={setEditDescription}
                placeholder="Describe the ticket inline..."
                editable
                showToolbar
                className="min-h-[220px] bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Estimate (hours)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={editEstimate}
                onChange={(e) => setEditEstimate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-create">Project</Label>
              <Select
                value={selectedProject || '__none__'}
                onValueChange={(value) => {
                  const nextProjectId = value === '__none__' ? '' : value
                  setSelectedProject(nextProjectId)
                  setSelectedModule('')
                  setSelectedMilestone('')
                  setSelectedRelease('')
                  applyProjectFieldDefinitions(nextProjectId, projects)
                }}
              >
                <SelectTrigger className="mt-1" id="project-create">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <div>
                <Label htmlFor="module-create">Module</Label>
                <Select value={selectedModule || '__none__'} onValueChange={(value) => setSelectedModule(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="module-create">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {selectedProject && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="milestone-create">Milestone</Label>
                <Select value={selectedMilestone || '__none__'} onValueChange={(value) => setSelectedMilestone(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="milestone-create">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {milestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="release-create">Release</Label>
                <Select value={selectedRelease || '__none__'} onValueChange={(value) => setSelectedRelease(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="release-create">
                    <SelectValue placeholder="Select release" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {releases.map((release) => (
                      <SelectItem key={release.id} value={release.id}>
                        {release.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <div>
              <Label>Custom Fields</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                These fields are inherited from the selected project and apply to every ticket in that project.
              </p>
            </div>
            {!selectedProject ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                Select a project to load its shared ticket fields.
              </div>
            ) : customFields.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                This project has no shared custom fields yet.
              </div>
            ) : (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={`${field.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
                    <div className="space-y-2">
                      <Label>{field.displayName}</Label>
                      {renderFieldInput(field, index)}
                    </div>
                    <Input value={field.type} disabled className="bg-muted/70" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 grid-cols-[48px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col items-center gap-2 border-r border-border pr-2">
            {[
              { value: 'details', label: 'Details', icon: AlignLeft },
              { value: 'comments', label: `Comments ${comments.length > 0 ? comments.length : ''}`.trim(), icon: MessageSquare },
              { value: 'attachments', label: `Files ${attachments.length > 0 ? attachments.length : ''}`.trim(), icon: Paperclip },
              { value: 'subtasks', label: `Subtasks ${subtasks.length > 0 ? subtasks.length : ''}`.trim(), icon: ListChecks },
              { value: 'dependencies', label: 'Dependencies', icon: GitBranch },
              { value: 'relationships', label: 'Relationships', icon: Network },
              { value: 'time', label: `Time ${totalHours > 0 ? `${totalHours.toFixed(1)}h` : ''}`.trim(), icon: Clock },
              ...(serviceDeskConfig?.isConfigured ? [{ value: 'servicedesk', label: 'ServiceDesk', icon: ExternalLink }] : []),
            ].map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={activeTab === item.value ? 'secondary' : 'ghost'}
                  size="icon"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setActiveTab(item.value)}
                  className="h-9 w-9 rounded-md"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
          <TabsList className="sr-only">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Files {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="relationships">
              <Network className="h-4 w-4 mr-1" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="time">
              Time {totalHours > 0 && `(${totalHours.toFixed(1)}h)`}
            </TabsTrigger>
            {serviceDeskConfig?.isConfigured && (
              <TabsTrigger value="servicedesk">
                ServiceDesk {serviceDeskRequestId && `(${serviceDeskRequestId})`}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="mt-0">
            {detailsLayout}
            {false && (
              <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Estimate (hours)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={editEstimate}
                  onChange={(e) => setEditEstimate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ticketType">Ticket Type</Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="mt-1" id="ticketType">
                  <SelectValue placeholder="Select ticket type (for ServiceDesk)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="Request">Request</SelectItem>
                  <SelectItem value="Change Request">Change Request</SelectItem>
                  <SelectItem value="Issue">Issue</SelectItem>
                  <SelectItem value="Problem">Problem</SelectItem>
                  <SelectItem value="Incident">Incident</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                This will be mapped to ServiceDesk category when pushing
              </p>
            </div>
            <div>
              <Label>Ticket Description</Label>
              <div className="mt-2 overflow-hidden rounded-xl border border-border">
                <RichMarkdownEditor
                  content={editDescription}
                  onChange={setEditDescription}
                  placeholder="Describe the ticket inline..."
                  editable
                  showToolbar
                  className="min-h-[220px] bg-background"
                />
              </div>
            </div>
            {ticketAssignees.length > 0 && (
              <div>
                <Label>Assignees</Label>
                <div className="flex gap-2 mt-2">
                  {ticketAssignees.map((assignee) => (
                    <Avatar key={assignee.user.id} className="h-8 w-8">
                      <AvatarImage src={assignee.user.avatar || undefined} />
                      <AvatarFallback>
                        {assignee.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">Project</Label>
                <Select
                  value={selectedProject || '__none__'}
                  onValueChange={(value) => {
                    const nextProjectId = value === '__none__' ? '' : value
                    setSelectedProject(nextProjectId)
                    setSelectedModule('')
                    setSelectedMilestone('')
                    setSelectedRelease('')
                    applyProjectFieldDefinitions(nextProjectId, projects)
                  }}
                >
                  <SelectTrigger className="mt-1" id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProject && (
                <div>
                <Label htmlFor="module">Module</Label>
                <Select
                  value={selectedModule || '__none__'}
                  onValueChange={(value) => setSelectedModule(value === '__none__' ? '' : value)}
                >
                  <SelectTrigger className="mt-1" id="module">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {selectedProject && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                <Label htmlFor="milestone">Milestone</Label>
                <Select
                  value={selectedMilestone || '__none__'}
                  onValueChange={(value) => setSelectedMilestone(value === '__none__' ? '' : value)}
                >
                    <SelectTrigger className="mt-1" id="milestone">
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          {milestone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                <Label htmlFor="release">Release</Label>
                <Select
                  value={selectedRelease || '__none__'}
                  onValueChange={(value) => setSelectedRelease(value === '__none__' ? '' : value)}
                >
                    <SelectTrigger className="mt-1" id="release">
                      <SelectValue placeholder="Select release" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {releases.map((release) => (
                        <SelectItem key={release.id} value={release.id}>
                          {release.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <Label>Custom Fields</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  These fields are inherited from the selected project and apply to every ticket in that project.
                </p>
              </div>
              {!selectedProject ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Select a project to load its shared ticket fields.
                </div>
              ) : customFields.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  This project has no shared custom fields yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field, index) => (
                    <div key={`${field.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
                      <div className="space-y-2">
                        <Label>{field.displayName}</Label>
                        <Input
                          value={field.value || ''}
                          onChange={(e) =>
                            setCustomFields((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, value: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Value"
                        />
                      </div>
                      <Input value={field.type} disabled className="bg-muted/70" />
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}
          </TabsContent>

          <CommentsTab
            comments={comments}
            newComment={newComment}
            setNewComment={setNewComment}
            onAddComment={handleAddComment}
          />

          <AttachmentsTab
            attachments={attachments}
            onUploadAttachment={handleUploadAttachment}
          />

          <SubtasksTab
            subtasks={subtasks}
            newSubtask={newSubtask}
            setNewSubtask={setNewSubtask}
            onAddSubtask={handleAddSubtask}
            onToggleSubtaskStatus={handleToggleSubtaskStatus}
          />

          <DependenciesTab dependencies={dependencies} />

          <RelationshipsTab
            ticketId={ticket.id}
            onAddRelationship={() => showInfo('Feature to add relationships coming soon')}
            onViewTicket={() => showInfo('Feature to view related tickets coming soon')}
          />

          <TimeTab
            ticket={ticket}
            timeLogs={timeLogs}
            totalHours={totalHours}
            newTimeLog={newTimeLog}
            setNewTimeLog={setNewTimeLog}
            onAddTimeLog={handleAddTimeLog}
          />

          {serviceDeskConfig?.isConfigured && (
            <TabsContent value="servicedesk" className="space-y-4 mt-4">
              <div className="space-y-4">
                {serviceDeskRequestId ? (
                  <>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">ServiceDesk Request ID</div>
                            <div className="text-lg font-bold">{serviceDeskRequestId}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleUpdateServiceDeskTicket}
                              disabled={updatingServiceDesk}
                            >
                              {updatingServiceDesk ? (
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Edit className="h-4 w-4 mr-2" />
                              )}
                              Update Ticket
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSyncFromServiceDesk}
                              disabled={syncingFromServiceDesk}
                            >
                              {syncingFromServiceDesk ? (
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <ExternalLink className="h-4 w-4 mr-2" />
                              )}
                              Sync from ServiceDesk
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDeleteServiceDeskTicket}
                              disabled={deletingServiceDesk}
                              className="text-destructive hover:text-destructive"
                            >
                              {deletingServiceDesk ? (
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">ServiceDesk Comments</Label>
                        <div className="space-y-2 mb-4">
                          {serviceDeskComments.map((comment, idx) => (
                            <Card key={idx}>
                              <CardContent className="p-3">
                                <div className="text-sm">{comment.content || comment.description}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {comment.created_time ? format(new Date(comment.created_time), 'MMM d, yyyy HH:mm') : ''}
                                  {comment.technician?.name && ` by ${comment.technician.name}`}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Add a comment to ServiceDesk..."
                            value={newServiceDeskComment}
                            onChange={(e) => setNewServiceDeskComment(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleAddServiceDeskComment} disabled={!newServiceDeskComment.trim()}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">ServiceDesk Attachments</Label>
                        <div className="space-y-2 mb-4">
                          {serviceDeskAttachments.map((attachment, idx) => (
                            <Card key={idx}>
                              <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium text-sm">{attachment.file_name || attachment.name}</div>
                                    {attachment.file_size && (
                                      <div className="text-xs text-muted-foreground">
                                        {(attachment.file_size / 1024).toFixed(2)} KB
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <Input
                          type="file"
                          onChange={handleUploadServiceDeskAttachment}
                          className="cursor-pointer"
                        />
                      </div>

                      <div>
                        <Label className="mb-2 block">ServiceDesk Time Logs</Label>
                        <div className="space-y-2 mb-4">
                          {serviceDeskTimeLogs.map((log, idx) => (
                            <Card key={idx}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {log.hours || 0}h {log.minutes || 0}m
                                    </div>
                                    {log.description && (
                                      <div className="text-sm text-muted-foreground mt-1">{log.description}</div>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {log.technician?.name || log.created_by?.name}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.25"
                            placeholder="Hours"
                            value={newServiceDeskTimeLog.hours}
                            onChange={(e) => setNewServiceDeskTimeLog({ ...newServiceDeskTimeLog, hours: e.target.value })}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="Minutes"
                            value={newServiceDeskTimeLog.minutes}
                            onChange={(e) => setNewServiceDeskTimeLog({ ...newServiceDeskTimeLog, minutes: e.target.value })}
                            className="w-24"
                          />
                          <Input
                            placeholder="Description (optional)"
                            value={newServiceDeskTimeLog.description}
                            onChange={(e) => setNewServiceDeskTimeLog({ ...newServiceDeskTimeLog, description: e.target.value })}
                            className="flex-1"
                          />
                          <Button onClick={handleLogServiceDeskTime} disabled={!newServiceDeskTimeLog.hours}>
                            <Clock className="h-4 w-4 mr-2" />
                            Log Time
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Set Resolution</Label>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Enter resolution details..."
                            value={newServiceDeskResolution}
                            onChange={(e) => setNewServiceDeskResolution(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleSetServiceDeskResolution} disabled={!newServiceDeskResolution.trim()}>
                            Set Resolution
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Link Tickets</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="ServiceDesk Request ID"
                            value={newServiceDeskLink.requestId}
                            onChange={(e) => setNewServiceDeskLink({ ...newServiceDeskLink, requestId: e.target.value })}
                            className="flex-1"
                          />
                          <SearchableSelect
                            value={newServiceDeskLink.linkType}
                            onValueChange={(value) => setNewServiceDeskLink({ ...newServiceDeskLink, linkType: value })}
                            options={[
                              { value: 'relates_to', label: 'Relates To' },
                              { value: 'duplicate', label: 'Duplicate' },
                              { value: 'depends_on', label: 'Depends On' },
                              { value: 'blocked_by', label: 'Blocked By' },
                            ]}
                            searchPlaceholder="Search link types..."
                            className="w-40"
                          />
                          <Button onClick={handleLinkServiceDeskTickets} disabled={!newServiceDeskLink.requestId}>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Link
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Search ServiceDesk Tickets</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search by subject, ID, or requester..."
                            id="servicedesk-search"
                            className="flex-1"
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                const spaceId = getTicketSpaceId(ticket)
                                if (!spaceId) return
                                
                                try {
                                  const data = await searchServiceDeskTickets(spaceId, e.currentTarget.value)
                                  showInfo(`Found ${data.total || 0} ticket(s)`)
                                  // In a full implementation, show results in a dialog
                                } catch (error) {
                                  console.error('Search error:', error)
                                }
                              }
                            }}
                          />
                          <Button variant="outline">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        This ticket has not been pushed to ServiceDesk yet.
                      </p>
                      <Button
                        onClick={handlePushToServiceDesk}
                        disabled={pushingToServiceDesk}
                      >
                        {pushingToServiceDesk ? (
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Push to ServiceDesk
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
        </div>
        )}
      </div>
    )

  if (isDrawer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[96vw] sm:max-w-[1100px] overflow-y-auto flex flex-col gap-0 bg-white p-0 text-zinc-950">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="sr-only">Ticket</SheetTitle>
            {headerContent}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isNew ? createTicketBodyContent : bodyContent}
          </div>
          <div className="px-6 py-4 border-t">
            {footerContent}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-white text-zinc-950">
        <DialogHeader className="flex-shrink-0">
          {headerContent}
        </DialogHeader>
        <DialogBody className="flex-1 overflow-y-auto min-h-0 pt-4">
          {isNew ? createTicketBodyContent : bodyContent}
        </DialogBody>
        <DialogFooter className="flex-shrink-0 mt-0 pt-0 border-t-0">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

