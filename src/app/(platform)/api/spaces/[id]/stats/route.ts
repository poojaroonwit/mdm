import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceId}/stats`)

    // Get space statistics
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        members: true,
        dataModels: {
          include: {
            dataModel: {
              include: {
                dataRecords: true
              }
            }
          }
        },
        attachmentStorage: true
      }
    })

    if (!space) {
      logger.warn('Space not found for stats', { spaceId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found' }, { status: 404 }))
    }

    const totalRecords = space.dataModels.reduce((sum, dm) => sum + dm.dataModel.dataRecords.length, 0)
    const storageUsed = space.attachmentStorage.reduce((sum, att) => sum + att.fileSize, 0)

    const stats = {
      totalUsers: space.members.length,
      totalDataModels: space.dataModels.length,
      totalRecords,
      storageUsed,
      lastActivity: space.updatedAt
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/stats`, 200, duration, {
      totalUsers: stats.totalUsers,
      totalDataModels: stats.totalDataModels,
      totalRecords: stats.totalRecords,
    })
    return addSecurityHeaders(NextResponse.json({ stats }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Stats API')
  }
}
