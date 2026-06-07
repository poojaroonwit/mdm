// @ts-nocheck
'use client'

import {
  addServiceDeskComment,
  checkServiceDeskConflicts,
  deleteServiceDeskTicket,
  fetchGitLabRepositories,
  fetchServiceDeskData,
  linkServiceDeskTickets,
  logServiceDeskTime,
  pushTicketToGitLab,
  pushTicketToServiceDesk,
  resolveServiceDeskConflicts,
  setServiceDeskResolution,
  syncTicketFromServiceDesk,
  updateServiceDeskTicket,
  uploadServiceDeskAttachment,
} from './ticket-detail-api'
import { getTicketSpaceId } from './ticket-detail-helpers'
import { buildServiceDeskUpdates } from './ticket-detail-mappers'
import { showError, showSuccess } from '@/lib/toast-utils'

export function useTicketDetailIntegrationActions(params: any) {
  const {
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
  } = params

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



  return {
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
  }
}
