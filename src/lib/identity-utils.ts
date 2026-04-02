import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/db"
import type { AzureGroupRoleMapping } from "@/lib/sso"

const ALLOWED_PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'])

/**
 * Maps OAuth profile claims to internal User/AdminUser fields
 */
export function mapOAuthProfile(profile: any, provider: string) {
  const safeProfile = profile || {}

  if (provider === 'google') {
    return {
      email: safeProfile.email,
      name: safeProfile.name,
      avatarUrl: safeProfile.picture,
      firstName: safeProfile.given_name,
      lastName: safeProfile.family_name,
      emailVerified: typeof safeProfile.email_verified === 'boolean' ? safeProfile.email_verified : undefined,
    }
  }
  
  if (provider === 'github') {
    return {
      email: safeProfile.email,
      name: safeProfile.name || safeProfile.login,
      avatarUrl: safeProfile.avatar_url,
      // GitHub usually provides a single 'name' string
      firstName: safeProfile.name?.split(' ')[0] || safeProfile.login,
      lastName: safeProfile.name?.split(' ').slice(1).join(' ') || '',
    }
  }

  if (provider === 'azure-ad') {
    return {
      email: safeProfile.email || safeProfile.preferred_username,
      name: safeProfile.name,
      firstName: safeProfile.given_name,
      lastName: safeProfile.family_name,
      emailVerified: typeof safeProfile.email_verified === 'boolean' ? safeProfile.email_verified : undefined,
    }
  }

  return {
    email: safeProfile.email,
    name: safeProfile.name,
    emailVerified: typeof safeProfile.email_verified === 'boolean' ? safeProfile.email_verified : undefined,
  }
}

/**
 * Checks if an email domain is allowed for a specific provider
 */
export function isDomainAllowed(email: string, allowedDomains: string[]) {
  if (!allowedDomains || allowedDomains.length === 0) return true
  
  const domain = email.split('@')[1]
  if (!domain) return false
  
  return allowedDomains.some(allowed => {
    const pattern = allowed.startsWith('.') ? allowed : `@${allowed}`
    return email.endsWith(pattern) || domain === allowed
  })
}

export function isLoginMethodAllowed(methods: string[] | null | undefined, provider: string) {
  if (!methods || methods.length === 0) return true

  return methods.some((method) => method.toLowerCase() === provider.toLowerCase())
}

export function extractOAuthGroupIds(profile: any) {
  const groups = [
    ...(Array.isArray(profile?.groups) ? profile.groups : []),
    ...(Array.isArray(profile?.group_ids) ? profile.group_ids : []),
  ]

  return Array.from(
    new Set(
      groups
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

export async function fetchAzureGroupIds(accessToken: string | null | undefined) {
  if (!accessToken) {
    return []
  }

  const groupIds = new Set<string>()
  let nextUrl: string | null = 'https://graph.microsoft.com/v1.0/me/memberOf?$select=id'

  try {
    while (nextUrl) {
      const response: Response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })

      if (!response.ok) {
        return Array.from(groupIds)
      }

      const data: any = await response.json()
      for (const item of Array.isArray(data?.value) ? data.value : []) {
        if (typeof item?.id === 'string' && item.id.trim()) {
          groupIds.add(item.id.trim())
        }
      }

      nextUrl = typeof data?.['@odata.nextLink'] === 'string' ? data['@odata.nextLink'] : null
    }
  } catch {
    return Array.from(groupIds)
  }

  return Array.from(groupIds)
}

export async function resolveAzureGroupIds(profile: any, accessToken?: string | null) {
  const claimGroupIds = extractOAuthGroupIds(profile)
  if (claimGroupIds.length > 0) {
    return claimGroupIds
  }

  return fetchAzureGroupIds(accessToken)
}

export function resolveMappedRoleFromGroups(
  groupIds: string[] | null | undefined,
  mappings: AzureGroupRoleMapping[] | null | undefined
) {
  if (!groupIds?.length || !mappings?.length) {
    return null
  }

  const matchedRoles = mappings
    .filter((mapping) => groupIds.includes(mapping.groupId))
    .map((mapping) => mapping.role)
    .filter((role) => ALLOWED_PLATFORM_ROLES.has(role))

  if (matchedRoles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'
  if (matchedRoles.includes('ADMIN')) return 'ADMIN'
  if (matchedRoles.includes('MANAGER')) return 'MANAGER'
  if (matchedRoles.includes('USER')) return 'USER'
  return null
}

/**
 * Gets or creates a user from SSO profile
 */
export async function getOrCreateIdentityUser(
  email: string,
  name: string,
  provider: string,
  options?: {
    allowSignup?: boolean
    defaultRole?: string | null
    avatarUrl?: string | null
    mappedRole?: string | null
  }
) {
  const normalizedEmail = email.trim().toLowerCase()

  // First check admin_users
  const adminUser = await (prisma as any).adminUser.findUnique({
    where: { email: normalizedEmail },
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
  })

  if (adminUser) {
    return {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role?.name || 'ADMIN',
      avatarUrl: adminUser.avatarUrl,
      isSuperAdmin: adminUser.isSuperAdmin,
      type: 'admin',
      loginMethods: adminUser.loginMethods || [],
      permissions: adminUser.role?.rolePermissions.map((rp: any) => `${rp.permission.module}.${rp.action}`) || []
    }
  }

  // Then check regular users
  const user = await (prisma as any).user.findUnique({
    where: { email: normalizedEmail }
  })

  if (user) {
    let resolvedUser = user
    const nextRole =
      options?.mappedRole && ALLOWED_PLATFORM_ROLES.has(options.mappedRole) ? options.mappedRole : null

    if (nextRole && user.role !== nextRole) {
      resolvedUser = await (prisma as any).user.update({
        where: { id: user.id },
        data: { role: nextRole }
      })
    }

    return {
      id: resolvedUser.id,
      email: resolvedUser.email,
      name: resolvedUser.name,
      role: resolvedUser.role,
      avatarUrl: resolvedUser.avatar,
      isSuperAdmin: resolvedUser.role === 'SUPER_ADMIN',
      type: 'user',
      loginMethods: resolvedUser.allowedLoginMethods || [],
      permissions: []
    }
  }

  if (!options?.allowSignup) {
    return null
  }

  const role = options?.mappedRole && ALLOWED_PLATFORM_ROLES.has(options.mappedRole)
    ? options.mappedRole
    : options?.defaultRole && ALLOWED_PLATFORM_ROLES.has(options.defaultRole)
      ? options.defaultRole
      : 'USER'
  const password = await bcrypt.hash(randomUUID(), 12)
  const newUser = await (prisma as any).user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0] || 'SSO User',
      password,
      role,
      isActive: true,
      avatar: options.avatarUrl || undefined,
      allowedLoginMethods: provider ? [provider] : [],
    }
  })

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    avatarUrl: newUser.avatar,
    isSuperAdmin: newUser.role === 'SUPER_ADMIN',
    type: 'user',
    loginMethods: newUser.allowedLoginMethods || [],
    permissions: []
  }
}
