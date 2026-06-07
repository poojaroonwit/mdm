import type {
  ManageEngineServiceDeskConfig,
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskListFilters,
  ServiceDeskResolution,
  ServiceDeskResponse,
  ServiceDeskTicket,
  ServiceDeskTicketLink,
  ServiceDeskTimeEntry,
} from './manageengine-servicedesk/types'
import * as ticketOperations from './manageengine-servicedesk/ticket-operations'
import { mapTicketToServiceDesk, type InternalTicketInput } from './manageengine-servicedesk/mappers'

export type {
  ManageEngineServiceDeskConfig,
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskListFilters,
  ServiceDeskResolution,
  ServiceDeskResponse,
  ServiceDeskTicket,
  ServiceDeskTicketLink,
  ServiceDeskTimeEntry,
} from './manageengine-servicedesk/types'
export class ManageEngineServiceDeskService {
  private config: ManageEngineServiceDeskConfig
  private enableRetry: boolean = true

  constructor(config: ManageEngineServiceDeskConfig, options?: { enableRetry?: boolean }) {
    this.config = config
    // Ensure baseUrl doesn't end with /
    this.config.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.enableRetry = options?.enableRetry !== false
  }

  /**
   * Internal method to execute fetch with retry logic
   */
  private async executeFetch(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    if (!this.enableRetry) {
      return fetch(url, options)
    }

    const { executeWithRetry } = await import('./servicedesk-retry')
    
    return executeWithRetry(async () => {
      const response = await fetch(url, options)
      
      // If rate limited, throw to trigger retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        if (retryAfter) {
          await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
        }
        throw { status: 429, response }
      }
      
      return response
    })
  }

  /**
   * Test the connection to ServiceDesk
   */
  async testConnection(): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests?input_data=${encodeURIComponent(JSON.stringify({ list_info: { start_index: 0, row_count: 1 } }))}`
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      if (response.ok || response.status === 200) {
        return {
          success: true,
          message: 'Connection successful'
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          error: `Connection failed: ${response.status} ${errorText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Create a ticket in ServiceDesk
   */
  async createTicket(ticket: ServiceDeskTicket): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests`
      
      // Map priority from our system to ServiceDesk
      const priorityMap: Record<string, string> = {
        'LOW': 'Low',
        'MEDIUM': 'Medium',
        'HIGH': 'High',
        'CRITICAL': 'Critical'
      }

      // Build request payload
      const inputData: any = {
        request: {
          subject: ticket.subject,
          description: ticket.description,
          priority: {
            name: priorityMap[ticket.priority || ''] || ticket.priority || 'Medium'
          }
        }
      }

      // Add optional fields
      if (ticket.requester) {
        inputData.request.requester = {
          email_id: ticket.requester
        }
      }

      if (ticket.category) {
        inputData.request.category = {
          name: ticket.category
        }
      }

      if (ticket.subcategory) {
        inputData.request.subcategory = {
          name: ticket.subcategory
        }
      }

      if (ticket.item) {
        inputData.request.item = {
          name: ticket.item
        }
      }

      if (ticket.group) {
        inputData.request.group = {
          name: ticket.group
        }
      }

      if (ticket.technician) {
        inputData.request.technician = {
          email_id: ticket.technician
        }
      }

      if (ticket.dueDate) {
        inputData.request.due_by_time = ticket.dueDate
      }

      if (ticket.status) {
        inputData.request.status = {
          name: ticket.status
        }
      }

      // Add custom fields if provided
      if (ticket.customFields) {
        inputData.request.custom_fields = ticket.customFields
      }

      const response = await this.executeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        const requestId = responseData?.request?.id || responseData?.id
        return {
          success: true,
          requestId: requestId?.toString(),
          message: 'Ticket created successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to create ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update a ticket in ServiceDesk
   */
  async updateTicket(requestId: string, updates: Partial<ServiceDeskTicket>): Promise<ServiceDeskResponse> {
    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const inputData: any = {
        request: {}
      }

      if (updates.subject) inputData.request.subject = updates.subject
      if (updates.description) inputData.request.description = updates.description
      if (updates.priority) {
        inputData.request.priority = { name: updates.priority }
      }
      if (updates.status) {
        inputData.request.status = { name: updates.status }
      }
      if (updates.technician) {
        inputData.request.technician = { email_id: updates.technician }
      }
      if (updates.dueDate) {
        inputData.request.due_by_time = updates.dueDate
      }
      if (updates.customFields) {
        inputData.request.custom_fields = updates.customFields
      }

      const response = await this.executeFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        },
        body: JSON.stringify({
          input_data: inputData
        })
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        // Invalidate ticket cache
        const { deleteCached, cacheKeys } = await import('./servicedesk-cache')
        await deleteCached(cacheKeys.ticket(requestId)).catch(() => {})

        return {
          success: true,
          requestId: requestId,
          message: 'Ticket updated successfully',
          data: responseData
        }
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to update ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get ticket details from ServiceDesk
   */
  async getTicket(requestId: string, useCache: boolean = true): Promise<ServiceDeskResponse> {
    // Check cache first
    if (useCache) {
      const { getCached, setCached, cacheKeys } = await import('./servicedesk-cache')
      const cached = await getCached<ServiceDeskResponse>(cacheKeys.ticket(requestId))
      if (cached) {
        return cached
      }
    }

    try {
      const url = `${this.config.baseUrl}/api/v3/requests/${requestId}`
      
      const response = await this.executeFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'TECHNICIAN_KEY': this.config.technicianKey || this.config.apiKey
        }
      })

      const responseData = await response.json().catch(() => ({}))
      
      if (response.ok) {
        const result: ServiceDeskResponse = {
          success: true,
          requestId: requestId,
          message: 'Ticket retrieved successfully',
          data: responseData
        }

        // Cache the result
        if (useCache) {
          const { setCached, cacheKeys } = await import('./servicedesk-cache')
          await setCached(cacheKeys.ticket(requestId), result, 300) // 5 minutes
        }

        return result
      } else {
        const errorMessage = responseData?.response_status?.messages?.[0]?.message || 
                           responseData?.message || 
                           `Failed to get ticket: ${response.status}`
        return {
          success: false,
          error: errorMessage,
          data: responseData
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Map our ticket format to ServiceDesk format
   */
  mapTicketToServiceDesk(ourTicket: InternalTicketInput): ServiceDeskTicket {
    return mapTicketToServiceDesk(ourTicket)
  }

  /**
   * Add a comment/note to a ServiceDesk ticket
   */
  async addComment(requestId: string, comment: ServiceDeskComment): Promise<ServiceDeskResponse> {
    return ticketOperations.addComment(this.config, this.executeFetch.bind(this), requestId, comment)
  }

  /**
   * Get comments/notes for a ServiceDesk ticket
   */
  async getComments(requestId: string): Promise<ServiceDeskResponse> {
    return ticketOperations.getComments(this.config, this.executeFetch.bind(this), requestId)
  }

  /**
   * Upload attachment to a ServiceDesk ticket
   */
  async uploadAttachment(requestId: string, attachment: ServiceDeskAttachment): Promise<ServiceDeskResponse> {
    return ticketOperations.uploadAttachment(this.config, this.executeFetch.bind(this), requestId, attachment)
  }

  /**
   * Get attachments for a ServiceDesk ticket
   */
  async getAttachments(requestId: string): Promise<ServiceDeskResponse> {
    return ticketOperations.getAttachments(this.config, this.executeFetch.bind(this), requestId)
  }

  /**
   * Set resolution for a ServiceDesk ticket
   */
  async setResolution(requestId: string, resolution: ServiceDeskResolution): Promise<ServiceDeskResponse> {
    return ticketOperations.setResolution(this.config, this.executeFetch.bind(this), requestId, resolution)
  }

  /**
   * Log time to a ServiceDesk ticket
   */
  async logTime(requestId: string, timeEntry: ServiceDeskTimeEntry): Promise<ServiceDeskResponse> {
    return ticketOperations.logTime(this.config, this.executeFetch.bind(this), requestId, timeEntry)
  }

  /**
   * Get time logs for a ServiceDesk ticket
   */
  async getTimeLogs(requestId: string): Promise<ServiceDeskResponse> {
    return ticketOperations.getTimeLogs(this.config, this.executeFetch.bind(this), requestId)
  }

  /**
   * Link tickets in ServiceDesk
   */
  async linkTickets(requestId: string, link: ServiceDeskTicketLink): Promise<ServiceDeskResponse> {
    return ticketOperations.linkTickets(this.config, this.executeFetch.bind(this), requestId, link)
  }

  /**
   * List/Search tickets from ServiceDesk
   */
  async listTickets(filters?: ServiceDeskListFilters): Promise<ServiceDeskResponse> {
    return ticketOperations.listTickets(this.config, this.executeFetch.bind(this), filters)
  }

  /**
   * Delete a ticket in ServiceDesk
   */
  async deleteTicket(requestId: string): Promise<ServiceDeskResponse> {
    return ticketOperations.deleteTicket(this.config, this.executeFetch.bind(this), requestId)
  }}
