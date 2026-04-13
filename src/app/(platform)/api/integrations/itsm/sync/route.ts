import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ITSMService } from '@/lib/itsm-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Sync ticket from ITSM (pull updates)
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, itsm_ticket_id } = body

  if (!ticket_id || !space_id || !itsm_ticket_id) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, and itsm_ticket_id are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(space_id, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get ITSM configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, 
              api_auth_password, config
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ITSM%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [space_id]
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'ITSM integration not configured for this space' },
        { status: 400 }
      )
    }

    const config = configRows[0]
    const customConfig = (config.config as any) || {}
    
    // Get credentials
    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'
    
    let apiKey: string | undefined
    let username: string | undefined
    let password: string | undefined
    
    if (useVault) {
      if (config.api_auth_apikey_value?.startsWith('vault://')) {
        const vaultPath = config.api_auth_apikey_value.replace('vault://', '')
        const connectionId = vaultPath.split('/')[0]
        const creds = await secretsManager.getSecret(`itsm-integrations/${connectionId}/credentials`)
        apiKey = creds?.apiKey
        username = creds?.username
        password = creds?.password
      }
    } else {
      apiKey = config.api_auth_apikey_value ? decryptApiKey(config.api_auth_apikey_value) ?? undefined : undefined
      username = config.api_auth_username ? decryptApiKey(config.api_auth_username) ?? undefined : undefined
      password = config.api_auth_password ? decryptApiKey(config.api_auth_password) ?? undefined : undefined
    }

    // Initialize ITSM service
    const itsmService = new ITSMService({
      baseUrl: config.api_url,
      provider: customConfig.provider || 'custom',
      apiKey,
      username,
      password,
      authType: config.api_auth_type || 'apikey',
      instanceName: customConfig.instanceName,
      customEndpoints: customConfig.customEndpoints,
      fieldMappings: customConfig.fieldMappings
    })

    // Get ticket from ITSM
    const ticketResult = await itsmService.getTicket(itsm_ticket_id)
    if (!ticketResult.success || !ticketResult.data) {
      return NextResponse.json(
        { error: ticketResult.error || 'Failed to get ticket from ITSM' },
        { status: 400 }
      )
    }

    const itsmTicket = ticketResult.data
    let fields: any = {}

    // Extract fields based on provider
    if (customConfig.provider === 'servicenow') {
      // ServiceNow returns { result: { ...fields } }
      fields = itsmTicket.result || itsmTicket
    } else if (customConfig.provider === 'bmc_remedy') {
      // BMC Remedy returns { values: { ...fields } }
      fields = itsmTicket.values || itsmTicket
    } else if (customConfig.provider === 'cherwell') {
      // Cherwell returns { fields: [...] }
      fields = itsmTicket.fields || itsmTicket
    } else {
      // Custom provider - use as-is
      fields = itsmTicket
    }

    // Map status/priority based on provider and field mappings
    const statusMap = customConfig.fieldMappings?.status || {
      'Open': 'BACKLOG',
      'In Progress': 'IN_PROGRESS',
      'Resolved': 'DONE',
      'Closed': 'CANCELLED',
      'New': 'BACKLOG',
      '1': 'BACKLOG',
      '2': 'IN_PROGRESS',
      '3': 'DONE',
      '6': 'CANCELLED'
    }

    const priorityMap = customConfig.fieldMappings?.priority || {
      '1': 'URGENT',
      '2': 'HIGH',
      '3': 'MEDIUM',
      '4': 'LOW',
      '5': 'LOW',
      'Critical': 'URGENT',
      'High': 'HIGH',
      'Medium': 'MEDIUM',
      'Low': 'LOW'
    }

    // Extract values based on provider
    let title = ''
    let description = ''
    let status = ''
    let priority = ''

    if (customConfig.provider === 'servicenow') {
      title = fields.short_description || fields.title || ''
      description = fields.description || ''
      status = fields.state || fields.status || ''
      priority = fields.priority || ''
    } else if (customConfig.provider === 'bmc_remedy') {
      title = fields['Summary'] || fields['Subject'] || ''
      description = fields['Detailed Description'] || fields['Description'] || ''
      status = fields['Status'] || ''
      priority = fields['Priority'] || ''
    } else if (customConfig.provider === 'cherwell') {
      // Cherwell returns array of field objects
      if (Array.isArray(fields)) {
        const titleField = fields.find((f: any) => f.fieldId === 'Title' || f.name === 'Title')
        const descField = fields.find((f: any) => f.fieldId === 'Description' || f.name === 'Description')
        const statusField = fields.find((f: any) => f.fieldId === 'Status' || f.name === 'Status')
        const priorityField = fields.find((f: any) => f.fieldId === 'Priority' || f.name === 'Priority')
        
        title = titleField?.value || ''
        description = descField?.value || ''
        status = statusField?.value || ''
        priority = priorityField?.value || ''
      } else {
        // Fallback if not array
        title = fields.title || fields.name || ''
        description = fields.description || ''
        status = fields.status || ''
        priority = fields.priority || ''
      }
    } else {
      // Custom provider - use generic fields
      title = fields.title || fields.name || ''
      description = fields.description || ''
      status = fields.status || fields.state || ''
      priority = fields.priority || ''
    }

    // Update local ticket with ITSM data
    const updateData: any = {}
    
    if (title && title !== ticket.title) {
      updateData.title = title
    }
    
    if (description && description !== ticket.description) {
      updateData.description = description
    }
    
    if (status) {
      const mappedStatus = statusMap[status] || statusMap[status.toLowerCase()] || 'BACKLOG'
      if (mappedStatus !== ticket.status) {
        updateData.status = mappedStatus
      }
    }
    
    if (priority) {
      const mappedPriority = priorityMap[priority] || priorityMap[priority.toString()] || 'MEDIUM'
      if (mappedPriority !== ticket.priority) {
        updateData.priority = mappedPriority
      }
    }

    // Update ticket if there are changes
    if (Object.keys(updateData).length > 0) {
      await db.ticket.update({
        where: { id: ticket_id },
        data: updateData
      })

      // Update metadata
      const metadata = (ticket.metadata as any) || {}
      await db.ticket.update({
        where: { id: ticket_id },
        data: {
          metadata: {
            ...metadata,
            itsmLastSyncedAt: new Date().toISOString()
          }
        }
      })

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ticket_itsm_sync',
        entityId: ticket_id,
        userId: session.user.id,
        newValue: JSON.stringify(updateData)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket synced from ITSM successfully',
      updated: Object.keys(updateData).length > 0,
      data: {
        ticketId: ticketResult.ticketId,
        ticketUrl: ticketResult.ticketUrl
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/itsm/sync')

