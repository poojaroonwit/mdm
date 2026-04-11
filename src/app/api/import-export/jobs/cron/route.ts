import { NextRequest, NextResponse } from 'next/server'
import { jobQueue } from '@/shared/lib/jobs/job-queue'
import { getCronApiKey } from '@/lib/system-runtime-settings'

/**
 * Cron job endpoint for processing pending import/export jobs
 * 
 * This endpoint should be called periodically (every 1-5 minutes) via:
 * - External cron service (cron-job.org, EasyCron, etc.)
 * - Server cron job
 * - Vercel Cron Jobs
 * - GitHub Actions scheduled workflows
 * 
 * Example cron: Every 5 minutes
 * curl -X POST https://your-domain.com/api/import-export/jobs/cron
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify API key for security
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    const expectedApiKey = await getCronApiKey()

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Process pending jobs
    const processed = await jobQueue.processPendingJobs()

    return NextResponse.json({
      success: true,
      message: 'Job processing triggered',
      processed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron job processing:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}

