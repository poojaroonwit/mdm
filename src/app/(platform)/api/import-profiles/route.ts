import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    dataModel: z.string().optional(),
    isPublic: z.string().transform((val) => val === 'true').optional(),
    importType: z.string().optional(),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
    
    const { searchParams } = new URL(request.url)
    const dataModel = queryValidation.data.dataModel || searchParams.get('data_model') || searchParams.get('dataModel')
    const { isPublic, importType } = queryValidation.data
    logger.apiRequest('GET', '/api/import-profiles', { userId: session.user.id, dataModel, importType })

    // Build where clause for filtering using Prisma
    const where: any = {}
    
    if (dataModel) {
      where.dataModel = dataModel
    }
    
    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = Boolean(isPublic)
    }
    
    if (importType) {
      where.importType = importType
    }

    // Get import profiles using Prisma
    const profiles = await db.importProfile.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/import-profiles', 200, duration, { count: profiles.length })
    return NextResponse.json({ profiles })
}

export const GET = withErrorHandling(getHandler, 'GET /api/import-profiles')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    dataModel: z.string().min(1, 'Data model is required'),
    fileTypes: z.array(z.string()).min(1, 'At least one file type is required'),
    headerRow: z.number().int().positive().optional().default(1),
    dataStartRow: z.number().int().positive().optional().default(2),
    chunkSize: z.number().int().positive().optional().default(1000),
    maxItems: z.number().int().positive().optional().nullable(),
    importType: z.enum(['insert', 'upsert', 'delete']),
    primaryKeyAttribute: z.string().optional().nullable(),
    dateFormat: z.string().optional().default('YYYY-MM-DD'),
    timeFormat: z.string().optional().default('HH:mm:ss'),
    booleanFormat: z.string().optional().default('true/false'),
    attributeMapping: z.record(z.string(), z.any()).optional().default({}),
    attributeOptions: z.record(z.string(), z.any()).optional().default({}),
    isPublic: z.boolean().optional().default(false),
    sharing: z.any().optional(),
    spaceId: commonSchemas.id.optional().nullable(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
    
    const data = bodyValidation.data
    const name = data.name
    const description = data.description
    const dataModel = data.dataModel
    const fileTypes = data.fileTypes
    const headerRow = data.headerRow
    const dataStartRow = data.dataStartRow
    const chunkSize = data.chunkSize
    const maxItems = data.maxItems
    const importType = data.importType
    const primaryKeyAttribute = data.primaryKeyAttribute
    const dateFormat = data.dateFormat
    const timeFormat = data.timeFormat
    const booleanFormat = data.booleanFormat
    const attributeMapping = data.attributeMapping
    const attributeOptions = data.attributeOptions
    const isPublic = data.isPublic
    const sharing = data.sharing
    const spaceId = data.spaceId
    logger.apiRequest('POST', '/api/import-profiles', { userId: session.user.id, name, dataModel, importType })

    // Create the import profile using Prisma
    const profile = await db.importProfile.create({
      data: {
        name,
        description,
        dataModelId: dataModel,
        mapping: attributeMapping || {},
        settings: {
          fileTypes: fileTypes,
          headerRow: headerRow || 1,
          dataStartRow: dataStartRow || 2,
          chunkSize: chunkSize || 1000,
          maxItems: maxItems || null,
          importType: importType,
          primaryKeyAttribute: primaryKeyAttribute || null,
          dateFormat: dateFormat || 'YYYY-MM-DD',
          timeFormat: timeFormat || 'HH:mm:ss',
          booleanFormat: booleanFormat || 'true/false',
          attributeOptions: attributeOptions || {},
          isPublic: isPublic || false
        } as any,
        createdBy: session.user.id,
        spaceId: spaceId || null
      }
    })

    // ImportProfileSharing model doesn't exist in Prisma schema
    // Sharing functionality not implemented

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/import-profiles', 201, duration, { profileId: profile.id })
    return NextResponse.json({ profile }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/import-profiles')
