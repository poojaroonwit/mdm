import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    spaceId: commonSchemas.id,
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
  
  const { spaceId } = queryValidation.data
  logger.apiRequest('GET', '/api/files/quotas', { userId, spaceId })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, userId)
  if (!accessResult.success) return accessResult.response

    // Get quota information
    const quotaResult = await query(
      `SELECT 
        fq.id,
        fq.space_id,
        fq.max_files,
        fq.max_size,
        fq.allowed_file_types,
        fq.current_files,
        fq.current_size,
        fq.warning_threshold,
        fq.is_enforced,
        fq.created_at,
        fq.updated_at
       FROM file_quotas fq
       WHERE fq.space_id = $1`,
      [spaceId]
    )

    if (quotaResult.rows.length === 0) {
      // Create default quota if it doesn't exist
      const defaultQuotaResult = await query(
        `INSERT INTO file_quotas (space_id, max_files, max_size, allowed_file_types)
         VALUES ($1, 1000, 1073741824, ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
         RETURNING *`,
        [spaceId]
      )

      return NextResponse.json({
        quota: defaultQuotaResult.rows[0]
      })
    }

    const quota = quotaResult.rows[0] as any

    // Calculate usage percentages
    const fileUsagePercentage = quota.max_files > 0 ? Math.round((quota.current_files / quota.max_files) * 100) : 0
    const sizeUsagePercentage = quota.max_size > 0 ? Math.round((quota.current_size / quota.max_size) * 100) : 0

    // Check if warnings should be triggered
    const isFileWarning = fileUsagePercentage >= quota.warning_threshold
    const isSizeWarning = sizeUsagePercentage >= quota.warning_threshold

    return NextResponse.json({
      quota: {
        ...quota,
        usage: {
          files: {
            current: quota.current_files,
            max: quota.max_files,
            percentage: fileUsagePercentage,
            isWarning: isFileWarning
          },
          size: {
            current: quota.current_size,
            max: quota.max_size,
            percentage: sizeUsagePercentage,
            isWarning: isSizeWarning
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/quotas', 200, duration)
    return NextResponse.json({
      quota: {
        ...quota,
        usage: {
          files: {
            current: quota.current_files,
            max: quota.max_files,
            percentage: fileUsagePercentage,
            isWarning: isFileWarning
          },
          size: {
            current: quota.current_size,
            max: quota.max_size,
            percentage: sizeUsagePercentage,
            isWarning: isSizeWarning
          }
        }
      }
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/files/quotas')

async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    spaceId: commonSchemas.id,
    maxFiles: z.number().int().nonnegative().optional(),
    maxSize: z.number().int().nonnegative().optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    warningThreshold: z.number().int().min(1).max(100).optional(),
    isEnforced: z.boolean().optional(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
  
  const { spaceId, maxFiles, maxSize, allowedFileTypes, warningThreshold, isEnforced } = bodyValidation.data
  logger.apiRequest('PUT', '/api/files/quotas', { userId, spaceId })

  // Check if user has admin access to this space
  const accessResult = await requireSpaceAccess(spaceId, userId)
  if (!accessResult.success) return accessResult.response

  // Additional check for admin role
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, userId]
  )

  if (memberResult.rows.length === 0 || !['owner', 'admin'].includes((memberResult.rows[0] as any).role)) {
    logger.warn('Insufficient permissions for file quota update', { spaceId, userId })
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    // Update quota
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    if (maxFiles !== undefined) {
      updateFields.push(`max_files = $${paramIndex}`)
      updateValues.push(maxFiles)
      paramIndex++
    }

    if (maxSize !== undefined) {
      updateFields.push(`max_size = $${paramIndex}`)
      updateValues.push(maxSize)
      paramIndex++
    }

    if (allowedFileTypes !== undefined) {
      updateFields.push(`allowed_file_types = $${paramIndex}`)
      updateValues.push(allowedFileTypes)
      paramIndex++
    }

    if (warningThreshold !== undefined) {
      updateFields.push(`warning_threshold = $${paramIndex}`)
      updateValues.push(warningThreshold)
      paramIndex++
    }

    if (isEnforced !== undefined) {
      updateFields.push(`is_enforced = $${paramIndex}`)
      updateValues.push(isEnforced)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(spaceId)

    const updateResult = await query(
      `UPDATE file_quotas 
       SET ${updateFields.join(', ')}
       WHERE space_id = $${paramIndex}
       RETURNING *`,
      [...updateValues]
    )

    if (updateResult.rows.length === 0) {
      logger.warn('File quota not found for update', { spaceId })
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    const duration = Date.now() - startTime
    const quota = updateResult.rows[0] as any
    logger.apiResponse('PUT', '/api/files/quotas', 200, duration, { quotaId: quota.id })
    return NextResponse.json({
      quota: updateResult.rows[0]
    })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/files/quotas')
