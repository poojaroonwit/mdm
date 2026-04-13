import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
    limit: z.string().optional().transform((val) => parseInt(val || '50')).pipe(z.number().int().positive().max(100)).optional().default(50),
    search: z.string().optional().default(''),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
    
    const { page, limit = 50, search = '' } = queryValidation.data
    logger.apiRequest('GET', '/api/call-workflow-statuses', { userId: session.user.id, page, limit, search })

    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      deletedAt: null
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // CallWorkflowStatus model doesn't exist in Prisma schema
    // Returning empty results for now
    const statuses: any[] = []
    const total = 0

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/call-workflow-statuses', 200, duration, { total })
    return NextResponse.json({
      statuses: statuses || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/call-workflow-statuses')


