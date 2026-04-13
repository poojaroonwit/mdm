import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { db } from '@/lib/db'

// Check for conflicts between local and ServiceDesk tickets
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, request_id } = body

  if (!ticket_id || !space_id || !request_id) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, and request_id are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get local ticket
  const ticket = await db.ticket.findUnique({
    where: { id: ticket_id }
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get ServiceDesk configuration
  const { rows: configRows } = await query(
    `SELECT id, api_url, api_auth_apikey_value
     FROM public.external_connections 
     WHERE space_id = $1::uuid 
       AND connection_type = 'api'
       AND name LIKE '%ServiceDesk%'
       AND deleted_at IS NULL
       AND is_active = true
     LIMIT 1`,
    [space_id]
  )

  if (configRows.length === 0) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured' },
      { status: 400 }
    )
  }

  const config = configRows[0]
  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'
  
  let apiKey: string
  if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
    const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
    const connectionId = vaultPath.split('/')[0]
    const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
    apiKey = creds?.apiKey || ''
  } else {
    apiKey = decryptApiKey(config.api_auth_apikey_value) || ''
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Failed to retrieve API key' },
      { status: 500 }
    )
  }

  const service = new ManageEngineServiceDeskService({
    baseUrl: config.api_url,
    apiKey
  })

  // Get ServiceDesk ticket
  const ticketResult = await service.getTicket(request_id)
  if (!ticketResult.success) {
    return NextResponse.json(
      { error: 'Failed to get ticket from ServiceDesk' },
      { status: 400 }
    )
  }

  const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]
  if (!serviceDeskTicket) {
    return NextResponse.json(
      { error: 'Ticket not found in ServiceDesk' },
      { status: 404 }
    )
  }

  // Compare timestamps
  const localUpdated = ticket.updatedAt
  const serviceDeskUpdated = serviceDeskTicket.modified_time 
    ? new Date(serviceDeskTicket.modified_time) 
    : serviceDeskTicket.created_time 
      ? new Date(serviceDeskTicket.created_time)
      : null

  // Detect conflicts
  const conflicts: any[] = []

  if (ticket.title !== serviceDeskTicket.subject) {
    conflicts.push({
      field: 'title',
      local: ticket.title,
      servicedesk: serviceDeskTicket.subject,
      local_updated: localUpdated,
      servicedesk_updated: serviceDeskUpdated
    })
  }

  if (ticket.description !== serviceDeskTicket.description) {
    conflicts.push({
      field: 'description',
      local: ticket.description,
      servicedesk: serviceDeskTicket.description,
      local_updated: localUpdated,
      servicedesk_updated: serviceDeskUpdated
    })
  }

  const statusMap: Record<string, string> = {
    'Open': 'BACKLOG',
    'In Progress': 'IN_PROGRESS',
    'Resolved': 'DONE',
    'Closed': 'CLOSED'
  }

  const mappedServiceDeskStatus = serviceDeskTicket.status?.name 
    ? statusMap[serviceDeskTicket.status.name] 
    : null

  if (mappedServiceDeskStatus && ticket.status !== mappedServiceDeskStatus) {
    conflicts.push({
      field: 'status',
      local: ticket.status,
      servicedesk: mappedServiceDeskStatus,
      servicedesk_display: serviceDeskTicket.status?.name,
      local_updated: localUpdated,
      servicedesk_updated: serviceDeskUpdated
    })
  }

  const priorityMap: Record<string, string> = {
    'Low': 'LOW',
    'Medium': 'MEDIUM',
    'High': 'HIGH',
    'Critical': 'URGENT'
  }

  const mappedServiceDeskPriority = serviceDeskTicket.priority?.name 
    ? priorityMap[serviceDeskTicket.priority.name] 
    : null

  if (mappedServiceDeskPriority && ticket.priority !== mappedServiceDeskPriority) {
    conflicts.push({
      field: 'priority',
      local: ticket.priority,
      servicedesk: mappedServiceDeskPriority,
      servicedesk_display: serviceDeskTicket.priority?.name,
      local_updated: localUpdated,
      servicedesk_updated: serviceDeskUpdated
    })
  }

  return NextResponse.json({
    has_conflicts: conflicts.length > 0,
    conflicts,
    local_updated: localUpdated,
    servicedesk_updated: serviceDeskUpdated
  })
}

