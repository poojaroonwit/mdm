import type {
  ManageEngineServiceDeskConfig,
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskListFilters,
  ServiceDeskResolution,
  ServiceDeskResponse,
  ServiceDeskTicketLink,
  ServiceDeskTimeEntry,
} from './types'

type ExecuteFetch = (url: string, options: RequestInit) => Promise<Response>

function headers(config: ManageEngineServiceDeskConfig, contentType = true): Record<string, string> {
  return {
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    TECHNICIAN_KEY: config.technicianKey || config.apiKey,
  }
}

function errorResponse(error: unknown): ServiceDeskResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  }
}

function responseError(responseData: any, fallback: string) {
  return responseData?.response_status?.messages?.[0]?.message ||
    responseData?.message ||
    fallback
}

export async function addComment(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string,
  comment: ServiceDeskComment
): Promise<ServiceDeskResponse> {
  try {
    const url = `${config.baseUrl}/api/v3/requests/${requestId}/notes`
    const response = await executeFetch(url, {
      method: 'POST',
      headers: headers(config),
      body: JSON.stringify({
        input_data: {
          note: {
            content: comment.content,
            is_public: comment.isPublic !== false,
            add_to_lateral_menu: comment.addToLateralMenu || false,
          },
        },
      }),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      const { deleteCached, cacheKeys } = await import('../servicedesk-cache')
      await deleteCached(cacheKeys.comments(requestId)).catch(() => {})
      return { success: true, requestId, message: 'Comment added successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to add comment: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function getComments(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string
): Promise<ServiceDeskResponse> {
  try {
    const url = `${config.baseUrl}/api/v3/requests/${requestId}/notes`
    const response = await executeFetch(url, {
      method: 'GET',
      headers: headers(config),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, requestId, message: 'Comments retrieved successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to get comments: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function uploadAttachment(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string,
  attachment: ServiceDeskAttachment
): Promise<ServiceDeskResponse> {
  try {
    const url = `${config.baseUrl}/api/v3/requests/${requestId}/attachments`
    const formData = new FormData()
    formData.append('file', attachment.file, attachment.fileName)
    if (attachment.description) formData.append('description', attachment.description)

    const response = await executeFetch(url, {
      method: 'POST',
      headers: headers(config, false),
      body: formData,
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      const { deleteCached, cacheKeys } = await import('../servicedesk-cache')
      await deleteCached(cacheKeys.attachments(requestId)).catch(() => {})
      return { success: true, requestId, message: 'Attachment uploaded successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to upload attachment: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function getAttachments(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string
): Promise<ServiceDeskResponse> {
  try {
    const url = `${config.baseUrl}/api/v3/requests/${requestId}/attachments`
    const response = await executeFetch(url, {
      method: 'GET',
      headers: headers(config),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, requestId, message: 'Attachments retrieved successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to get attachments: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function setResolution(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string,
  resolution: ServiceDeskResolution
): Promise<ServiceDeskResponse> {
  try {
    const inputData: any = {
      request: {
        resolution: { content: resolution.resolution },
      },
    }
    if (resolution.resolvedBy) inputData.request.resolved_by = { email_id: resolution.resolvedBy }
    if (resolution.resolvedTime) inputData.request.resolved_time = resolution.resolvedTime

    const response = await executeFetch(`${config.baseUrl}/api/v3/requests/${requestId}`, {
      method: 'PUT',
      headers: headers(config),
      body: JSON.stringify({ input_data: inputData }),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, requestId, message: 'Resolution set successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to set resolution: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function logTime(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string,
  timeEntry: ServiceDeskTimeEntry
): Promise<ServiceDeskResponse> {
  try {
    const inputData: any = {
      worklog: {
        hours: timeEntry.hours,
        minutes: timeEntry.minutes || 0,
        description: timeEntry.description || '',
        billable: timeEntry.billable || false,
      },
    }
    if (timeEntry.technician) inputData.worklog.technician = { email_id: timeEntry.technician }

    const response = await executeFetch(`${config.baseUrl}/api/v3/requests/${requestId}/worklogs`, {
      method: 'POST',
      headers: headers(config),
      body: JSON.stringify({ input_data: inputData }),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      const { deleteCached, cacheKeys } = await import('../servicedesk-cache')
      await deleteCached(cacheKeys.timeLogs(requestId)).catch(() => {})
      return { success: true, requestId, message: 'Time logged successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to log time: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function getTimeLogs(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string
): Promise<ServiceDeskResponse> {
  try {
    const response = await executeFetch(`${config.baseUrl}/api/v3/requests/${requestId}/worklogs`, {
      method: 'GET',
      headers: headers(config),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, requestId, message: 'Time logs retrieved successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to get time logs: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function linkTickets(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string,
  link: ServiceDeskTicketLink
): Promise<ServiceDeskResponse> {
  try {
    const inputData = {
      link_requests: {
        link_requests: [{
          linked_request: { id: link.linkedRequestId },
          link_type: { name: link.linkType || 'relates_to' },
        }],
      },
    }
    const response = await executeFetch(`${config.baseUrl}/api/v3/requests/${requestId}/link_requests`, {
      method: 'POST',
      headers: headers(config),
      body: JSON.stringify({ input_data: inputData }),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, requestId, message: 'Tickets linked successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to link tickets: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function listTickets(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  filters?: ServiceDeskListFilters
): Promise<ServiceDeskResponse> {
  try {
    const searchCriteria: any = {}
    if (filters?.status) searchCriteria.status = { name: filters.status }
    if (filters?.priority) searchCriteria.priority = { name: filters.priority }
    if (filters?.technician) searchCriteria.technician = { email_id: filters.technician }
    if (filters?.requester) searchCriteria.requester = { email_id: filters.requester }
    if (filters?.category) searchCriteria.category = { name: filters.category }
    if (filters?.search) searchCriteria.subject = { contains: filters.search }
    if (filters?.searchFields) Object.assign(searchCriteria, filters.searchFields)

    const inputData: any = {
      list_info: {
        start_index: filters?.startIndex || 0,
        row_count: filters?.rowCount || 50,
      },
    }
    if (Object.keys(searchCriteria).length > 0) inputData.search_criteria = searchCriteria

    const url = `${config.baseUrl}/api/v3/requests?input_data=${encodeURIComponent(JSON.stringify(inputData))}`
    const response = await executeFetch(url, {
      method: 'GET',
      headers: headers(config),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok) {
      return { success: true, message: 'Tickets retrieved successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to list tickets: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}

export async function deleteTicket(
  config: ManageEngineServiceDeskConfig,
  executeFetch: ExecuteFetch,
  requestId: string
): Promise<ServiceDeskResponse> {
  try {
    const response = await executeFetch(`${config.baseUrl}/api/v3/requests/${requestId}`, {
      method: 'DELETE',
      headers: headers(config),
    })
    const responseData = await response.json().catch(() => ({}))

    if (response.ok || response.status === 204) {
      return { success: true, requestId, message: 'Ticket deleted successfully', data: responseData }
    }

    return {
      success: false,
      error: responseError(responseData, `Failed to delete ticket: ${response.status}`),
      data: responseData,
    }
  } catch (error) {
    return errorResponse(error)
  }
}
