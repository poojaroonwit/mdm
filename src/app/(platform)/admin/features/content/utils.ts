/**
 * Content Feature Utilities
 * Helper functions for content operations
 */

import { Attachment, ChangeRequest, Ticket } from './types'
import { getApprovalStatusColor, getPriorityColor } from '@/lib/status-colors'
import { filterBySearch, filterByValue, filterByStatus } from '@/lib/filter-utils'

/**
 * Filter attachments by search query
 * Uses shared filter utility
 */
export function filterAttachmentsBySearch(
  attachments: Attachment[],
  query: string
): Attachment[] {
  return filterBySearch(attachments, query, ['name', 'originalName', 'description', 'tags'])
}

/**
 * Filter attachments by MIME type
 * Uses shared filter utility
 */
export function filterAttachmentsByType(
  attachments: Attachment[],
  mimeType: string
): Attachment[] {
  return filterByValue(attachments, 'mimeType', mimeType === 'all' ? 'all' : mimeType as any)
}

/**
 * Check if attachment is public
 */
export function isAttachmentPublic(attachment: Attachment): boolean {
  return attachment.isPublic === true
}

/**
 * Get change request status color
 * Uses shared status color utility
 */
export function getChangeRequestStatusColor(status: ChangeRequest['status']): string {
  return getApprovalStatusColor(status as 'approved' | 'rejected' | 'pending' | 'merged')
}

/**
 * Check if change request is pending
 */
export function isChangeRequestPending(changeRequest: ChangeRequest): boolean {
  return changeRequest.status === 'pending'
}

/**
 * Filter change requests by status
 * Uses shared filter utility
 */
export function filterChangeRequestsByStatus(
  changeRequests: ChangeRequest[],
  status: ChangeRequest['status'] | 'all'
): ChangeRequest[] {
  return filterByStatus(changeRequests, status as any)
}

/**
 * Get ticket priority color
 * Uses shared status color utility
 */
export function getTicketPriorityColor(priority: string): string {
  const normalizedPriority = priority.toLowerCase() as 'high' | 'medium' | 'low' | 'critical'
  return getPriorityColor(normalizedPriority)
}

/**
 * Filter tickets by status
 * Uses shared filter utility
 */
export function filterTicketsByStatus(
  tickets: Ticket[],
  status: string
): Ticket[] {
  return filterByStatus(tickets, status === 'all' ? 'all' : status as any)
}

/**
 * Filter tickets by priority
 * Uses shared filter utility
 */
export function filterTicketsByPriority(
  tickets: Ticket[],
  priority: string
): Ticket[] {
  return filterByValue(tickets, 'priority', priority === 'all' ? 'all' : priority as any)
}

