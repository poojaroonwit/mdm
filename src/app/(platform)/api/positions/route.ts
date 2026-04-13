import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('GET', '/api/positions', { userId: session.user.id })

  const querySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default(1),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default(20),
    search: z.string().optional().default(''),
  })

  const queryValidation = validateQuery(request, querySchema)
  if (!queryValidation.success) {
    return queryValidation.response
  }

    const { page, limit, search } = queryValidation.data
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

    // Note: Position model doesn't exist in Prisma schema
    // Returning empty result for now
    const positions: any[] = []
    const total = 0

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/positions', 200, duration, {
      count: positions.length,
      page,
      limit,
    })
    return NextResponse.json({
      positions: positions || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/positions')


