import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { jobQueue } from '@/shared/lib/jobs/job-queue'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'import' // 'import' or 'export'

  // Get job from queue (in-memory)
  const queueJob = jobQueue.getJob(jobId)

  // Get job from database
  const table = type === 'import' ? 'import_jobs' : 'export_jobs'
  const jobResult = await query(
    `SELECT * FROM ${table} WHERE id = $1 AND created_by = $2`,
    [jobId, session.user.id]
  )

  if (jobResult.rows.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const dbJob = jobResult.rows[0]

  // Merge queue status with database status
  const status = queueJob?.status || dbJob.status
  const progress = queueJob?.progress ?? dbJob.progress

  return NextResponse.json({
    id: dbJob.id,
    type,
    status,
    progress,
    totalRows: dbJob.total_rows,
    processedRows: dbJob.processed_rows,
    errorMessage: dbJob.error_message,
    result: typeof dbJob.result === 'string' ? JSON.parse(dbJob.result) : dbJob.result,
    fileUrl: dbJob.file_url,
    fileName: dbJob.file_name,
    fileSize: dbJob.file_size,
    startedAt: dbJob.started_at,
    completedAt: dbJob.completed_at,
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/import-export/jobs/[jobId]/status')
