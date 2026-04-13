import { NextRequest, NextResponse } from 'next/server'
import { queryPerformanceTracker } from '@/lib/query-performance'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('GET', '/api/admin/query-performance', { userId: session.user.id })

  const querySchema = z.object({
    type: z.enum(['slow', 'stats', 'trends', 'top-by-time', 'most-frequent', 'recent']).optional().default('recent'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(1000)).optional().default(50),
    days: z.string().transform(Number).pipe(z.number().int().positive().max(365)).optional().default(7),
    queryHash: z.string().optional(),
  })

  const queryValidation = validateQuery(request, querySchema)
  if (!queryValidation.success) {
    return queryValidation.response
  }

    const { type, limit, days, queryHash } = queryValidation.data

    let data: any
    switch (type) {
      case 'slow':
        data = await queryPerformanceTracker.getSlowQueries(limit)
        break

      case 'stats':
        data = await queryPerformanceTracker.getQueryStats(queryHash, days)
        break

      case 'trends':
        data = await queryPerformanceTracker.getPerformanceTrends(days)
        break

      case 'top-by-time':
        data = await queryPerformanceTracker.getTopQueriesByExecutionTime(limit)
        break

      case 'most-frequent':
        data = await queryPerformanceTracker.getMostFrequentQueries(limit)
        break

      case 'recent':
      default:
        data = await queryPerformanceTracker.getRecentQueries(limit)
        break
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/admin/query-performance', 200, duration, { type })
    return NextResponse.json({ success: true, data })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/query-performance')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('POST', '/api/admin/query-performance', { userId: session.user.id })

  const bodySchema = z.object({
    query: z.string().min(1),
    executionTime: z.number().nonnegative(),
    rowCount: z.number().int().nonnegative().optional(),
    status: z.string().optional(),
    errorMessage: z.string().optional().nullable(),
    spaceId: z.string().uuid().optional().nullable(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

    const {
      query: sqlQuery,
      executionTime,
      rowCount,
      status,
      errorMessage,
      spaceId
    } = bodyValidation.data

    await queryPerformanceTracker.recordQueryExecution({
      query: sqlQuery,
      executionTime,
      rowCount: rowCount || 0,
      timestamp: new Date(),
      userId: session.user.id,
      userName: session.user.name || undefined,
      spaceId: spaceId || undefined,
      status: (status || 'success') as 'error' | 'success',
      errorMessage: errorMessage || undefined
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/admin/query-performance', 200, duration)
    return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/query-performance')









