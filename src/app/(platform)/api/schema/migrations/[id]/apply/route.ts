import { NextRequest, NextResponse } from 'next/server'
import { schemaMigration } from '@/lib/schema-migration'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: z.string().min(1), // Migration ID
  }))
  
  if (!paramValidation.success) {
    return addSecurityHeaders(paramValidation.response)
  }
  
  const { id } = paramValidation.data
  logger.apiRequest('POST', `/api/schema/migrations/${id}/apply`, { userId: session.user.id })

  await schemaMigration.initialize()
  const result = await schemaMigration.applyMigration(id, session.user.id)

  const duration = Date.now() - startTime
  logger.apiResponse('POST', `/api/schema/migrations/${id}/apply`, 200, duration, {
    migrationId: id,
  })
  return addSecurityHeaders(NextResponse.json(result))
}

export const POST = withErrorHandling(postHandler, 'POST /api/schema/migrations/[id]/apply')