// Resolve conflicts
async function putHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, request_id, resolution } = body

  if (!ticket_id || !space_id || !request_id || !resolution) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, request_id, and resolution are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // resolution format: { field: 'keep_local' | 'keep_servicedesk' | { custom: value } }
  const ticket = await db.ticket.findUnique({
    where: { id: ticket_id }
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Get ServiceDesk configuration and service (similar to conflict check)
  const { rows: configRows } = await query(
    `SELECT id, api_url, api_auth_apikey_value
     FROM public.external_connections 
     WHERE space_id = $1::uuid 
       AND connection_type = 'api'
       AND name LIKE '%ServiceDesk%'
       AND deleted_at IS NULL
       AND is_active = true
     LIMIT 1`,
    [space_id]
  )

  if (configRows.length === 0) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured' },
      { status: 400 }
    )
  }

  const config = configRows[0]
  const secretsManager = getSecretsManager()
  const useVault = secretsManager.getBackend() === 'vault'
  
  let apiKey: string
  if (useVault && config.api_auth_apikey_value?.startsWith('vault://')) {
    const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
    const connectionId = vaultPath.split('/')[0]
    const creds = await secretsManager.getSecret(`servicedesk-integrations/${connectionId}/credentials`)
    apiKey = creds?.apiKey || ''
  } else {
    apiKey = decryptApiKey(config.api_auth_apikey_value) || ''
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Failed to retrieve API key' },
      { status: 500 }
    )
  }

  const service = new ManageEngineServiceDeskService({
    baseUrl: config.api_url,
    apiKey
  })

  // Get ServiceDesk ticket
  const ticketResult = await service.getTicket(request_id)
  if (!ticketResult.success) {
    return NextResponse.json(
      { error: 'Failed to get ticket from ServiceDesk' },
      { status: 400 }
    )
  }

  const serviceDeskTicket = ticketResult.data?.request || ticketResult.data?.requests?.[0]

  const updateData: any = {}
  const serviceDeskUpdates: any = {}

  // Resolve each conflict based on resolution strategy
  for (const [field, strategy] of Object.entries(resolution)) {
    if (strategy === 'keep_local') {
      // Update ServiceDesk with local value
      if (field === 'title') {
        serviceDeskUpdates.subject = ticket.title
      } else if (field === 'description') {
        serviceDeskUpdates.description = ticket.description
      } else if (field === 'status') {
        const statusMap: Record<string, string> = {
          'BACKLOG': 'Open',
          'TODO': 'Open',
          'IN_PROGRESS': 'In Progress',
          'IN_REVIEW': 'In Progress',
          'DONE': 'Resolved',
          'CLOSED': 'Closed'
        }
        serviceDeskUpdates.status = statusMap[ticket.status] || 'Open'
      } else if (field === 'priority') {
        const priorityMap: Record<string, string> = {
          'LOW': 'Low',
          'MEDIUM': 'Medium',
          'HIGH': 'High',
          'URGENT': 'Critical'
        }
        serviceDeskUpdates.priority = priorityMap[ticket.priority] || 'Medium'
      }
    } else if (strategy === 'keep_servicedesk') {
      // Update local with ServiceDesk value
      if (field === 'title' && serviceDeskTicket.subject) {
        updateData.title = serviceDeskTicket.subject
      } else if (field === 'description' && serviceDeskTicket.description) {
        updateData.description = serviceDeskTicket.description
      } else if (field === 'status' && serviceDeskTicket.status?.name) {
        const statusMap: Record<string, string> = {
          'Open': 'BACKLOG',
          'In Progress': 'IN_PROGRESS',
          'Resolved': 'DONE',
          'Closed': 'CLOSED'
        }
        updateData.status = statusMap[serviceDeskTicket.status.name] || ticket.status
      } else if (field === 'priority' && serviceDeskTicket.priority?.name) {
        const priorityMap: Record<string, string> = {
          'Low': 'LOW',
          'Medium': 'MEDIUM',
          'High': 'HIGH',
          'Critical': 'URGENT'
        }
        updateData.priority = priorityMap[serviceDeskTicket.priority.name] || ticket.priority
      }
    } else if (strategy !== null && typeof strategy === 'object' && 'custom' in strategy && strategy.custom) {
      // Custom value - update both
      if (field === 'title') {
        updateData.title = strategy.custom
        serviceDeskUpdates.subject = strategy.custom
      } else if (field === 'description') {
        updateData.description = strategy.custom
        serviceDeskUpdates.description = strategy.custom
      }
    }
  }

  // Apply updates
  if (Object.keys(updateData).length > 0) {
    await db.ticket.update({
      where: { id: ticket_id },
      data: updateData
    })
  }

  if (Object.keys(serviceDeskUpdates).length > 0) {
    await service.updateTicket(request_id, serviceDeskUpdates)
  }

  return NextResponse.json({
    success: true,
    message: 'Conflicts resolved successfully',
    local_updated: Object.keys(updateData).length > 0,
    servicedesk_updated: Object.keys(serviceDeskUpdates).length > 0
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/conflict-resolution')
export const PUT = withErrorHandling(putHandler, 'PUT /api/integrations/manageengine-servicedesk/conflict-resolution')
