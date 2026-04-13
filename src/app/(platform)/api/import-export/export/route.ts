import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    dataModelId,
    format = 'xlsx',
    filters = {},
    columns = [],
  } = body

  if (!dataModelId) {
    return NextResponse.json(
      { error: 'Data model is required' },
      { status: 400 }
    )
  }

  // Create export job
  const exportJob = await db.exportJob.create({
    data: {
      dataModelId,
      format,
      status: 'PENDING',
      filters: filters || {},
      columns: columns || [],
      createdBy: session.user.id,
      spaceId: body.spaceId || null
    }
  })

  // Queue job for processing
  const { jobQueue } = await import('@/shared/lib/jobs/job-queue')
  await jobQueue.add({
    id: exportJob.id,
    type: 'export',
    status: 'PENDING',
    progress: 0,
  })

  return NextResponse.json({ 
    job: exportJob,
    message: 'Export job created. Processing will begin shortly.'
  }, { status: 201 })
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const dataModelId = searchParams.get('dataModelId')
  const spaceId = searchParams.get('spaceId')

  const where: any = {
    OR: [
      { createdBy: session.user.id },
      { space: { members: { some: { userId: session.user.id } } } }
    ]
  }

  if (status) {
    where.status = status
  }

  if (dataModelId) {
    where.dataModelId = dataModelId
  }

  if (spaceId) {
    where.spaceId = spaceId
  }

  const [exportJobs, total] = await Promise.all([
    db.exportJob.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    }),
    db.exportJob.count({ where })
  ])

  return NextResponse.json({ 
    exportJobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/import-export/export')
export const GET = withErrorHandling(getHandler, 'GET /api/import-export/export')
