import { NextRequest, NextResponse } from 'next/server'
import { query, db } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// GET /api/roles - list roles and their permissions (ADMIN+)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    logger.apiRequest('GET', '/api/roles')

    const querySchema = z.object({
      level: z.enum(['global', 'space']).optional(),
    })

    const queryValidation = validateQuery(request, querySchema)
    if (!queryValidation.success) {
      return addSecurityHeaders(queryValidation.response)
    }

    const level = queryValidation.data.level // 'global' or 'space' or null for all

    const roles = await db.role.findMany({
      where: level ? { level } : undefined as any,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const result = roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      level: r.level || 'space',
      isSystem: r.isSystem || false,
      permissions: r.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action
      }))
    }))

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/roles', 200, duration, {
      roleCount: result.length
    })
    return addSecurityHeaders(NextResponse.json({ roles: result }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/roles', 500, duration)
    return handleApiError(error, 'Roles API GET')
  }
}

// POST /api/roles - create role (ADMIN+)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const forbidden = await requireRole(request, 'ADMIN')
  if (forbidden) return addSecurityHeaders(forbidden)
  try {
    logger.apiRequest('POST', '/api/roles')

    const bodySchema = z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      level: z.enum(['global', 'space']).optional().default('space'),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { name, description, level } = bodyValidation.data

    const roleLevel = level === 'global' ? 'global' : 'space'
    
    // Use Prisma Client to handle ID generation automatically
    const role = await db.role.create({
      data: {
        name,
        description: description || null,
        level: roleLevel,
        isSystem: false,
      } as any
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/roles', 201, duration, {
      roleId: role.id
    })
    return addSecurityHeaders(NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        level: (role as any).level,
        isSystem: (role as any).isSystem, // Prisma maps is_system to isSystem
      }
    }, { status: 201 }))
  } catch (error: any) {
    const duration = Date.now() - startTime
    if (String(error?.message || '').includes('duplicate')) {
      logger.warn('Role already exists', { name })
      return addSecurityHeaders(NextResponse.json({ error: 'Role already exists' }, { status: 409 }))
    }
    logger.apiResponse('POST', '/api/roles', 500, duration)
    return handleApiError(error, 'Roles API POST')
  }
}


