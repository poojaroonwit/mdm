import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query, prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { authOptions } from '@/lib/auth'
import { addSecurityHeaders } from '@/lib/security-headers'
import { clearSystemRuntimeSettingsCache } from '@/lib/system-runtime-settings'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  // Check for session but don't require it for GET
  const session = await getServerSession(authOptions)
  const isAuthenticated = !!session?.user
  const isAdmin = (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'SUPER_ADMIN'

  logger.apiRequest('GET', '/api/settings', { userId: session?.user?.id || 'anonymous' })

  const { rows } = await query('SELECT key, value FROM system_settings ORDER BY key ASC')
  
  // Define sensitive keys that should only be visible to admins
  const sensitiveKeys = [
    'dbPassword', 'smtpPassword', 'dbUser', 'smtpUser', 'dbHost', 'dbPort', 'dbName',
    'smtpHost', 'smtpPort', 'smtpSecure', 'cronApiKey', 'schedulerApiKey',
    'serviceDeskWebhookSecret', 'gitWebhookSecret'
  ]

  const settingsObject = (rows || []).reduce((acc: Record<string, any>, setting: any) => {
    // Skip sensitive keys if not authenticated as admin
    if (!isAdmin && sensitiveKeys.includes(setting.key)) {
      return acc
    }

    const value = setting.value
    // Parse boolean strings
    if (value === 'true') acc[setting.key] = true
    else if (value === 'false') acc[setting.key] = false
    // Parse numeric strings (only if it's purely a number and not empty)
    else if (!isNaN(Number(value)) && value.trim() !== '' && !value.startsWith('0')) {
      acc[setting.key] = Number(value)
    }
    // Try to parse JSON for objects/arrays
    else if (value && (value.startsWith('{') || value.startsWith('['))) {
      try {
        acc[setting.key] = JSON.parse(value)
      } catch {
        acc[setting.key] = value
      }
    }
    else {
      acc[setting.key] = value
    }
    return acc
  }, {})

  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/settings', 200, duration, {
    settingCount: Object.keys(settingsObject).length,
    isPublic: !isAuthenticated
  })
  
  const response = NextResponse.json(settingsObject)
  return addSecurityHeaders(response)
}


async function putHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('PUT', '/api/settings', { userId: session.user.id })

  const bodySchema = z.object({
    settings: z.record(z.string(), z.any()),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { settings } = bodyValidation.data

  try {
    // Get current settings for audit log
    const currentSettingsResult = await query('SELECT key, value FROM system_settings')
    const currentSettings = (currentSettingsResult.rows || []).reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    const updatedSettings: Record<string, any> = {}
    // Initialize updatedSettings with current values, then apply changes from the request
    Object.assign(updatedSettings, currentSettings)

    const serializedValues = new Map<string, string>()
    const changeEntries = Object.entries(settings).filter(([key, value]) => {
      const serializedValue = typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value)

      serializedValues.set(key, serializedValue)

      // Update the updatedSettings object with the new value from the request
      // This ensures updatedSettings reflects the *intended* final state for audit log
      updatedSettings[key] = value

      return currentSettings[key] !== serializedValue
    })

    if (changeEntries.length > 0) {
      // Use a transaction for better performance and consistency
      await prisma.$transaction(
        changeEntries.map(([key]) => {
          const serializedValue = serializedValues.get(key)!
          return prisma.systemSetting.upsert({
            where: { key },
            update: { value: serializedValue, updatedAt: new Date() },
            create: { key, value: serializedValue }
          })
        })
      )

      clearSystemRuntimeSettingsCache()
    }

    // Create audit log
    // Create audit log - wrap in try/catch so it doesn't fail the request
    try {
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'SystemSettings',
        entityId: 'system',
        oldValue: currentSettings,
        newValue: updatedSettings,
        userId: session.user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      })
    } catch (auditError: any) {
      logger.warn('Failed to create audit log for settings update', { error: auditError.message })
      // Continue execution - don't fail the request just because audit logging failed
    }

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', '/api/settings', 200, duration, {
      updatedCount: Object.keys(updatedSettings).length
    })
    return NextResponse.json(updatedSettings)
  } catch (error: any) {
    // Handle missing table error gracefully
    const isTableMissing =
      error?.code === '42P01' ||
      error?.message?.includes('does not exist') ||
      error?.message?.includes('relation')

    if (isTableMissing) {
      logger.error('System settings table does not exist', { error: error.message })
      return NextResponse.json(
        { error: 'System settings table not found. Please run database migrations.' },
        { status: 503 }
      )
    }

    logger.error('Failed to update settings', { error: error.message })
    throw error
  }
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/settings')


export const GET = withErrorHandling(getHandler, 'GET /api/settings')
