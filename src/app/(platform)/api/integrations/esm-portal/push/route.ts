import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ESMPortalService } from '@/lib/esm-portal-service'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

// Push ticket to ESM Portal
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_id, space_id, syncComments } = body

  if (!ticket_id || !space_id) {
    return NextResponse.json(
      { error: 'ticket_id and space_id are required' },
      { status: 400 }
    )
  }

  // Check access
  const accessResult = await requireSpaceAccess(space_id, session.user.id!)
  if (!accessResult.success) return accessResult.response

    // Get ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticket_id },
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
        creator: {
          select: {
            email: true,
            name: true
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
    
    // Get credentials from Vault or decrypt
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

    // Check if ticket already has an ESM Portal ticket linked
    const metadata = (ticket.metadata as any) || {}
    const existingTicketId = metadata.esmPortalTicketId

    let result
    if (existingTicketId) {
      // Update existing ticket
      const esmTicket = esmService.mapTicketToESMPortal({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await esmService.updateTicket(existingTicketId, {
        title: esmTicket.title,
        description: esmTicket.description,
        priority: esmTicket.priority,
        status: esmTicket.status
      })
    } else {
      // Create new ticket
      const esmTicket = esmService.mapTicketToESMPortal({
        title: ticket.title,
        description: ticket.description || undefined,
        priority: ticket.priority || undefined,
        status: ticket.status || undefined,
        assignees: ticket.assignees,
        tags: ticket.tags
      })

      result = await esmService.createTicket(esmTicket)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync ticket to ESM Portal' },
        { status: 500 }
      )
    }

    // Update ticket metadata with ESM Portal info
    const updatedMetadata = {
      ...metadata,
      esmPortalTicketId: result.ticketId,
      esmPortalTicketNumber: result.ticketNumber,
      esmPortalTicketUrl: result.ticketUrl,
      esmPortalPushedAt: new Date().toISOString(),
      esmPortalLastSyncedAt: new Date().toISOString()
    }

    await db.ticket.update({
      where: { id: ticket_id },
      data: { metadata: updatedMetadata }
    })

    // Sync comments if requested
    let syncedComments = 0
    if (syncComments && result.ticketId && ticket.comments) {
      for (const comment of ticket.comments) {
        try {
          await esmService.addComment(result.ticketId, {
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
      entityType: 'ticket_esm_portal_sync',
      entityId: ticket_id,
      userId: session.user.id,
      newValue: JSON.stringify({
        esmPortalTicketId: result.ticketId,
        esmPortalTicketUrl: result.ticketUrl,
        syncedComments
      })
    })

    return NextResponse.json({
      success: true,
      message: existingTicketId 
        ? 'Ticket updated in ESM Portal successfully' 
        : 'Ticket synced to ESM Portal successfully',
      data: {
        ticketId: result.ticketId,
        ticketNumber: result.ticketNumber,
        ticketUrl: result.ticketUrl,
        syncedComments
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/esm-portal/push')

