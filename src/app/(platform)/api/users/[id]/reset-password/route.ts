import { NextRequest, NextResponse } from 'next/server'
// deepcode ignore javascript/NoHardcodedPasswords: Audit log redactions are mistaken for passwords
import { requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

// POST /api/users/[id]/reset-password - reset user password (ADMIN+)
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: commonSchemas.id,
  }))

  if (!paramValidation.success) {
    return paramValidation.response
  }

  const { id } = paramValidation.data
  logger.apiRequest('POST', `/api/users/${id}/reset-password`, { userId: session.user.id })

  const bodySchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { newPassword } = bodyValidation.data

  // Check if user exists
  const userResult = await query(
    'SELECT id, email, name FROM users WHERE id = $1',
    [id]
  )

  if (userResult.rows.length === 0) {
    logger.warn('User not found for password reset', { targetUserId: id, adminUserId: session.user.id })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const user = userResult.rows[0]

  // Hash the new password
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Update the password
  await query(
    'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
    [hashedPassword, id]
  )

  // Create audit log
  await createAuditLog({
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: id,
    // deepcode ignore NoHardcodedPasswords: This is an audit log redaction, not a real password
    oldValue: { password: '[HIDDEN]' },
    // deepcode ignore NoHardcodedPasswords: This is an audit log redaction, not a real password
    newValue: { password: '[RESET]' },
    userId: session.user.id, // The admin who reset the password
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    // description: `Password reset for user ${user.email} by admin`
  })

  const duration = Date.now() - startTime
  logger.apiResponse('POST', `/api/users/${id}/reset-password`, 200, duration, {
    targetUserId: id,
  })
  return NextResponse.json({
    success: true,
    message: 'Password reset successfully'
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/users/[id]/reset-password')
