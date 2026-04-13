import { NextRequest, NextResponse } from 'next/server'
import { 
  getPendingServiceDeskJobs, 
  getServiceDeskJob,
  updateServiceDeskJob 
} from '@/lib/servicedesk-job-queue'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { db } from '@/lib/db'
import { query } from '@/lib/db'

/**
 * Process pending ServiceDesk jobs
 * This endpoint should be called by a worker or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { jobId } = body

    if (jobId) {
      // Process specific job
      await processJob(jobId)
      return NextResponse.json({ success: true, message: 'Job processed' })
    }

    // Process all pending jobs (up to 10 at a time)
    const pendingJobs = await getPendingServiceDeskJobs(10)
    const results = []

    for (const job of pendingJobs) {
      try {
        await processJob(job.id)
        results.push({ jobId: job.id, status: 'processed' })
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error)
        results.push({ jobId: job.id, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('POST /integrations/manageengine-servicedesk/jobs/process error', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processJob(jobId: string) {
  const job = await getServiceDeskJob(jobId)
  if (!job || job.status !== 'pending') {
    return
  }

  // Mark as processing
  await updateServiceDeskJob(jobId, { status: 'processing' })

  try {
    const service = await getServiceDeskService(job.spaceId)
    if (!service) {
      throw new Error('ServiceDesk integration not configured')
    }

    let successCount = 0
    let failureCount = 0
    const errors: Array<{ ticketId: string; error: string }> = []
    const requestIds: string[] = []

    if (job.jobType === 'bulk_push' && job.payload.ticketIds) {
      // Process bulk push
      for (const ticketId of job.payload.ticketIds) {
        try {
          const ticket = await db.ticket.findUnique({
            where: { id: ticketId },
            include: {
              creator: { select: { email: true } },
              tags: true,
              attributes: true
            }
          })

          if (!ticket) {
            throw new Error('Ticket not found')
          }

          const serviceDeskTicket = service.mapTicketToServiceDesk({
            title: ticket.title,
            description: ticket.description || '',
            priority: ticket.priority || undefined,
            status: ticket.status || undefined,
            requesterEmail: ticket.creator?.email || undefined,
            tags: ticket.tags,
            attributes: ticket.attributes.map(attr => ({
              name: attr.name,
              value: attr.value || attr.jsonValue
            }))
          })

          const result = await service.createTicket(serviceDeskTicket)
          
          if (result.success && result.requestId) {
            requestIds.push(result.requestId)
            successCount++

            // Update ticket metadata
            const metadata = (ticket.metadata as any) || {}
            metadata.serviceDeskRequestId = result.requestId
            metadata.serviceDeskPushedAt = new Date().toISOString()
            
            await db.ticket.update({
              where: { id: ticketId },
              data: { metadata }
            })
          } else {
            throw new Error(result.error || 'Failed to create ticket')
          }

          // Update progress
          await updateServiceDeskJob(jobId, {
            progress: {
              total: job.payload.ticketIds.length,
              completed: successCount + failureCount + 1,
              failed: failureCount,
              errors
            }
          })
        } catch (error) {
          failureCount++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ ticketId, error: errorMsg })

          await updateServiceDeskJob(jobId, {
            progress: {
              total: job.payload.ticketIds.length,
              completed: successCount + failureCount,
              failed: failureCount,
              errors
            }
          })
        }
      }
    }

    // Mark as completed
    await updateServiceDeskJob(jobId, {
      status: 'completed',
      result: {
        successCount,
        failureCount,
        requestIds: requestIds.length > 0 ? requestIds : undefined
      }
    })
  } catch (error) {
    // Mark as failed
    await updateServiceDeskJob(jobId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

