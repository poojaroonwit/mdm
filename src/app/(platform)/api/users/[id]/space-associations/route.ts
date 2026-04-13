import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET /api/users/[id]/space-associations - get user's space associations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return addSecurityHeaders(forbidden)

  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/users/${id}/space-associations`)
    const { rows } = await query(`
      SELECT 
        sm.id,
        sm.space_id,
        sm.role,
        sm.created_at,
        s.name as space_name,
        s.description as space_description,
        s.is_default as space_is_default,
        s.is_active as space_is_active
      FROM space_members sm
      JOIN spaces s ON sm.space_id = s.id
      WHERE sm.user_id = $1 AND s.deleted_at IS NULL
      ORDER BY s.is_default DESC, s.name ASC
    `, [id])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/users/${id}/space-associations`, 200, duration, {
      spaceCount: rows.length
    })
    return addSecurityHeaders(NextResponse.json({ spaces: rows }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'User Space Associations API GET')
  }
}

// PUT /api/users/[id]/space-associations - update user's space associations
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return addSecurityHeaders(forbidden)

  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/users/${id}/space-associations`)

    const bodySchema = z.object({
      spaces: z.array(z.object({
        space_id: commonSchemas.id,
        role: z.enum(['owner', 'admin', 'member', 'viewer']),
      })),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { spaces } = bodyValidation.data

    // Start transaction
    await query('BEGIN')

    try {
      // Remove existing space memberships
      await query('DELETE FROM space_members WHERE user_id = $1', [id])
      
      // Add new space memberships
      for (const space of spaces) {
        await query(
          'INSERT INTO space_members (user_id, space_id, role) VALUES ($1, $2, $3)',
          [id, space.space_id, space.role]
        )
      }

      // Commit transaction
      await query('COMMIT')

      // Return updated space associations
      const { rows } = await query(`
        SELECT 
          sm.id,
          sm.space_id,
          sm.role,
          sm.created_at,
          s.name as space_name,
          s.description as space_description,
          s.is_default as space_is_default,
          s.is_active as space_is_active
        FROM space_members sm
        JOIN spaces s ON sm.space_id = s.id
        WHERE sm.user_id = $1 AND s.deleted_at IS NULL
        ORDER BY s.is_default DESC, s.name ASC
      `, [id])

      const duration = Date.now() - startTime
      logger.apiResponse('PUT', `/api/users/${id}/space-associations`, 200, duration, {
        spaceCount: rows.length
      })
      return addSecurityHeaders(NextResponse.json({ spaces: rows }))
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK')
      throw error
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'User Space Associations API PUT')
  }
}
