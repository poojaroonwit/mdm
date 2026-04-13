import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ITSMService } from '@/lib/itsm-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Push ticket to ITSM
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, ticketId, space_id, spaceId, syncComments } = body
  
  const finalTicketId = ticket_id || ticketId
  const finalSpaceId = space_id || spaceId

  if (!finalTicketId || !finalSpaceId) {
    return NextResponse.json(
      { error: 'ticketId and spaceId are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(finalSpaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: finalTicketId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        },
        tags: true,
        comments: syncComments ? {
          include: {
            author: {
              select: {
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        } : false
      }
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
      [finalSpaceId]
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

    // Check if ticket already has an ITSM ticket linked
    const metadata = (ticket.metadata as any) || {}
    const existingTicketId = metadata.itsmTicketId

    let result
    if (existingTicketId) {
      // Update existing ticket
      const itsmTicket = itsmService.mapTicketToITSM({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await itsmService.updateTicket(existingTicketId, {
        title: itsmTicket.title,
        description: itsmTicket.description,
        priority: itsmTicket.priority,
        status: itsmTicket.status
      })
    } else {
      // Create new ticket
      const itsmTicket = itsmService.mapTicketToITSM({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await itsmService.createTicket(itsmTicket)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync ticket to ITSM' },
        { status: 500 }
      )
    }

    // Update ticket metadata with ITSM info
    const updatedMetadata = {
      ...metadata,
      itsmTicketId: result.ticketId,
      itsmTicketNumber: result.ticketNumber,
      itsmTicketUrl: result.ticketUrl,
      itsmProvider: customConfig.provider,
      itsmPushedAt: new Date().toISOString(),
      itsmLastSyncedAt: new Date().toISOString()
    }

    await db.ticket.update({
      where: { id: finalTicketId },
      data: { metadata: updatedMetadata }
    })

    // Sync comments if requested
    let syncedComments = 0
    if (syncComments && result.ticketId && ticket.comments) {
      for (const comment of ticket.comments) {
        try {
          await itsmService.addComment(result.ticketId, {
            content: `${(comment as any).author?.name || 'User'}: ${comment.content}`,
            isPublic: true
          })
          syncedComments++
        } catch (error) {
          console.error('Failed to sync comment:', error)
        }
      }
    }

    // Create audit log
    await createAuditLog({
      action: existingTicketId ? 'UPDATE' : 'CREATE',
      entityType: 'ticket_itsm_sync',
      entityId: finalTicketId,
      userId: session.user.id,
      newValue: JSON.stringify({
        itsmTicketId: result.ticketId,
        itsmTicketUrl: result.ticketUrl,
        syncedComments
      })
    })

    return NextResponse.json({
      success: true,
      message: existingTicketId 
        ? 'Ticket updated in ITSM successfully' 
        : 'Ticket synced to ITSM successfully',
      data: {
        ticketId: result.ticketId,
        ticketNumber: result.ticketNumber,
        ticketUrl: result.ticketUrl,
        syncedComments
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/itsm/push')

