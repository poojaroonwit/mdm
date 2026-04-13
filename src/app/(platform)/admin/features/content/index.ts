/**
 * Content Feature
 * Main export file for the content feature
 */

// Components
export { AttachmentManager } from './components/AttachmentManager'
export { ChangeRequests } from './components/ChangeRequests'
export { ProjectsManagement } from './components/ProjectsManagement'

// Types
export type {
  Attachment,
  ChangeRequest,
  Ticket,
} from './types'

// Utils
export {
  filterAttachmentsBySearch,
  filterAttachmentsByType,
  isAttachmentPublic,
  getChangeRequestStatusColor,
  isChangeRequestPending,
  filterChangeRequestsByStatus,
  getTicketPriorityColor,
  filterTicketsByStatus,
  filterTicketsByPriority,
} from './utils'

