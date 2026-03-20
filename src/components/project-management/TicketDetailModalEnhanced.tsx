'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  Calendar, Clock, User, X, Plus, MessageSquare, Paperclip, 
  ListChecks, GitBranch, Trash2, Edit, Download, ExternalLink, Loader, Network
} from 'lucide-react'
import { TicketRelationshipGraph } from './TicketRelationshipGraph'
import { TicketRelationshipsPanel } from './TicketRelationshipsPanel'
import { format } from 'date-fns'
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'

interface TicketDetailModalProps {
  ticket: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    dueDate?: string | null
    estimate?: number | null
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
    attributes?: Array<{
      name: string
      value?: string | null
      jsonValue?: any
    }>
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (ticket: any) => void
  onDelete?: (ticketId: string) => void
  displayMode?: 'modal' | 'drawer'
}

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
  const [editEstimate, setEditEstimate] = useState('')

  const [activeTab, setActiveTab] = useState('details')
  const [comments, setComments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [subtasks, setSubtasks] = useState<any[]>([])
  const [dependencies, setDependencies] = useState<{ dependencies: any[], dependents: any[] }>({ dependencies: [], dependents: [] })
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState({ title: '', status: 'BACKLOG' })
  const [newTimeLog, setNewTimeLog] = useState({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })
  const [pushingToServiceDesk, setPushingToServiceDesk] = useState(false)
  const [serviceDeskConfig, setServiceDeskConfig] = useState<any>(null)
  const [ticketType, setTicketType] = useState<string>('')
  const [serviceDeskRequestId, setServiceDeskRequestId] = useState<string | null>(null)
  const [serviceDeskComments, setServiceDeskComments] = useState<any[]>([])
  const [serviceDeskAttachments, setServiceDeskAttachments] = useState<any[]>([])
  const [serviceDeskTimeLogs, setServiceDeskTimeLogs] = useState<any[]>([])
  const [syncingFromServiceDesk, setSyncingFromServiceDesk] = useState(false)
  const [newServiceDeskComment, setNewServiceDeskComment] = useState('')
  const [newServiceDeskResolution, setNewServiceDeskResolution] = useState('')
  const [newServiceDeskTimeLog, setNewServiceDeskTimeLog] = useState({ hours: '', minutes: '', description: '' })
  const [newServiceDeskLink, setNewServiceDeskLink] = useState({ requestId: '', linkType: 'relates_to' })
  const [updatingServiceDesk, setUpdatingServiceDesk] = useState(false)
  const [deletingServiceDesk, setDeletingServiceDesk] = useState(false)
  const [pushingToGitLab, setPushingToGitLab] = useState(false)
  const [gitLabConfig, setGitLabConfig] = useState<any>(null)
  const [gitLabIssueUrl, setGitLabIssueUrl] = useState<string | null>(null)
  const [gitLabRepositories, setGitLabRepositories] = useState<Array<{id: number, projectId: string, name: string, path: string}>>([])
  const [selectedRepository, setSelectedRepository] = useState<string>('')
  const [loadingRepositories, setLoadingRepositories] = useState(false)
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [modules, setModules] = useState<Array<{id: string, name: string, projectId: string}>>([])
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [milestones, setMilestones] = useState<Array<{id: string, name: string, projectId: string}>>([])
  const [selectedMilestone, setSelectedMilestone] = useState<string>('')
  const [releases, setReleases] = useState<Array<{id: string, name: string, projectId: string}>>([])
  const [selectedRelease, setSelectedRelease] = useState<string>('')

  useEffect(() => {
    if (ticket && open) {
      setEditTitle(ticket.title || '')
      setEditDescription(ticket.description || '')
      setEditStatus(ticket.status || 'BACKLOG')
      setEditPriority(ticket.priority || 'MEDIUM')
      setEditDueDate((ticket as any).dueDate || '')
      setEditEstimate((ticket as any).estimate?.toString() || '')
    }
  }, [ticket, open])

  useEffect(() => {
    if (ticket?.id && open) {
      loadAllData()
      checkServiceDeskConfig()
      checkGitLabConfig()
      loadProjectsAndModules()
      // Load ticket type from attributes
      const typeAttr = ticket.attributes?.find(attr => 
        attr.name.toLowerCase() === 'ticket type' || 
        attr.name.toLowerCase() === 'type' ||
        attr.name.toLowerCase() === 'tickettype'
      )
      if (typeAttr) {
        setTicketType(String(typeAttr.value || ''))
      } else {
        // Check tags for ticket type
        const typeTags = ['Request', 'Change', 'Change Request', 'Issue', 'Problem', 'Incident']
        const foundTypeTag = ticket.tags?.find(tag => 
          typeTags.some(type => tag.name.toLowerCase().includes(type.toLowerCase()))
        )
        if (foundTypeTag) {
          setTicketType(foundTypeTag.name)
        } else {
          setTicketType('')
        }
      }
      // Load ServiceDesk request ID from metadata
      const metadata = (ticket as any).metadata
      if (metadata?.serviceDeskRequestId) {
        setServiceDeskRequestId(metadata.serviceDeskRequestId)
        loadServiceDeskData(metadata.serviceDeskRequestId)
      }
      // Load GitLab issue URL and repository from metadata
      if (metadata?.gitlabIssueUrl) {
        setGitLabIssueUrl(metadata.gitlabIssueUrl)
      }
      if (metadata?.gitlabRepository || metadata?.gitlabProjectId) {
        setSelectedRepository(metadata.gitlabRepository || metadata.gitlabProjectId)
      }
      // Load project/module/milestone/release from ticket
      if ((ticket as any).projectId) {
        setSelectedProject((ticket as any).projectId)
      }
      if ((ticket as any).moduleId) {
        setSelectedModule((ticket as any).moduleId)
      }
      if ((ticket as any).milestoneId) {
        setSelectedMilestone((ticket as any).milestoneId)
      }
      if ((ticket as any).releaseId) {
        setSelectedRelease((ticket as any).releaseId)
      }
    }
  }, [ticket?.id, open, ticket?.attributes, ticket?.tags])

  const checkServiceDeskConfig = async () => {
    if (!ticket?.spaces || ticket.spaces.length === 0) return
    
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const response = await fetch(`/api/integrations/manageengine-servicedesk?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        setServiceDeskConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to check ServiceDesk config:', error)
    }
  }

  const checkGitLabConfig = async () => {
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        const gitlabIntegration = data.integrations?.find((i: any) => 
          i.type?.toLowerCase() === 'gitlab' && i.status === 'active' && i.isEnabled
        )
        if (gitlabIntegration) {
          setGitLabConfig({ isConfigured: true, ...gitlabIntegration })
          // Load repositories
          loadGitLabRepositories()
        }
      }
    } catch (error) {
      console.error('Failed to check GitLab config:', error)
    }
  }

  const loadGitLabRepositories = async () => {
    setLoadingRepositories(true)
    try {
      const response = await fetch('/api/integrations/gitlab/repositories')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.repositories) {
          setGitLabRepositories(data.repositories)
        }
      }
    } catch (error) {
      console.error('Failed to load GitLab repositories:', error)
    } finally {
      setLoadingRepositories(false)
    }
  }

  const loadProjectsAndModules = async () => {
    if (!ticket?.spaces || ticket.spaces.length === 0) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      // Load projects
      const projectsRes = await fetch(`/api/projects?space_id=${spaceId}`)
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      // Load modules if project is selected
      if (selectedProject) {
        const modulesRes = await fetch(`/api/modules?project_id=${selectedProject}`)
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json()
          setModules(modulesData.modules || [])
        }
      }

      // Load milestones if project is selected
      if (selectedProject) {
        const milestonesRes = await fetch(`/api/milestones?projectId=${selectedProject}`)
        if (milestonesRes.ok) {
          const milestonesData = await milestonesRes.json()
          setMilestones(milestonesData.milestones || [])
        }
      }

      // Load releases if project is selected
      if (selectedProject) {
        const releasesRes = await fetch(`/api/releases?projectId=${selectedProject}`)
        if (releasesRes.ok) {
          const releasesData = await releasesRes.json()
          setReleases(releasesData.releases || [])
        }
      }
    } catch (error) {
      console.error('Failed to load projects/modules:', error)
    }
  }

  useEffect(() => {
    if (selectedProject) {
      loadProjectsAndModules()
    }
  }, [selectedProject])

  const handlePushToGitLab = async () => {
    if (!ticket?.spaces || ticket.spaces.length === 0) {
      showError('Unable to determine space')
      return
    }

    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) {
      showError('Unable to determine space')
      return
    }

    setPushingToGitLab(true)
    try {
      const response = await fetch('/api/integrations/gitlab/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          space_id: spaceId,
          syncComments: true,
          syncAttachments: false,
          repository: selectedRepository || undefined,
          projectId: selectedRepository || undefined
        })
      })

      const result = await response.json()

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
    if (!ticket?.spaces || ticket.spaces.length === 0) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const [commentsRes, attachmentsRes, timeLogsRes] = await Promise.all([
        fetch(`/api/integrations/manageengine-servicedesk/comments?space_id=${spaceId}&request_id=${requestId}`),
        fetch(`/api/integrations/manageengine-servicedesk/attachments?space_id=${spaceId}&request_id=${requestId}`),
        fetch(`/api/integrations/manageengine-servicedesk/time-logs?space_id=${spaceId}&request_id=${requestId}`)
      ])

      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setServiceDeskComments(data.comments || [])
      }
      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json()
        setServiceDeskAttachments(data.attachments || [])
      }
      if (timeLogsRes.ok) {
        const data = await timeLogsRes.json()
        setServiceDeskTimeLogs(data.timeLogs || [])
      }
    } catch (error) {
      console.error('Error loading ServiceDesk data:', error)
    }
  }

  const handlePushToServiceDesk = async () => {
    if (!ticket?.spaces || ticket.spaces.length === 0) {
      showError('Ticket must belong to a space')
      return
    }

    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) {
      showError('Unable to determine space')
      return
    }

    setPushingToServiceDesk(true)
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          space_id: spaceId,
          requesterEmail: ticket.creator?.email,
          syncComments: true,
          syncAttachments: true,
          syncTimeLogs: true
        })
      })

      const result = await response.json()

      if (result.success) {
        setServiceDeskRequestId(result.requestId)
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
    if (!ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    setSyncingFromServiceDesk(true)
    try {
      // Check for conflicts first
      const conflictResponse = await fetch('/api/integrations/manageengine-servicedesk/conflict-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          space_id: spaceId,
          request_id: serviceDeskRequestId
        })
      })

      const conflictData = await conflictResponse.json()

      if (conflictData.has_conflicts && conflictData.conflicts.length > 0) {
        // Show conflict resolution dialog
        const resolution: any = {}
        for (const conflict of conflictData.conflicts) {
          // For now, default to keeping ServiceDesk version
          // In a full implementation, you'd show a dialog to let user choose
          resolution[conflict.field] = 'keep_servicedesk'
        }

        // Resolve conflicts
        const resolveResponse = await fetch('/api/integrations/manageengine-servicedesk/conflict-resolution', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: ticket.id,
            space_id: spaceId,
            request_id: serviceDeskRequestId,
            resolution
          })
        })

        const resolveResult = await resolveResponse.json()
        if (!resolveResult.success) {
          showError(resolveResult.error || 'Failed to resolve conflicts')
          setSyncingFromServiceDesk(false)
          return
        }
      }

      // Proceed with sync
      const response = await fetch('/api/integrations/manageengine-servicedesk/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          space_id: spaceId,
          request_id: serviceDeskRequestId
        })
      })

      const result = await response.json()

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
    if (!newServiceDeskComment.trim() || !ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          content: newServiceDeskComment,
          isPublic: true
        })
      })

      const result = await response.json()

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
    if (!newServiceDeskResolution.trim() || !ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          resolution: newServiceDeskResolution
        })
      })

      const result = await response.json()

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
    if (!newServiceDeskTimeLog.hours || !ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          hours: parseFloat(newServiceDeskTimeLog.hours),
          minutes: newServiceDeskTimeLog.minutes ? parseInt(newServiceDeskTimeLog.minutes) : undefined,
          description: newServiceDeskTimeLog.description || undefined
        })
      })

      const result = await response.json()

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
    if (!newServiceDeskLink.requestId || !ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          linked_request_id: newServiceDeskLink.requestId,
          link_type: newServiceDeskLink.linkType
        })
      })

      const result = await response.json()

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
    if (!file || !ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    try {
      const formData = new FormData()
      formData.append('space_id', spaceId)
      formData.append('request_id', serviceDeskRequestId)
      formData.append('file', file)
      formData.append('description', `Uploaded from internal ticket ${ticket.id}`)

      const response = await fetch('/api/integrations/manageengine-servicedesk/attachments', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

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
    if (!ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    setUpdatingServiceDesk(true)
    try {
      // Map our ticket status to ServiceDesk status
      const statusMap: Record<string, string> = {
        'BACKLOG': 'Open',
        'TODO': 'Open',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'In Progress',
        'DONE': 'Resolved',
        'CLOSED': 'Closed'
      }

      // Map our priority to ServiceDesk priority
      const priorityMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'URGENT': 'Critical'
      }

      const updates: any = {}
      
      if (ticket.title) {
        updates.subject = ticket.title
      }
      if (ticket.description) {
        updates.description = ticket.description
      }
      if (ticket.status) {
        updates.status = statusMap[ticket.status] || 'Open'
      }
      if (ticket.priority) {
        updates.priority = priorityMap[ticket.priority] || 'Medium'
      }
      if (ticket.dueDate) {
        updates.dueDate = ticket.dueDate && typeof ticket.dueDate === 'object' && 'toISOString' in ticket.dueDate
          ? (ticket.dueDate as Date).toISOString() 
          : new Date(ticket.dueDate as string).toISOString()
      }

      const response = await fetch('/api/integrations/manageengine-servicedesk/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          updates
        })
      })

      const result = await response.json()

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
    if (!ticket?.spaces || ticket.spaces.length === 0 || !serviceDeskRequestId) return
    const spaceId = ticket.spaces[0].spaceId || ticket.spaces[0].space?.id
    if (!spaceId) return

    if (!confirm(`Are you sure you want to delete ticket ${serviceDeskRequestId} from ServiceDesk? This action cannot be undone.`)) {
      return
    }

    setDeletingServiceDesk(true)
    try {
      const response = await fetch('/api/integrations/manageengine-servicedesk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          request_id: serviceDeskRequestId,
          ticket_id: ticket.id
        })
      })

      const result = await response.json()

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
      const [commentsRes, attachmentsRes, subtasksRes, depsRes, timeLogsRes] = await Promise.all([
        fetch(`/api/tickets/${ticket.id}/comments`),
        fetch(`/api/tickets/${ticket.id}/attachments`),
        fetch(`/api/tickets/${ticket.id}/subtasks`),
        fetch(`/api/tickets/${ticket.id}/dependencies`),
        fetch(`/api/tickets/${ticket.id}/time-logs`)
      ])

      if (commentsRes.ok) {
        const data = await commentsRes.json()
        setComments(data.comments || [])
      }
      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json()
        setAttachments(data.attachments || [])
      }
      if (subtasksRes.ok) {
        const data = await subtasksRes.json()
        setSubtasks(data.subtasks || [])
      }
      if (depsRes.ok) {
        const data = await depsRes.json()
        setDependencies(data)
      }
      if (timeLogsRes.ok) {
        const data = await timeLogsRes.json()
        setTimeLogs(data.timeLogs || [])
      }
    } catch (error) {
      console.error('Error loading ticket data:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      if (res.ok) {
        const comment = await res.json()
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
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/tickets/${ticket.id}/attachments`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const attachment = await res.json()
        setAttachments([...attachments, attachment])
      }
    } catch (error) {
      console.error('Error uploading attachment:', error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtask.title.trim() || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubtask)
      })
      if (res.ok) {
        const subtask = await res.json()
        setSubtasks([...subtasks, subtask])
        setNewSubtask({ title: '', status: 'BACKLOG' })
      }
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  const handleAddTimeLog = async () => {
    if (!newTimeLog.hours || !ticket?.id) return

    try {
      const res = await fetch(`/api/tickets/${ticket.id}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseFloat(newTimeLog.hours),
          description: newTimeLog.description,
          loggedAt: newTimeLog.loggedAt
        })
      })
      if (res.ok) {
        const timeLog = await res.json()
        setTimeLogs([...timeLogs, timeLog])
        setNewTimeLog({ hours: '', description: '', loggedAt: format(new Date(), 'yyyy-MM-dd') })
      }
    } catch (error) {
      console.error('Error adding time log:', error)
    }
  }

  if (!ticket) return null

  const isNew = !(ticket as any).id
  const isDrawer = displayMode === 'drawer'
  const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)

  const handleSave = async () => {
    const updatedTicket = {
      ...ticket,
      title: editTitle,
      description: editDescription,
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate || null,
      estimate: editEstimate ? Number(editEstimate) : null,
      projectId: selectedProject || null,
      moduleId: selectedModule || null,
      milestoneId: selectedMilestone || null,
      releaseId: selectedRelease || null,
    }

    if (ticket?.id) {
      try {
        const updateData: any = {}
        if (selectedProject) updateData.projectId = selectedProject
        else updateData.projectId = null
        if (selectedModule) updateData.moduleId = selectedModule
        else updateData.moduleId = null
        if (selectedMilestone) updateData.milestoneId = selectedMilestone
        else updateData.milestoneId = null
        if (selectedRelease) updateData.releaseId = selectedRelease
        else updateData.releaseId = null

        if (Object.keys(updateData).length > 0) {
          await fetch(`/api/tickets/${ticket.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
        }
      } catch (error) {
        console.error('Error saving project/module:', error)
      }

      if (ticketType && ticket?.id) {
        try {
          const existingAttr = ticket.attributes?.find(attr =>
            attr.name.toLowerCase() === 'ticket type' ||
            attr.name.toLowerCase() === 'type' ||
            attr.name.toLowerCase() === 'tickettype'
          )
          if (existingAttr && (existingAttr as any).id) {
            await fetch(`/api/tickets/${ticket.id}/attributes`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ attributeId: (existingAttr as any).id, value: ticketType })
            })
          } else {
            await fetch(`/api/tickets/${ticket.id}/attributes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Ticket Type', displayName: 'Ticket Type', type: 'SELECT', value: ticketType })
            })
          }
        } catch (error) {
          console.error('Error saving ticket type:', error)
        }
      }
    }

    onSave?.(updatedTicket)
  }

  // Common header content
  const headerContent = (
    <>
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        placeholder="Ticket title..."
        className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent h-auto py-1"
      />
      <p className="text-sm text-muted-foreground mt-1">
        {isNew ? 'Fill in the details to create a new ticket.' : 'Manage ticket details and activities.'}
      </p>
    </>
  )

  // Common footer
  const footerContent = (
    <div className="flex gap-2 pt-4 border-t">
      {!isNew && serviceDeskConfig?.isConfigured && (
        <Button variant="outline" onClick={handlePushToServiceDesk} disabled={pushingToServiceDesk}>
          {pushingToServiceDesk ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          Push to ServiceDesk
        </Button>
      )}
      {!isNew && gitLabConfig?.isConfigured && (
        <>
          {gitLabRepositories.length > 0 && (
            <Select value={selectedRepository} onValueChange={setSelectedRepository}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Repository" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default Repository</SelectItem>
                {gitLabRepositories.map((repo) => (
                  <SelectItem key={repo.id} value={repo.projectId}>{repo.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      <Button onClick={handleSave} className="flex-1">
        {isNew ? 'Create Ticket' : 'Save Changes'}
      </Button>
      {onDelete && !isNew && (
        <Button variant="destructive" onClick={() => onDelete((ticket as any).id)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  )

  // Body content — simple form for new, full tabs for existing
  const bodyContent = (
    <div className="mt-4 flex-1 overflow-y-auto">
      {isNew ? (
        // Simple create form — same fields, no inapplicable tabs
        <div className="space-y-4">
          <div>
            <Label>Description</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe the ticket..."
              rows={4}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
          <div className="grid grid-cols-2 gap-4">
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
        </div>
      ) : (
        // Full tabbed view for existing tickets
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
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

        <div className="mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
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

          <TabsContent value="details" className="space-y-4 mt-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe the ticket..."
                rows={3}
                className="mt-1"
              />
            </div>
            {ticket.assignees && ticket.assignees.length > 0 && (
              <div>
                <Label>Assignees</Label>
                <div className="flex gap-2 mt-2">
                  {ticket.assignees.map((assignee) => (
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
                  value={selectedProject}
                  onValueChange={(value) => {
                    setSelectedProject(value)
                    setSelectedModule('')
                    setSelectedMilestone('')
                    setSelectedRelease('')
                  }}
                >
                  <SelectTrigger className="mt-1" id="project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
                    value={selectedModule}
                    onValueChange={setSelectedModule}
                  >
                    <SelectTrigger className="mt-1" id="module">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                    value={selectedMilestone}
                    onValueChange={setSelectedMilestone}
                  >
                    <SelectTrigger className="mt-1" id="milestone">
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
                    value={selectedRelease}
                    onValueChange={setSelectedRelease}
                  >
                    <SelectTrigger className="mt-1" id="release">
                      <SelectValue placeholder="Select release" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
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
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar || undefined} />
                        <AvatarFallback>
                          {comment.author?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <Card key={attachment.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{attachment.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          {(attachment.fileSize / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              <div>
                <Input
                  type="file"
                  onChange={handleUploadAttachment}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Todo List / Subtasks ({subtasks.length})
              </div>
              {subtasks.map((subtask) => {
                const subtaskMetadata = (subtask as any).metadata || {}
                const isCompleted = subtask.status === 'DONE' || subtask.status === 'CANCELLED'
                return (
                  <Card key={subtask.id} className={isCompleted ? 'opacity-60' : ''}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={isCompleted}
                          onChange={async () => {
                            // Toggle subtask status
                            const newStatus = isCompleted ? 'TODO' : 'DONE'
                            try {
                              const response = await fetch(`/api/tickets/${subtask.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus })
                              })
                              if (response.ok) {
                                loadAllData()
                                showSuccess(`Subtask ${newStatus === 'DONE' ? 'completed' : 'reopened'}`)
                              }
                            } catch (error) {
                              showError('Failed to update subtask')
                            }
                          }}
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${isCompleted ? 'line-through' : ''}`}>
                            {subtask.title}
                          </span>
                          {subtaskMetadata?.gitlabRepository && (
                            <Badge variant="outline" className="text-xs ml-2">
                              <GitBranch className="h-3 w-3 mr-1" />
                              {subtaskMetadata.gitlabRepository.split('/').pop()}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">{subtask.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              <div className="flex gap-2">
                <Input
                  placeholder="Subtask title"
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  className="flex-1"
                />
                <Button onClick={handleAddSubtask} disabled={!newSubtask.title.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4 mt-4">
            <div className="space-y-4">
              {dependencies.dependencies.length > 0 && (
                <div>
                  <Label className="mb-2 block">Depends On</Label>
                  {dependencies.dependencies.map((dep) => (
                    <Card key={dep.id} className="mb-2">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{dep.dependsOn?.title}</span>
                          <Badge variant="outline">{dep.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {dependencies.dependents.length > 0 && (
                <div>
                  <Label className="mb-2 block">Blocks</Label>
                  {dependencies.dependents.map((dep) => (
                    <Card key={dep.id} className="mb-2">
                      <CardContent className="p-3">
                        <span className="text-sm">{dep.ticket?.title}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4 mt-4">
            <div className="space-y-6">
              <TicketRelationshipGraph
                ticketId={ticket.id}
                onNodeClick={(nodeId, nodeType) => {
                  if (nodeType === 'ticket') {
                    // Could open ticket detail modal
                    console.log('Clicked ticket:', nodeId)
                  }
                }}
                onNodeDoubleClick={(nodeId, nodeType) => {
                  if (nodeType === 'ticket') {
                    // Could open ticket detail modal
                    console.log('Double-clicked ticket:', nodeId)
                  }
                }}
              />
              <TicketRelationshipsPanel
                ticketId={ticket.id}
                onAddRelationship={() => {
                  // Could open a dialog to add relationship
                  showInfo('Feature to add relationships coming soon')
                }}
                onViewTicket={(ticketId) => {
                  // Could open ticket detail modal
                  console.log('View ticket:', ticketId)
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                      <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
                    </div>
                    {ticket.estimate && (
                      <div>
                        <div className="text-sm text-muted-foreground">Estimated</div>
                        <div className="text-2xl font-bold">{ticket.estimate}h</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {timeLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{Number(log.hours).toFixed(2)}h</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.loggedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{log.user?.name}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <Input
                  type="date"
                  value={newTimeLog.loggedAt}
                  onChange={(e) => setNewTimeLog({ ...newTimeLog, loggedAt: e.target.value })}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="Hours"
                    value={newTimeLog.hours}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, hours: e.target.value })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newTimeLog.description}
                    onChange={(e) => setNewTimeLog({ ...newTimeLog, description: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTimeLog} disabled={!newTimeLog.hours}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

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
                          {serviceDeskComments.map((comment: any, idx: number) => (
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
                          {serviceDeskAttachments.map((attachment: any, idx: number) => (
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
                          {serviceDeskTimeLogs.map((log: any, idx: number) => (
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
                          <Select
                            value={newServiceDeskLink.linkType}
                            onValueChange={(value) => setNewServiceDeskLink({ ...newServiceDeskLink, linkType: value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="relates_to">Relates To</SelectItem>
                              <SelectItem value="duplicate">Duplicate</SelectItem>
                              <SelectItem value="depends_on">Depends On</SelectItem>
                              <SelectItem value="blocked_by">Blocked By</SelectItem>
                            </SelectContent>
                          </Select>
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
                                const spaceId = ticket?.spaces?.[0]?.spaceId || ticket?.spaces?.[0]?.space?.id
                                if (!spaceId) return
                                
                                try {
                                  const response = await fetch(
                                    `/api/integrations/manageengine-servicedesk/list?space_id=${spaceId}&search=${encodeURIComponent(e.currentTarget.value)}&row_count=10`
                                  )
                                  if (response.ok) {
                                    const data = await response.json()
                                    showInfo(`Found ${data.total || 0} ticket(s)`)
                                    // In a full implementation, show results in a dialog
                                  }
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
        )}
      </div>
    )

  if (isDrawer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[700px] sm:max-w-[700px] overflow-y-auto flex flex-col gap-0 p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="sr-only">Ticket</SheetTitle>
            {headerContent}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {bodyContent}
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {headerContent}
        </DialogHeader>
        {bodyContent}
        {footerContent}
      </DialogContent>
    </Dialog>
  )
}

