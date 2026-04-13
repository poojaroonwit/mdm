import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadJobFile } from '@/shared/lib/jobs/storage-helper'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const dataModelId = formData.get('dataModelId') as string
  const mapping = JSON.parse(formData.get('mapping') as string || '{}')
  const spaceId = formData.get('spaceId') as string | null

  if (!file || !dataModelId) {
    return NextResponse.json(
      { error: 'File and data model are required' },
      { status: 400 }
    )
  }

  // Validate file type
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only CSV and Excel files are allowed.' },
      { status: 400 }
    )
  }

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'File size exceeds 10MB limit' },
      { status: 400 }
    )
  }

  // Convert file to buffer
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  // Upload file to storage
  const uniqueFileName = `import-${Date.now()}-${file.name}`
  const uploadResult = await uploadJobFile(uniqueFileName, fileBuffer, file.type, 'import')

  if (!uploadResult.success) {
    return NextResponse.json(
      { error: uploadResult.error || 'Failed to upload file to storage' },
      { status: 500 }
    )
  }

  // Create import job with file path
  const importJob = await db.importJob.create({
    data: {
      dataModelId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'PENDING',
      mapping: mapping || {},
      createdBy: session.user.id,
      spaceId: spaceId || null,
      // Store file path in a custom field (we'll need to add this to schema or use result field)
      result: {
        filePath: uploadResult.path,
        fileUrl: uploadResult.url,
      },
    }
  })

  // Store file path in a way we can retrieve it
  // Since Prisma schema might not have file_path, we'll store it in result JSON
  // Or we can update the job after creation
  await db.importJob.update({
    where: { id: importJob.id },
    data: {
      result: {
        filePath: uploadResult.path,
        fileUrl: uploadResult.url,
      },
    },
  })

  // Queue job for processing
  const { jobQueue } = await import('@/shared/lib/jobs/job-queue')
  await jobQueue.add({
    id: importJob.id,
    type: 'import',
    status: 'PENDING',
    progress: 0,
  })

  return NextResponse.json({ 
    job: importJob,
    message: 'Import job created. Processing will begin shortly.'
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

  const [importJobs, total] = await Promise.all([
    db.importJob.findMany({
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
    db.importJob.count({ where })
  ])

  return NextResponse.json({ 
    importJobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/import-export/import')
export const GET = withErrorHandling(getHandler, 'GET /api/import-export/import')
