export interface ManageEngineServiceDeskConfig {
  baseUrl: string
  apiKey: string
  technicianKey?: string
}

export interface ServiceDeskTicket {
  subject: string
  description: string
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  requester?: string
  category?: string
  subcategory?: string
  item?: string
  group?: string
  technician?: string
  dueDate?: string
  customFields?: Record<string, any>
}

export interface ServiceDeskResponse {
  success: boolean
  requestId?: string
  message?: string
  error?: string
  data?: any
}

export interface ServiceDeskComment {
  content: string
  isPublic?: boolean
  addToLateralMenu?: boolean
}

export interface ServiceDeskAttachment {
  file: File | Blob
  fileName: string
  description?: string
}

export interface ServiceDeskResolution {
  resolution: string
  resolvedBy?: string
  resolvedTime?: string
}

export interface ServiceDeskTimeEntry {
  hours: number
  minutes?: number
  description?: string
  billable?: boolean
  technician?: string
}

export interface ServiceDeskTicketLink {
  linkedRequestId: string
  linkType?: 'relates_to' | 'duplicate' | 'depends_on' | 'blocked_by'
}

export interface ServiceDeskListFilters {
  status?: string
  priority?: string
  technician?: string
  requester?: string
  category?: string
  startIndex?: number
  rowCount?: number
  searchFields?: Record<string, any>
  search?: string
}
