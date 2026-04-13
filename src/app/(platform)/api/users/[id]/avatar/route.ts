import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import { storeUploadedImage } from '@/lib/upload-storage'

// POST /api/users/[id]/avatar - upload user avatar
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('POST', `/api/users/${id}/avatar`, { userId: session.user.id })

  const isOwnProfile = session.user.id === id
  const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  if (!isOwnProfile && !isManager) {
    logger.warn('Forbidden avatar upload attempt', { targetUserId: id, userId: session.user.id })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar') as File

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (file.type && !allowedTypes.includes(file.type)) {
    logger.warn('Invalid file type for avatar upload', { fileType: file.type, userId: id })
    return NextResponse.json({
      error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
    }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    logger.warn('File too large for avatar upload', { fileSize: file.size, userId: id })
    return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
  }

  const userResult = await query('SELECT id, email, name, avatar FROM users WHERE id = $1', [id])
  if (userResult.rows.length === 0) {
    logger.warn('User not found for avatar upload', { userId: id })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userResult.rows[0]

  const fileExtension = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const fileName = `avatar_${id}_${Date.now()}.${fileExtension}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const avatarUrl = await storeUploadedImage('avatars', fileName, buffer, file.type || 'image/jpeg')

  await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, id])

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'User',
    entityId: id,
    oldValue: { avatar: user.avatar },
    newValue: { avatar: avatarUrl },
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  const duration = Date.now() - startTime
  logger.apiResponse('POST', `/api/users/${id}/avatar`, 200, duration, {
    fileSize: file.size,
    fileType: file.type,
  })
  return NextResponse.json({ success: true, avatar: avatarUrl, message: 'Avatar uploaded successfully' })
}

export const POST = withErrorHandling(postHandler, 'POST /api/users/[id]/avatar')

// PUT /api/users/[id]/avatar - set avatar from URL (library selection)
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('PUT', `/api/users/${id}/avatar`, { userId: session.user.id })

  const isOwnProfile = session.user.id === id
  const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  if (!isOwnProfile && !isManager) {
    logger.warn('Forbidden avatar update attempt', { targetUserId: id, userId: session.user.id })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bodySchema = z.object({
    avatarUrl: z.string().refine(
      (url) => {
        try { new URL(url); return true } catch { return url.startsWith('/') || url.startsWith('./') }
      },
      { message: 'Invalid avatar URL format' }
    ),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) return bodyValidation.response
  const { avatarUrl } = bodyValidation.data

  const userResult = await query('SELECT id, email, name, avatar FROM users WHERE id = $1', [id])
  if (userResult.rows.length === 0) {
    logger.warn('User not found for avatar update', { userId: id })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userResult.rows[0]

  await query('UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, id])

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'User',
    entityId: id,
    oldValue: { avatar: user.avatar },
    newValue: { avatar: avatarUrl },
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  const duration = Date.now() - startTime
  logger.apiResponse('PUT', `/api/users/${id}/avatar`, 200, duration)
  return NextResponse.json({ success: true, avatar: avatarUrl, message: 'Avatar set successfully' })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/users/[id]/avatar')

// DELETE /api/users/[id]/avatar - remove user avatar
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) return paramValidation.response
  const { id } = paramValidation.data
  logger.apiRequest('DELETE', `/api/users/${id}/avatar`, { userId: session.user.id })

  const isOwnProfile = session.user.id === id
  const isManager = session.user.role && ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  if (!isOwnProfile && !isManager) {
    logger.warn('Forbidden avatar deletion attempt', { targetUserId: id, userId: session.user.id })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userResult = await query('SELECT id, email, name, avatar FROM users WHERE id = $1', [id])
  if (userResult.rows.length === 0) {
    logger.warn('User not found for avatar deletion', { userId: id })
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const user = userResult.rows[0]

  await query('UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = $1', [id])

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'User',
    entityId: id,
    oldValue: { avatar: user.avatar },
    newValue: { avatar: null },
    userId: session.user.id,
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  })

  const duration = Date.now() - startTime
  logger.apiResponse('DELETE', `/api/users/${id}/avatar`, 200, duration)
  return NextResponse.json({ success: true, message: 'Avatar removed successfully' })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/users/[id]/avatar')
