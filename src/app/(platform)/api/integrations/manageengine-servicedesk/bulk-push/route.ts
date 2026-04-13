import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSecretsManager } from '@/lib/secrets-manager'
import { decryptApiKey } from '@/lib/encryption'
import { ManageEngineServiceDeskService } from '@/lib/manageengine-servicedesk'
import { db } from '@/lib/db'
import { createServiceDeskJob } from '@/lib/servicedesk-job-queue'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'

// Bulk push multiple tickets to ServiceDesk
async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { ticket_ids, space_id, syncComments, syncAttachments, syncTimeLogs } = body

  if (!ticket_ids || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
    return NextResponse.json(
      { error: 'ticket_ids array is required' },
      { status: 400 }
    )
  }

  if (!space_id) {
    return NextResponse.json(
      { error: 'space_id is required' },
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
      { error: 'ServiceDesk integration not configured for this space' },
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

  const results = {
    success: [] as any[],
    failed: [] as any[],
    total: ticket_ids.length
  }

  // Process tickets in batches to avoid rate limiting
  const batchSize = 5
  for (let i = 0; i < ticket_ids.length; i += batchSize) {
    const batch = ticket_ids.slice(i, i + batchSize)
    
    await Promise.allSettled(
      batch.map(async (ticket_id: string) => {
        try {
          // Get ticket
          const ticket = await db.ticket.findUnique({
            where: { id: ticket_id },
            include: {
              assignees: {
                include: {
                  user: {
                    select: { email: true }
                  }
                }
              },
              creator: {
                select: { email: true }
              },
              tags: true,
              attributes: {
                orderBy: { sortOrder: 'asc' }
              }
            }
          })

          if (!ticket) {
            results.failed.push({
              ticket_id,
              error: 'Ticket not found'
            })
            return
          }

          // Map ticket to ServiceDesk format
          const serviceDeskTicket = service.mapTicketToServiceDesk({
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            dueDate: ticket.dueDate,
            requesterEmail: ticket.creator?.email,
            tags: ticket.tags,
            attributes: ticket.attributes.map(attr => ({
              name: attr.name,
              value: attr.value || attr.jsonValue
            }))
          })

          // Set technician from assignees
          if (ticket.assignees && ticket.assignees.length > 0) {
            serviceDeskTicket.technician = ticket.assignees[0].user.email
          }

          // Create ticket in ServiceDesk
          const result = await service.createTicket(serviceDeskTicket)

          if (result.success) {
            const requestId = result.requestId
            
            // Store ServiceDesk request ID
            const metadata = (ticket.metadata as any) || {}
            metadata.serviceDeskRequestId = requestId
            metadata.serviceDeskPushedAt = new Date().toISOString()
            
            await db.ticket.update({
              where: { id: ticket_id },
              data: { metadata }
            })

            // Sync comments, attachments, time logs if requested
            let synced = { comments: 0, attachments: 0, timeLogs: 0 }
            
            if (syncComments) {
              try {
                const comments = await db.ticketComment.findMany({
                  where: { ticketId: ticket_id }
                })
                for (const comment of comments) {
                  await service.addComment(requestId!, {
                    content: comment.content,
                    isPublic: true
                  })
                  synced.comments++
                }
              } catch (error) {
                console.error('Failed to sync comments:', error)
              }
            }

            if (syncAttachments) {
              try {
                const attachments = await db.ticketAttachment.findMany({
                  where: { ticketId: ticket_id }
                })
                for (const attachment of attachments) {
                  try {
                    const fileResponse = await fetch(attachment.filePath)
                    if (fileResponse.ok) {
                      const blob = await fileResponse.blob()
                      await service.uploadAttachment(requestId!, {
                        file: blob,
                        fileName: attachment.fileName,
                        description: `Synced from ticket ${ticket_id}`
                      })
                      synced.attachments++
                    }
                  } catch (error) {
                    console.error('Failed to sync attachment:', error)
                  }
                }
              } catch (error) {
                console.error('Failed to sync attachments:', error)
              }
            }

            if (syncTimeLogs) {
              try {
                const timeLogs = await db.ticketTimeLog.findMany({
                  where: { ticketId: ticket_id },
                  include: { user: { select: { email: true } } }
                })
                for (const timeLog of timeLogs) {
                  await service.logTime(requestId!, {
                    hours: Number(timeLog.hours),
                    description: timeLog.description || undefined,
                    technician: timeLog.user.email || undefined
                  })
                  synced.timeLogs++
                }
              } catch (error) {
                console.error('Failed to sync time logs:', error)
              }
            }

            results.success.push({
              ticket_id,
              requestId,
              synced
            })
          } else {
            results.failed.push({
              ticket_id,
              error: result.error || 'Failed to create ticket in ServiceDesk'
            })
          }
        } catch (error) {
          results.failed.push({
            ticket_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
    )

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < ticket_ids.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return NextResponse.json({
    success: true,
    message: `Processed ${results.total} tickets`,
    results
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/bulk-push')
