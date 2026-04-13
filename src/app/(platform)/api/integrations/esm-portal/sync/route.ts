import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ESMPortalService } from '@/lib/esm-portal-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Sync ticket from ESM Portal (pull updates)
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, esm_ticket_id } = body

  if (!ticket_id || !space_id || !esm_ticket_id) {
    return NextResponse.json(
      { error: 'ticket_id, space_id, and esm_ticket_id are required' },
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

    // Get ESM Portal configuration
    const { rows: configRows } = await query(
      `SELECT id, api_url, api_auth_type, api_auth_apikey_value, api_auth_username, 
              api_auth_password, config
       FROM public.external_connections 
       WHERE space_id = $1::uuid 
         AND connection_type = 'api'
         AND name LIKE '%ESM Portal%'
         AND deleted_at IS NULL
         AND is_active = true
       LIMIT 1`,
      [space_id]
    )

    if (configRows.length === 0) {
      return NextResponse.json(
        { error: 'ESM Portal integration not configured for this space' },
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
        const creds = await secretsManager.getSecret(`esm-portal-integrations/${connectionId}/credentials`)
        apiKey = creds?.apiKey
        username = creds?.username
        password = creds?.password
      }
    } else {
      apiKey = config.api_auth_apikey_value ? decryptApiKey(config.api_auth_apikey_value) ?? undefined : undefined
      username = config.api_auth_username ? decryptApiKey(config.api_auth_username) ?? undefined : undefined
      password = config.api_auth_password ? decryptApiKey(config.api_auth_password) ?? undefined : undefined
    }

    // Initialize ESM Portal service
    const esmService = new ESMPortalService({
      baseUrl: config.api_url,
      apiKey,
      username,
      password,
      authType: config.api_auth_type || 'apikey',
      customHeaders: customConfig.customHeaders
    })

    // Get ticket from ESM Portal
    const ticketResult = await esmService.getTicket(esm_ticket_id)
    if (!ticketResult.success || !ticketResult.data) {
      return NextResponse.json(
        { error: ticketResult.error || 'Failed to get ticket from ESM Portal' },
        { status: 400 }
      )
    }

    const esmTicket = ticketResult.data

    // Map ESM Portal status/priority to our system
    const statusMap: Record<string, string> = {
      'Open': 'BACKLOG',
      'In Progress': 'IN_PROGRESS',
      'Resolved': 'DONE',
      'Closed': 'CANCELLED'
    }

    const priorityMap: Record<string, string> = {
      'Low': 'LOW',
      'Medium': 'MEDIUM',
      'High': 'HIGH',
      'Critical': 'URGENT'
    }

    // Update local ticket with ESM Portal data
    const updateData: any = {}
    
    if (esmTicket.title && esmTicket.title !== ticket.title) {
      updateData.title = esmTicket.title
    }
    
    if (esmTicket.description && esmTicket.description !== ticket.description) {
      updateData.description = esmTicket.description
    }
    
    if (esmTicket.status) {
      const mappedStatus = statusMap[esmTicket.status] || 'BACKLOG'
      if (mappedStatus !== ticket.status) {
        updateData.status = mappedStatus
      }
    }
    
    if (esmTicket.priority) {
      const mappedPriority = priorityMap[esmTicket.priority] || 'MEDIUM'
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
            esmPortalLastSyncedAt: new Date().toISOString()
          }
        }
      })

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'ticket_esm_portal_sync',
        entityId: ticket_id,
        userId: session.user.id,
        newValue: JSON.stringify(updateData)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket synced from ESM Portal successfully',
      updated: Object.keys(updateData).length > 0,
      data: {
        ticketId: ticketResult.ticketId,
        ticketUrl: ticketResult.ticketUrl
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/esm-portal/sync')

