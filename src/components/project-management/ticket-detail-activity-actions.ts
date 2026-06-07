// @ts-nocheck
'use client'

import { format } from 'date-fns'
import {
  addTicketComment,
  addTicketSubtask,
  addTicketTimeLog,
  fetchTicketActivity,
  updateTicketStatus,
  uploadTicketAttachment,
} from './ticket-detail-api'
import { showError, showSuccess } from '@/lib/toast-utils'
import type { TicketSubtask } from './ticket-detail-types'

export function useTicketDetailActivityActions(params: any) {
  const {
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
  } = params

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



  return {
    loadAllData,
    handleAddComment,
    handleUploadAttachment,
    handleAddSubtask,
    handleToggleSubtaskStatus,
    handleAddTimeLog,
  }
}
