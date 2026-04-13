import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

// PUT /api/roles/[id]/permissions - replace role permissions with provided list (ADMIN+)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    logger.apiRequest('PUT', `/api/roles/${id}/permissions`)

    const bodySchema = z.object({
      permissionIds: z.array(z.string().uuid()).optional(),
      permission_ids: z.array(z.string().uuid()).optional(),
    }).refine(data => data.permissionIds || data.permission_ids, {
      message: "Either permissionIds or permission_ids must be provided",
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    const { permissionIds, permission_ids } = bodyValidation.data
    const finalPermissionIds = permissionIds || permission_ids!

    // Use simple transactional sequence
    await query('BEGIN')
    await query('DELETE FROM public.role_permissions WHERE role_id = $1', [id])
    for (const pid of finalPermissionIds) {
      await query('INSERT INTO public.role_permissions (role_id, permission_id) VALUES ($1, $2)', [id, pid])
    }
    await query('COMMIT')
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/roles/${id}/permissions`, 200, duration, {
      permissionCount: finalPermissionIds.length
    })
    return addSecurityHeaders(NextResponse.json({ success: true }))
  } catch (error) {
    await query('ROLLBACK').catch(() => {})
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Role Permissions API')
  }
}


