import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateQuery, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'
import { requireSpaceAccess } from '@/lib/space-access'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    spaceId: commonSchemas.id,
    period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
  
  const { spaceId, period = '30d' } = queryValidation.data
  logger.apiRequest('GET', '/api/files/analytics', { userId, spaceId, period })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, userId)
  if (!accessResult.success) return accessResult.response

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get overall statistics
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(DISTINCT uploaded_by) as unique_uploaders,
        AVG(file_size) as avg_file_size,
        MIN(uploaded_at) as earliest_upload,
        MAX(uploaded_at) as latest_upload
       FROM attachment_files 
       WHERE space_id = $1 AND deleted_at IS NULL AND uploaded_at >= $2`,
      [spaceId, startDate]
    )

    // Get file type distribution
    const fileTypesResult = await query(
      `SELECT 
        mime_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
       FROM attachment_files 
       WHERE space_id = $1 AND deleted_at IS NULL AND uploaded_at >= $2
       GROUP BY mime_type
       ORDER BY count DESC
       LIMIT 10`,
      [spaceId, startDate]
    )

    // Get upload trends (daily)
    const trendsResult = await query(
      `SELECT 
        DATE(uploaded_at) as date,
        COUNT(*) as uploads,
        SUM(file_size) as size_uploaded
       FROM attachment_files 
       WHERE space_id = $1 AND deleted_at IS NULL AND uploaded_at >= $2
       GROUP BY DATE(uploaded_at)
       ORDER BY date ASC`,
      [spaceId, startDate]
    )

    // Get top uploaders
    const topUploadersResult = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(af.id) as file_count,
        SUM(af.file_size) as total_size
       FROM attachment_files af
       JOIN users u ON af.uploaded_by = u.id
       WHERE af.space_id = $1 AND af.deleted_at IS NULL AND af.uploaded_at >= $2
       GROUP BY u.id, u.name, u.email
       ORDER BY file_count DESC
       LIMIT 10`,
      [spaceId, startDate]
    )

    // Get storage usage by provider
    const storageUsageResult = await query(
      `SELECT 
        sas.provider,
        COUNT(af.id) as file_count,
        SUM(af.file_size) as total_size
       FROM attachment_files af
       JOIN space_attachment_storage sas ON af.space_id = sas.space_id
       WHERE af.space_id = $1 AND af.deleted_at IS NULL AND af.uploaded_at >= $2
       GROUP BY sas.provider`,
      [spaceId, startDate]
    )

    // Get quota information
    const quotaResult = await query(
      `SELECT 
        max_files,
        max_size,
        current_files,
        current_size,
        warning_threshold
       FROM file_quotas 
       WHERE space_id = $1`,
      [spaceId]
    )

    const quota = (quotaResult.rows[0] as any) || {
      max_files: 1000,
      max_size: 1073741824,
      current_files: 0,
      current_size: 0,
      warning_threshold: 80
    }

    // Calculate quota usage percentages
    const quotaUsage = {
      files: {
        current: quota.current_files,
        max: quota.max_files,
        percentage: quota.max_files > 0 ? Math.round((quota.current_files / quota.max_files) * 100) : 0,
        isWarning: (quota.current_files / quota.max_files) >= (quota.warning_threshold / 100)
      },
      size: {
        current: quota.current_size,
        max: quota.max_size,
        percentage: quota.max_size > 0 ? Math.round((quota.current_size / quota.max_size) * 100) : 0,
        isWarning: (quota.current_size / quota.max_size) >= (quota.warning_threshold / 100)
      }
    }

    return NextResponse.json({
      period,
      dateRange: {
        from: startDate,
        to: now
      },
      statistics: {
        totalFiles: parseInt((statsResult.rows[0] as any).total_files),
        totalSize: parseInt((statsResult.rows[0] as any).total_size),
        uniqueUploaders: parseInt((statsResult.rows[0] as any).unique_uploaders),
        avgFileSize: parseFloat((statsResult.rows[0] as any).avg_file_size),
        earliestUpload: (statsResult.rows[0] as any).earliest_upload,
        latestUpload: (statsResult.rows[0] as any).latest_upload
      },
      fileTypes: fileTypesResult.rows.map((row: any) => ({
        mimeType: row.mime_type,
        count: parseInt(row.count),
        totalSize: parseInt(row.total_size)
      })),
      trends: trendsResult.rows.map((row: any) => ({
        date: row.date,
        uploads: parseInt(row.uploads),
        sizeUploaded: parseInt(row.size_uploaded)
      })),
      topUploaders: topUploadersResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        fileCount: parseInt(row.file_count),
        totalSize: parseInt(row.total_size)
      })),
      storageUsage: storageUsageResult.rows.map((row: any) => ({
        provider: row.provider,
        fileCount: parseInt(row.file_count),
        totalSize: parseInt(row.total_size)
      })),
      quota: quotaUsage
    })

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/analytics', 200, duration, { period })
    return NextResponse.json({
      period,
      dateRange: {
        from: startDate,
        to: now
      },
      statistics: {
        totalFiles: parseInt((statsResult.rows[0] as any).total_files),
        totalSize: parseInt((statsResult.rows[0] as any).total_size),
        uniqueUploaders: parseInt((statsResult.rows[0] as any).unique_uploaders),
        avgFileSize: parseFloat((statsResult.rows[0] as any).avg_file_size),
        earliestUpload: (statsResult.rows[0] as any).earliest_upload,
        latestUpload: (statsResult.rows[0] as any).latest_upload
      },
      fileTypes: fileTypesResult.rows.map((row: any) => ({
        mimeType: row.mime_type,
        count: parseInt(row.count),
        totalSize: parseInt(row.total_size)
      })),
      trends: trendsResult.rows.map((row: any) => ({
        date: row.date,
        uploads: parseInt(row.uploads),
        sizeUploaded: parseInt(row.size_uploaded)
      })),
      topUploaders: topUploadersResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        fileCount: parseInt(row.file_count),
        totalSize: parseInt(row.total_size)
      })),
      storageUsage: storageUsageResult.rows.map((row: any) => ({
        provider: row.provider,
        fileCount: parseInt(row.file_count),
        totalSize: parseInt(row.total_size)
      })),
      quota: quotaUsage
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/files/analytics')
