import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { downloadJobFile } from '@/shared/lib/jobs/storage-helper'

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
  const type = searchParams.get('type') || 'export' // 'import' or 'export'

  // Get job from database
  const table = type === 'import' ? 'import_jobs' : 'export_jobs'
  const jobResult = await query(
    `SELECT * FROM ${table} WHERE id = $1 AND created_by = $2`,
    [jobId, session.user.id]
  )

  if (jobResult.rows.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const job = jobResult.rows[0]

  if (job.status !== 'COMPLETED') {
    return NextResponse.json(
      { error: 'Job is not completed yet' },
      { status: 400 }
    )
  }

  // Get file path
  let filePath: string | null = null
  let fileName: string | null = null
  let contentType: string | null = null

  if (type === 'export') {
    filePath = job.file_url || job.file_path
    fileName = job.file_name || `export-${jobId}.${job.format || 'xlsx'}`
    
    // Determine content type
    switch (job.format) {
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'csv':
        contentType = 'text/csv'
        break
      case 'json':
        contentType = 'application/json'
        break
      default:
        contentType = 'application/octet-stream'
    }
  } else {
    // For imports, get file path from result JSON
    const result = typeof job.result === 'string' ? JSON.parse(job.result) : job.result || {}
    filePath = result.filePath || `imports/${job.file_name}`
    fileName = job.file_name
    contentType = job.file_type || 'application/octet-stream'
  }

  if (!filePath) {
    return NextResponse.json(
      { error: 'File path not found' },
      { status: 404 }
    )
  }

  // Download file from storage
  const downloadResult = await downloadJobFile(filePath)

  if (!downloadResult.success || !downloadResult.buffer) {
    return NextResponse.json(
      { error: downloadResult.error || 'Failed to download file' },
      { status: 500 }
    )
  }

  // Return file with appropriate headers
  return new NextResponse(downloadResult.buffer as any, {
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName || 'file'}"`,
      'Content-Length': downloadResult.buffer.length.toString(),
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/import-export/jobs/[jobId]/download')
