import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// GET /api/users/[id] - get user (MANAGER+)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    logger.apiRequest('GET', `/api/users/${id}`)
    const { rows } = await query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.updated_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', sp.id,
              'name', sp.name,
              'role', sm.role
            )
          ) FROM space_members sm
          JOIN spaces sp ON sm.space_id = sp.id
          WHERE sm.user_id::text = u.id::text AND sp.deleted_at IS NULL
          ), '[]'::json
        ) as spaces
      FROM users u
      WHERE u.id::text = $1
      LIMIT 1
    `, [id])
    if (!rows.length) {
      logger.warn('User not found', { userId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/users/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ user: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Users API GET')
  }
}

// PUT /api/users/[id] - update user (MANAGER+); role changes require ADMIN+
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    logger.apiRequest('PUT', `/api/users/${id}`)

    const bodySchema = z.object({
      email: z.string().email().optional(),
      name: z.string().min(1).optional(),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']).optional(),
      is_active: z.boolean().optional(),
      password: z.string().min(8).optional(),
      spaces: z.array(z.object({
        id: z.string().uuid(),
        role: z.string(),
      })).optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { email, name, role, is_active, password, spaces } = bodyValidation.data

    // Role changes require ADMIN or higher to prevent privilege escalation
    if (role) {
      const adminForbidden = await requireRole(request, 'ADMIN')
      if (adminForbidden) return addSecurityHeaders(adminForbidden)
    }

    const sets: string[] = []
    const values: any[] = []

    if (email) { values.push(email); sets.push(`email = $${values.length}`) }
    if (name) { values.push(name); sets.push(`name = $${values.length}`) }
    if (typeof is_active === 'boolean') { values.push(is_active); sets.push(`is_active = $${values.length}::boolean`) }
    if (role) {
      values.push(role); sets.push(`role = $${values.length}`)
    }
    if (password) {
      const bcrypt = await import('bcryptjs')
      const hashed = await bcrypt.hash(password, 12)
      values.push(hashed)
      sets.push(`password = $${values.length}`)
    }

    if (!sets.length) {
      return addSecurityHeaders(NextResponse.json({ error: 'No fields to update' }, { status: 400 }))
    }

    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM users WHERE id::text = $1', [id])
    const currentData = currentDataResult.rows[0]

    values.push(id)
    const sql = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id::text = $${values.length} RETURNING id, email, name, role, is_active, created_at, updated_at`

    const { rows } = await query(sql, values)
    if (!rows.length) {
      logger.warn('User not found for update', { userId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }

    // Handle space memberships if provided
    if (spaces && Array.isArray(spaces)) {
      await query('DELETE FROM space_members WHERE user_id::text = $1', [id])

      for (const space of spaces) {
        if (space.id && space.role) {
          await query(
            'INSERT INTO space_members (user_id, space_id, role) VALUES ($1::uuid, $2::uuid, $3)',
            [id, space.id, space.role]
          )
        }
      }
    }

    // Get session to record the actor in audit log
    const session = await getServerSession(authOptions)
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session?.user?.id || id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/users/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ user: rows[0] }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Users API PUT')
  }
}

// DELETE /api/users/[id] - delete user (ADMIN+)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
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
    logger.apiRequest('DELETE', `/api/users/${id}`)

    const { rows } = await query('DELETE FROM users WHERE id::text = $1', [id])
    if (!rows.length) {
      logger.warn('User not found for deletion', { userId: id })
      return addSecurityHeaders(NextResponse.json({ error: 'Not found' }, { status: 404 }))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/users/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Users API DELETE')
  }
}


