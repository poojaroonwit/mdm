import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { sqlLinter } from '@/lib/sql-linter'
import { auditLogger } from '@/lib/db-audit'
import { dataMasking } from '@/lib/data-masking'
import { queryPerformanceTracker } from '@/lib/query-performance'
import { logger } from '@/lib/logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { env } from '@/lib/env'
import { z } from 'zod'

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const userId = session.user.id!
  const userName = session.user.name || null
  const userEmail = session.user.email || null
  const userRole = session.user.role || null

  logger.apiRequest('POST', '/api/admin/execute-query', { userId, userRole })

  const bodySchema = z.object({
    query: z.string().min(1),
    spaceId: z.string().uuid().optional().nullable(),
    skipMasking: z.boolean().optional().default(false),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { query: sqlQuery, spaceId, skipMasking } = bodyValidation.data

  const trimmedQuery = sqlQuery.trim()

  // SQL Linting - Always enforce linting, cannot be skipped
  const lintResult = sqlLinter.lint(trimmedQuery)

  // Block execution if there are errors
  if (!lintResult.valid) {
    await auditLogger.log({
      userId,
      userName: userName || undefined,
      userEmail: userEmail || undefined,
      action: 'EXECUTE_QUERY',
      resourceType: 'query',
      sqlQuery: trimmedQuery,
      spaceId: spaceId || undefined,
      success: false,
      errorMessage: 'Query blocked by linting rules',
      executionTime: Date.now() - startTime,
      metadata: { lintResult },
    })

    return NextResponse.json({
      success: false,
      error: 'Query validation failed',
      lintResult,
      results: [],
      columns: [],
      executionTime: Date.now() - startTime,
      status: 'error',
    })
  }

  // Get IP address and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    try {
      // Execute the query
      const result = await query(trimmedQuery)
      const executionTime = Date.now() - startTime

      // Get column names from the first row or from the query result
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : []

      // Apply data masking if enabled
      let maskedResults = result.rows
      if (!skipMasking) {
        const maskingContext = {
          userId,
          userRole: userRole || undefined,
          spaceId: spaceId || undefined,
          environment: (env.NODE_ENV === 'test' ? 'development' : env.NODE_ENV) as 'production' | 'development' | 'staging'
        }
        maskedResults = dataMasking.maskResultSet(result.rows, undefined, maskingContext)
      }

      // Audit logging
      await auditLogger.log({
        userId,
          userName: userName || undefined,
          userEmail: userEmail || undefined,
        action: 'EXECUTE_QUERY',
        resourceType: 'query',
        sqlQuery: trimmedQuery,
        spaceId: spaceId || undefined,
        success: true,
        executionTime,
        rowCount: result.rows.length,
        ipAddress,
        userAgent,
        metadata: {
          columnCount: columns.length,
          lintResult: lintResult ? {
            score: lintResult.score,
            summary: lintResult.summary
          } : null
        }
      })

      // Performance tracking
      await queryPerformanceTracker.recordQueryExecution({
        query: trimmedQuery,
        executionTime,
        rowCount: result.rows.length,
        timestamp: new Date(),
        userId,
        userName: userName || undefined,
        spaceId: spaceId || undefined,
        status: 'success'
      }).catch(err => {
        logger.error('Failed to record query performance', err, { userId })
        // Don't fail the request if performance tracking fails
      })

      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/admin/execute-query', 200, duration, {
        rowCount: result.rows.length,
        executionTime: executionTime,
      })
      return NextResponse.json({
        success: true,
        results: maskedResults,
        columns,
        executionTime,
        status: 'success',
        lintResult: lintResult ? {
          score: lintResult.score,
          summary: lintResult.summary,
          issues: lintResult.issues
        } : null
      })
    } catch (dbError: any) {
      const executionTime = Date.now() - startTime
      
      // Audit logging for failed query
      await auditLogger.log({
        userId,
          userName: userName || undefined,
          userEmail: userEmail || undefined,
        action: 'EXECUTE_QUERY',
        resourceType: 'query',
        sqlQuery: trimmedQuery,
        spaceId: spaceId || undefined,
        success: false,
        errorMessage: dbError.message,
        executionTime,
        ipAddress,
        userAgent
      })

      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/admin/execute-query', 500, duration)
      return NextResponse.json({
        success: false,
        results: [],
        columns: [],
        executionTime,
        status: 'error',
        error: dbError.message,
        lintResult: lintResult ? {
          score: lintResult.score,
          summary: lintResult.summary
        } : null
      })
    }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/execute-query')
