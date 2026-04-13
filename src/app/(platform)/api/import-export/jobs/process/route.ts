import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { jobQueue } from '@/shared/lib/jobs/job-queue'

/**
 * Process pending jobs
 * This endpoint can be called periodically or via a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Get pending import jobs
    const pendingImports = await query(
      `SELECT id FROM import_jobs 
       WHERE status = 'PENDING' AND deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 10`
    )

    for (const row of pendingImports.rows) {
      await jobQueue.add({
        id: row.id,
        type: 'import',
        status: 'PENDING',
        progress: 0,
      })
    }

    // Get pending export jobs
    const pendingExports = await query(
      `SELECT id FROM export_jobs 
       WHERE status = 'PENDING' AND deleted_at IS NULL
       ORDER BY created_at ASC
       LIMIT 10`
    )

    for (const row of pendingExports.rows) {
      await jobQueue.add({
        id: row.id,
        type: 'export',
        status: 'PENDING',
        progress: 0,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Queued ${pendingImports.rows.length} import jobs and ${pendingExports.rows.length} export jobs`,
    })
  } catch (error) {
    console.error('Error processing jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

