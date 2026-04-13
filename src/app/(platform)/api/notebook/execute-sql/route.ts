import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { SQLExecutor } from '@/lib/sql-executor'
import { createExternalClient } from '@/lib/external-db'
import { db as prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

const sqlExecutor = new SQLExecutor()

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 queries per minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitStore.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count }
}

async function postHandler(request: NextRequest) {
  const startTime = Date.now()

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const userId = session.user.id!
  logger.apiRequest('POST', '/api/notebook/execute-sql', { userId })

  // Rate limiting
  const rateLimit = checkRateLimit(userId)
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for SQL execution', { userId })
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded. Please wait before executing more queries.',
        rateLimit: { remaining: 0, resetTime: RATE_LIMIT_WINDOW }
      },
      { status: 429 }
    )
  }

  const bodySchema = z.object({
    query: z.string().min(1),
    connection: z.string().uuid().optional().nullable(),
    spaceId: z.string().uuid().optional().nullable(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { query: sqlQuery, connection, spaceId } = bodyValidation.data
  const connectionId = connection || 'default'

    // Validate query
    const validation = await sqlExecutor.validateQuery(sqlQuery.trim())
    if (!validation.valid) {
      logger.warn('SQL query validation failed', { userId, error: validation.error })
      return NextResponse.json(
        { error: validation.error || 'Invalid SQL query' },
        { status: 400 }
      )
    }

    // Set timeout (30 seconds default, configurable)
    const timeout = 30000
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout: Execution exceeded 30 seconds')), timeout)
    })

    let result

    // Execute query based on connection type
    if (!connection || connection === 'default') {
      // Default connection (main database)
      const queryPromise = sqlExecutor.executeQuery(sqlQuery.trim(), {
        limit: 10000, // Max 10k rows
        timeout
      })
      result = await Promise.race([queryPromise, timeoutPromise])
    } else {
      // External connection
      const connectionConfig = await prisma.externalConnection.findFirst({
        where: {
          id: connection,
          isActive: true,
          deletedAt: null,
          OR: [
            { spaceId: null as any }, // Global connections accessible to all
            ...(spaceId ? [
              { spaceId },
              { space: { members: { some: { userId } } } }
            ] : [])
          ]
        }
      })

      if (!connectionConfig) {
        logger.warn('External connection not found', { userId, connectionId: connection })
        return NextResponse.json(
          { error: 'External connection not found or inactive' },
          { status: 404 }
        )
      }

      // Create external client with Vault credential retrieval
      const { createExternalClientWithCredentials } = await import('@/lib/external-connection-helper')
      const externalClient = await createExternalClientWithCredentials({
        id: connectionConfig.id,
        db_type: connectionConfig.dbType as 'postgres' | 'mysql',
        host: connectionConfig.host,
        port: connectionConfig.port || undefined,
        database: connectionConfig.database || undefined,
        username: connectionConfig.username,
        password: connectionConfig.password,
        options: connectionConfig.options as any
      })

      try {
        // Validate query for external connection
        const validation = await sqlExecutor.validateQuery(sqlQuery.trim())
        if (!validation.valid) {
          await externalClient.close()
          logger.warn('SQL query validation failed for external connection', { userId, connectionId: connection, error: validation.error })
          return NextResponse.json(
            { error: validation.error || 'Invalid SQL query' },
            { status: 400 }
          )
        }

        // Execute with timeout
        const queryPromise = (async () => {
          const queryResult = await externalClient.query(sqlQuery.trim())
          
          // Process result
          const data = queryResult.rows || []
          const columns = data.length > 0 ? Object.keys(data[0]) : []
          const executionTime = Date.now() - startTime

          return {
            success: true,
            data,
            columns,
            rowCount: data.length,
            columnCount: columns.length,
            executionTime,
            query: sqlQuery.trim()
          }
        })()

        result = await Promise.race([queryPromise, timeoutPromise])
      } finally {
        await externalClient.close()
      }
    }

    const executionTime = Date.now() - startTime

    // Format result for frontend
    const formattedResult = {
      data: result.data || [],
      columns: result.columns || [],
      rowCount: result.rowCount || 0,
      columnCount: ('columnCount' in result ? result.columnCount : undefined) || result.columns?.length || 0,
      preview: {
        columns: result.columns || [],
        data: (result.data || []).slice(0, 100).map((row: any) => 
          result.columns?.map((col: string) => row[col]) || []
        )
      },
      executionTime: result.executionTime || executionTime
    }

    // Log successful execution
    logger.info('SQL execution successful', {
      userId,
      executionTime,
      rowCount: result.rowCount || 0,
      connection: connectionId,
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/notebook/execute-sql', 200, duration, {
      rowCount: result.rowCount || 0,
      connection: connectionId,
    })
    return NextResponse.json({
      success: true,
      ...formattedResult,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: RATE_LIMIT_WINDOW
      }
    })
}

export const POST = withErrorHandling(postHandler, 'POST /api/notebook/execute-sql')

