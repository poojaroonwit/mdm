import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateParams, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET /api/spaces/[id]/layout/versions/[versionId] - Get a specific version
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      versionId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, versionId } = paramValidation.data
    const userId = session.user.id
    logger.apiRequest('GET', `/api/spaces/${spaceId}/layout/versions/${versionId}`, { userId })

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      logger.warn('Space not found or access denied for layout version', { spaceId, versionId, userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 }))
    }

    // Get the specific version
    const versionResult = await query(
      `SELECT 
        lv.id,
        lv.version_number,
        lv.layout_config,
        lv.change_description,
        lv.created_by,
        lv.created_at,
        lv.updated_at,
        lv.is_current,
        u.name as created_by_name,
        u.email as created_by_email
       FROM layout_versions lv
       LEFT JOIN users u ON lv.created_by = u.id
       WHERE lv.id = $1::uuid AND lv.space_id = $2::uuid`,
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      logger.warn('Layout version not found', { spaceId, versionId })
      return addSecurityHeaders(NextResponse.json({ error: 'Version not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/layout/versions/${versionId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      version: versionResult.rows[0]
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Layout Version API GET')
  }
}

// DELETE /api/spaces/[id]/layout/versions/[versionId] - Delete a version


export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/layout/versions/[versionId]/route.ts')
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }


    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
      versionId: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId, versionId } = paramValidation.data
    const userId = session.user.id
    logger.apiRequest('DELETE', `/api/spaces/${spaceId}/layout/versions/${versionId}`, { userId })

    // Check if user has admin/owner access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      logger.warn('Space not found or insufficient permissions for layout version deletion', { spaceId, versionId, userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found or insufficient permissions' }, { status: 403 }))
    }

    // Prevent deleting current version
    const versionResult = await query(
      'SELECT is_current FROM layout_versions WHERE id = $1::uuid AND space_id = $2::uuid',
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      logger.warn('Layout version not found for deletion', { spaceId, versionId })
      return addSecurityHeaders(NextResponse.json({ error: 'Version not found' }, { status: 404 }))
    }

    if ((versionResult.rows[0] as any).is_current) {
      logger.warn('Attempted to delete current layout version', { spaceId, versionId })
      return addSecurityHeaders(NextResponse.json({ error: 'Cannot delete current version' }, { status: 400 }))
    }

    // Delete the version
    await query(
      'DELETE FROM layout_versions WHERE id = $1::uuid AND space_id = $2::uuid',
      [versionId, spaceId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/spaces/${spaceId}/layout/versions/${versionId}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Layout Version API DELETE')
  }
}



export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/spaces/[id]/layout/versions/[versionId]/route.ts')