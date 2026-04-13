import { NextRequest } from 'next/server'

/**
 * Server-Sent Events (SSE) endpoint for real-time job status updates
 * 
 * This uses Server-Sent Events (SSE) as a simpler alternative to WebSockets
 * for Next.js App Router compatibility
 */
export async function GET(request: NextRequest) {
  // For Next.js App Router, we'll use SSE instead of WebSocket
  // WebSocket requires a separate server or custom server setup
  
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return new Response('jobId parameter required', { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', jobId })}\n\n`)
      )

      // Poll job status every 2 seconds
      const interval = setInterval(async () => {
        try {
          const { query } = await import('@/lib/db')
          const result = await query(
            `SELECT status, progress, error_message, result, updated_at
             FROM import_jobs WHERE id = $1
             UNION ALL
             SELECT status, progress, error_message, result::text, updated_at
             FROM export_jobs WHERE id = $1`,
            [jobId]
          )

          if (result.rows.length > 0) {
            const job = result.rows[0]
            const message = {
              type: 'status_update',
              jobId,
              status: job.status,
              progress: job.progress,
              error: job.error_message,
              result: typeof job.result === 'string' ? JSON.parse(job.result) : job.result,
              updatedAt: job.updated_at,
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
            )

            // Close stream if job is completed or failed
            if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
              clearInterval(interval)
              controller.close()
            }
          } else {
            // Job not found
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Job not found' })}\n\n`)
            )
            clearInterval(interval)
            controller.close()
          }
        } catch (error) {
          console.error('Error polling job status:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Polling error' })}\n\n`)
          )
          clearInterval(interval)
          controller.close()
        }
      }, 2000) // Poll every 2 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  })
}
