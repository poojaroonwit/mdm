/**
 * Content Feature Types
 * Centralized type definitions for the content feature
 */

export interface Attachment {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  thumbnailUrl?: string
  uploadedBy: string
  uploadedByName?: string
  uploadedAt: Date
  spaceId?: string
  spaceName?: string
  tags?: string[]
  description?: string
  isPublic: boolean
}

export interface ChangeRequest {
  id: string
  title: string
  changeType: string
  sqlStatement: string
  rollbackSql?: string
  status: 'pending' | 'approved' | 'rejected' | 'merged'
  requestedBy: string
  requestedByName?: string
  createdAt: string | Date
  approvers?: string[]
  approvals?: Array<{ userId: string; approved: boolean; timestamp: string | Date }>
}

export interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  startDate?: string | null
  estimate?: number | null
  labels?: string[]
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  spaces?: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  attributes?: Array<{
    id: string
    name: string
    displayName: string
    type: string
    value?: string | null
  }>
  createdAt?: string
  updatedAt?: string
}

