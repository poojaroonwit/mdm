export interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen?: string
  currentPage?: string
  cursor?: {
    x: number
    y: number
    componentId?: string
  }
  permissions: {
    canEdit: boolean
    canComment: boolean
    canInvite: boolean
    canPublish: boolean
  }
}

export interface CollaborationSession {
  id: string
  pageId: string
  pageName: string
  collaborators: Collaborator[]
  isActive: boolean
  startedAt: string
  lastActivity: string
  settings: {
    allowComments: boolean
    allowVoiceChat: boolean
    allowVideoChat: boolean
    requireApproval: boolean
    autoSave: boolean
    conflictResolution: 'last-write-wins' | 'manual' | 'merge'
  }
}

export interface Comment {
  id: string
  pageId: string
  componentId?: string
  content: string
  author: Collaborator
  createdAt: string
  resolved: boolean
  replies: Comment[]
  position?: {
    x: number
    y: number
  }
}

export type CollaborationTab = 'collaborators' | 'comments' | 'activity' | 'settings'

export function getCollaboratorStatusColor(status: Collaborator['status']) {
  switch (status) {
    case 'online': return 'bg-primary'
    case 'away': return 'bg-warning'
    case 'busy': return 'bg-destructive'
    case 'offline': return 'bg-muted'
    default: return 'bg-muted'
  }
}
