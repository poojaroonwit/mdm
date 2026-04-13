import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { encryptApiKey } from '@/lib/encryption'
import { clearSSOProviderCache, SSO_SECRET_MASK } from '@/lib/sso'

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function parseAzureGroupRoleMappings(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const groupId = typeof (item as any).groupId === 'string' ? (item as any).groupId.trim() : ''
      const role = typeof (item as any).role === 'string' ? (item as any).role.trim().toUpperCase() : ''
      const name = typeof (item as any).name === 'string' ? (item as any).name.trim() : ''
      if (!groupId || !PLATFORM_ROLES.has(role)) {
        return null
      }

      return {
        groupId,
        role,
        ...(name ? { name } : {}),
      }
    })
    .filter(Boolean)
}

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    const googleProvider = await (prisma as any).oAuthProvider.findFirst({
      where: { providerName: 'google' }
    })
    const azureProvider = await (prisma as any).oAuthProvider.findFirst({
      where: { providerName: { in: ['azure-ad', 'microsoft'] } }
    })
    const azurePlatformConfig =
      azureProvider?.platformConfig && typeof azureProvider.platformConfig === 'object'
        ? azureProvider.platformConfig as Record<string, any>
        : {}

    return NextResponse.json({
      config: {
        googleEnabled: googleProvider?.isEnabled ?? false,
        azureEnabled: azureProvider?.isEnabled ?? false,
        googleClientId: googleProvider?.clientId || '',
        googleClientSecret: googleProvider?.clientSecret ? SSO_SECRET_MASK : '',
        azureTenantId: azurePlatformConfig.tenantId || '',
        azureClientId: azureProvider?.clientId || '',
        azureClientSecret: azureProvider?.clientSecret ? SSO_SECRET_MASK : '',
        azureAllowedDomains: Array.isArray(azureProvider?.allowedDomains) ? azureProvider.allowedDomains : [],
        azureAllowSignup: azureProvider?.allowSignup ?? false,
        azureRequireEmailVerified: azureProvider?.requireEmailVerified ?? true,
        azureDefaultRole:
          typeof azureProvider?.defaultRole === 'string' && PLATFORM_ROLES.has(azureProvider.defaultRole)
            ? azureProvider.defaultRole
            : 'USER',
        azureGroupRoleMappings: parseAzureGroupRoleMappings(azurePlatformConfig.groupRoleMappings),
      }
    })
  } catch (error) {
    console.error('Error fetching SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function putHandler(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { config } = body as {
      config: {
        googleEnabled: boolean
        azureEnabled: boolean
        googleClientId: string
        googleClientSecret: string
        azureTenantId: string
        azureClientId: string
        azureClientSecret: string
        azureAllowedDomains?: string[]
        azureAllowSignup?: boolean
        azureRequireEmailVerified?: boolean
        azureDefaultRole?: string
        azureGroupRoleMappings?: Array<{ groupId: string; role: string; name?: string }>
      }
    }

    if (!config) {
      return NextResponse.json({ error: 'Config object is required' }, { status: 400 })
    }

    if (config.googleClientId) {
      const existing = await (prisma as any).oAuthProvider.findFirst({
        where: { providerName: 'google' }
      })

      const secretRaw = config.googleClientSecret && config.googleClientSecret !== SSO_SECRET_MASK
        ? encryptApiKey(config.googleClientSecret)
        : (existing?.clientSecret || '')

      const googleData = {
        providerName: 'google',
        displayName: 'Google',
        isEnabled: config.googleEnabled,
        clientId: config.googleClientId,
        clientSecret: secretRaw,
        scopes: ['openid', 'email', 'profile'],
        allowedDomains: [],
        displayOrder: 1,
      }

      if (existing) {
        await (prisma as any).oAuthProvider.update({
          where: { id: existing.id },
          data: { ...googleData, updatedAt: new Date() },
        })
      } else {
        await (prisma as any).oAuthProvider.create({ data: googleData })
      }
    }

    if (config.azureClientId) {
      const existing = await (prisma as any).oAuthProvider.findFirst({
        where: { providerName: { in: ['azure-ad', 'microsoft'] } }
      })

      const secretRaw = config.azureClientSecret && config.azureClientSecret !== SSO_SECRET_MASK
        ? encryptApiKey(config.azureClientSecret)
        : (existing?.clientSecret || '')

      const tenantId = config.azureTenantId || ''
      const azureAllowedDomains = parseStringArray(config.azureAllowedDomains)
      const azureGroupRoleMappings = parseAzureGroupRoleMappings(config.azureGroupRoleMappings)
      const azureDefaultRole =
        config.azureDefaultRole && PLATFORM_ROLES.has(config.azureDefaultRole)
          ? config.azureDefaultRole
          : 'USER'
      const existingPlatformConfig =
        existing?.platformConfig && typeof existing.platformConfig === 'object'
          ? existing.platformConfig as Record<string, any>
          : {}
      const azureData = {
        providerName: 'azure-ad',
        displayName: 'Microsoft Azure',
        isEnabled: config.azureEnabled,
        clientId: config.azureClientId,
        clientSecret: secretRaw,
        authorizationUrl: tenantId
          ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
          : null,
        tokenUrl: tenantId
          ? `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
          : null,
        scopes: ['openid', 'email', 'profile', 'offline_access', 'User.Read'],
        allowedDomains: azureAllowedDomains,
        allowSignup: config.azureAllowSignup ?? false,
        requireEmailVerified: config.azureRequireEmailVerified ?? true,
        defaultRole: azureDefaultRole,
        displayOrder: 2,
        platformConfig: {
          ...existingPlatformConfig,
          ...(tenantId ? { tenantId } : {}),
          groupRoleMappings: azureGroupRoleMappings,
        },
      }

      if (existing) {
        await (prisma as any).oAuthProvider.update({
          where: { id: existing.id },
          data: { ...azureData, updatedAt: new Date() },
        })
      } else {
        await (prisma as any).oAuthProvider.create({ data: azureData })
      }
    }

    clearSSOProviderCache()

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'SSOConfig',
      entityId: 'system',
      newValue: {
        googleEnabled: config.googleEnabled,
        azureEnabled: config.azureEnabled,
        azureAllowedDomains: parseStringArray(config.azureAllowedDomains),
        azureAllowSignup: config.azureAllowSignup ?? false,
        azureRequireEmailVerified: config.azureRequireEmailVerified ?? true,
        azureDefaultRole:
          config.azureDefaultRole && PLATFORM_ROLES.has(config.azureDefaultRole)
            ? config.azureDefaultRole
            : 'USER',
        azureGroupRoleMappings: parseAzureGroupRoleMappings(config.azureGroupRoleMappings),
      },
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, message: 'SSO configuration saved successfully' })
  } catch (error) {
    console.error('Error updating SSO config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/sso-config')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/sso-config')
