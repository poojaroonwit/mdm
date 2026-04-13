import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET /api/spaces/[id]/layout/versions - List all versions for a space layout
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId } = paramValidation.data
    const userId = session.user.id
    logger.apiRequest('GET', `/api/spaces/${spaceId}/layout/versions`, { userId })

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    // Get all versions for this space
    const versionsResult = await query(
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
       WHERE lv.space_id = $1::uuid
       ORDER BY lv.version_number DESC`,
      [spaceId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceId}/layout/versions`, 200, duration, {
      versionCount: versionsResult.rows.length
    })
    return addSecurityHeaders(NextResponse.json({
      versions: versionsResult.rows,
      count: versionsResult.rows.length
    }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Layout Versions API GET')
  }
}

// POST /api/spaces/[id]/layout/versions - Create a new version
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceId } = paramValidation.data
    const userId = session.user.id
    logger.apiRequest('POST', `/api/spaces/${spaceId}/layout/versions`, { userId })

    const bodySchema = z.object({
      layoutConfig: z.any(),
      changeDescription: z.string().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { layoutConfig, changeDescription } = bodyValidation.data

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found or access denied' }, { status: 403 })
    }

    // Get next version number
    const versionResult = await query(
      'SELECT get_next_layout_version($1) as next_version',
      [spaceId]
    )
    const nextVersion = (versionResult.rows[0] as any).next_version

    // Mark all other versions as not current
    await query(
      'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
      [spaceId]
    )

    // Create new version
    const insertResult = await query(
      `INSERT INTO layout_versions 
       (space_id, version_number, layout_config, change_description, created_by, is_current)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [spaceId, nextVersion, JSON.stringify(layoutConfig), changeDescription || `Version ${nextVersion}`, userId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/spaces/${spaceId}/layout/versions`, 200, duration, {
      versionNumber: nextVersion
    })
    return addSecurityHeaders(NextResponse.json({
      version: insertResult.rows[0],
      success: true
    }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Layout Versions API POST')
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/layout/versions')
export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/layout/versions')
