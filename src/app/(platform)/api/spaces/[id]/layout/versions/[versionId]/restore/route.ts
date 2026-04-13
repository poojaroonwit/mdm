import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// POST /api/spaces/[id]/layout/versions/[versionId]/restore - Restore a layout version
async function postHandler(
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
    logger.apiRequest('POST', `/api/spaces/${spaceId}/layout/versions/${versionId}/restore`, { userId })

    const bodySchema = z.object({
      createNewVersion: z.boolean().optional().default(true),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { createNewVersion = true } = bodyValidation.data

    // Check if user has access to this space
    const accessResult = await query(
      `SELECT s.id, s.name
       FROM spaces s
       JOIN space_members sm ON s.id = sm.space_id
       WHERE s.id = $1::uuid AND sm.user_id = $2::uuid AND sm.role IN ('owner', 'admin', 'member')`,
      [spaceId, userId]
    )

    if (accessResult.rows.length === 0) {
      logger.warn('Space not found or access denied for layout version restore', { spaceId, versionId, userId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found or access denied' }, { status: 404 }))
    }

    // Get the version to restore
    const versionResult = await query(
      `SELECT 
        lv.id,
        lv.version_number,
        lv.layout_config,
        lv.change_description,
        lv.is_current
       FROM layout_versions lv
       WHERE lv.id = $1::uuid AND lv.space_id = $2::uuid`,
      [versionId, spaceId]
    )

    if (versionResult.rows.length === 0) {
      logger.warn('Layout version not found for restore', { spaceId, versionId })
      return addSecurityHeaders(NextResponse.json({ error: 'Version not found' }, { status: 404 }))
    }

    const versionToRestore = versionResult.rows[0] as any

    if (createNewVersion) {
      // Create a new version from the restored one (preserves history)
      // Mark all versions as not current
      await query(
        'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
        [spaceId]
      )

      // Get next version number
      const nextVersionResult = await query(
        'SELECT get_next_layout_version($1) as next_version',
        [spaceId]
      )
      const nextVersion = (nextVersionResult.rows[0] as any).next_version

      // Create new version with restored config
      const insertResult = await query(
        `INSERT INTO layout_versions 
         (space_id, version_number, layout_config, change_description, created_by, is_current)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [
          spaceId,
          nextVersion,
          versionToRestore.layout_config,
          `Restored from version ${versionToRestore.version_number}`,
          userId
        ]
      )

      const duration = Date.now() - startTime
      logger.apiResponse('POST', `/api/spaces/${spaceId}/layout/versions/${versionId}/restore`, 200, duration, {
        newVersionNumber: nextVersion,
        createNewVersion: true,
      })
      return addSecurityHeaders(NextResponse.json({
        version: insertResult.rows[0] as any,
        restored: true
      }))
    } else {
      // Just mark this version as current (overwrites current)
      await query(
        'UPDATE layout_versions SET is_current = false WHERE space_id = $1::uuid',
        [spaceId]
      )

      await query(
        'UPDATE layout_versions SET is_current = true WHERE id = $1::uuid AND space_id = $2::uuid',
        [versionId, spaceId]
      )

      const duration = Date.now() - startTime
      logger.apiResponse('POST', `/api/spaces/${spaceId}/layout/versions/${versionId}/restore`, 200, duration, {
        createNewVersion: false,
      })
      return addSecurityHeaders(NextResponse.json({
        version: versionToRestore,
        restored: true
      }))
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.apiResponse('POST', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Layout Version Restore API')
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces/[id]/layout/versions/[versionId]/restore')
