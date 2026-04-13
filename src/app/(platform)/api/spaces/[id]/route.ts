import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { addSecurityHeaders } from '@/lib/security-headers'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: commonSchemas.id,
  }))

  if (!paramValidation.success) {
    return paramValidation.response
  }

  const { id: spaceId } = paramValidation.data
  logger.apiRequest('GET', `/api/spaces/${spaceId}`, { userId: session.user.id })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

  // Get space details with member information
  const space = await query(`
      SELECT 
        s.id, s.name, s.description, s.is_default, s.is_active, s.created_by, s.created_at, s.updated_at, s.deleted_at, s.slug,
        s.icon, s.logo_url, s.features,
        u.name as created_by_name,
        sm.role as user_role
      FROM spaces s
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN space_members sm ON s.id = sm.space_id AND sm.user_id = $2::uuid
      WHERE s.id = $1::uuid AND s.deleted_at IS NULL
    `, [spaceId, session.user.id])

  if (space.rows.length === 0) {
    logger.warn('Space not found', { spaceId })
    return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  }

  const spaceData = space.rows[0]

  // Get space members
  const members = await query(`
      SELECT 
        sm.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_system_role
      FROM space_members sm
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.space_id = $1::uuid
      ORDER BY sm.role DESC, u.name ASC
    `, [spaceId])

  const duration = Date.now() - startTime
  logger.apiResponse('GET', `/api/spaces/${spaceId}`, 200, duration)
  return NextResponse.json({
    space: spaceData,
    members: members.rows
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: commonSchemas.id,
  }))

  if (!paramValidation.success) {
    return paramValidation.response
  }

  const { id: spaceId } = paramValidation.data
  logger.apiRequest('PUT', `/api/spaces/${spaceId}`, { userId: session.user.id })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) return accessResult.response

  const bodySchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    is_default: z.boolean().optional(),
    slug: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable(),
    features: z.any().optional().nullable(),
    sidebar_config: z.any().optional().nullable(),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { name, description, is_default, slug, icon, logo_url, features, sidebar_config } = bodyValidation.data
  const iconProvided = Object.prototype.hasOwnProperty.call(bodyValidation.data, 'icon')
  const logoProvided = Object.prototype.hasOwnProperty.call(bodyValidation.data, 'logo_url')
  const featuresProvided = Object.prototype.hasOwnProperty.call(bodyValidation.data, 'features')
  const sidebarProvided = Object.prototype.hasOwnProperty.call(bodyValidation.data, 'sidebar_config')

  // Check if user has permission to update this space (admin/owner only)
  const memberCheck = await query(`
      SELECT role FROM space_members 
      WHERE space_id = $1::uuid AND user_id = $2::uuid
    `, [spaceId, session.user.id])

  if (memberCheck.rows.length === 0 || !['owner', 'admin'].includes(memberCheck.rows[0].role)) {
    logger.warn('Insufficient permissions to update space', { spaceId, userId: session.user.id })
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Update the space
  const result = await query(`
      UPDATE spaces 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_default = COALESCE($4::boolean, is_default),
        slug = COALESCE($5, slug),
        icon = CASE WHEN $8 THEN $6 ELSE icon END,
        logo_url = CASE WHEN $9 THEN $7 ELSE logo_url END,
        features = CASE WHEN $10 THEN COALESCE($11::jsonb, features) ELSE features END,
        sidebar_config = CASE WHEN $12 THEN COALESCE($13::jsonb, sidebar_config) ELSE sidebar_config END,
        updated_at = NOW()
      WHERE id = $1::uuid AND deleted_at IS NULL
      RETURNING *
    `, [spaceId, name?.trim(), description?.trim(), is_default, slug?.trim(), icon ?? null, logo_url ?? null, iconProvided, logoProvided, featuresProvided, features ?? null, sidebarProvided, sidebar_config ?? null])

  if (result.rows.length === 0) {
    logger.warn('Space not found for update', { spaceId })
    return NextResponse.json({ error: 'Space not found' }, { status: 404 })
  }

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', `/api/spaces/${spaceId}`, 200, duration)
  return NextResponse.json({
    space: result.rows[0],
    message: 'Space updated successfully'
  })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/spaces/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: commonSchemas.id,
  }))

  if (!paramValidation.success) {
    return addSecurityHeaders(paramValidation.response)
  }

  const { id: spaceId } = paramValidation.data
  logger.apiRequest('DELETE', `/api/spaces/${spaceId}`, { userId: session.user.id })

  // Allow deletion for any authenticated user

  // No special restrictions - allow deletion of any space

  // Soft delete the space
  await query(`
      UPDATE spaces 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1::uuid
    `, [spaceId])

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/spaces/${spaceId}`, 200, duration)
  return NextResponse.json({
    message: 'Space deleted successfully'
  })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/spaces/[id]')
