import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { AttachmentStorageService } from '@/lib/attachment-storage'
import { logger } from '@/lib/logger'
import { validateParams, validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET - List files from a storage connection
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user?.id) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    }

    logger.apiRequest('GET', '/api/admin/storage/connections/[id]/files', {
      userId: session.user.id
    })

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      logger.warn('Insufficient permissions for storage connection files', {
        userId: session.user.id,
        role: session.user.role
      })
      return addSecurityHeaders(
        NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      )
    }

    const resolvedParams = await params
    const paramValidation = validateParams(
      resolvedParams,
      z.object({
        id: commonSchemas.id
      })
    )

    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }

    const { id } = paramValidation.data
    const connection = await prisma.storageConnection.findUnique({
      where: { id }
    })

    if (!connection) {
      logger.warn('Storage connection not found', { connectionId: id })
      return addSecurityHeaders(
        NextResponse.json({ error: 'Storage connection not found' }, { status: 404 })
      )
    }

    if (!connection.isActive || connection.status !== 'connected') {
      logger.warn('Storage connection not active or connected', {
        connectionId: id,
        isActive: connection.isActive,
        status: connection.status
      })
      return addSecurityHeaders(
        NextResponse.json(
          {
            error: 'Storage connection is not active or connected'
          },
          { status: 400 }
        )
      )
    }

    const querySchema = z.object({
      path: z.string().optional().default(''),
      search: z.string().optional().default('')
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const { path, search } = queryValidation.data

    // For now, return empty files array; implement provider-specific logic later
    const files: any[] = []

    const duration = Date.now() - startTime
    logger.apiResponse(
      'GET',
      '/api/admin/storage/connections/[id]/files',
      200,
      duration,
      {
        connectionId: id,
        fileCount: files.length,
        path,
        search
      }
    )
    return addSecurityHeaders(NextResponse.json({ files }))
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/storage/connections/[id]/files')

