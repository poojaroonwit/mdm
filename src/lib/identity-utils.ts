import { prisma } from "@/lib/db"

/**
 * Maps OAuth profile claims to internal User/AdminUser fields
 */
export function mapOAuthProfile(profile: any, provider: string) {
  if (provider === 'google') {
    return {
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      firstName: profile.given_name,
      lastName: profile.family_name,
    }
  }
  
  if (provider === 'github') {
    return {
      email: profile.email,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
      // GitHub usually provides a single 'name' string
      firstName: profile.name?.split(' ')[0] || profile.login,
      lastName: profile.name?.split(' ').slice(1).join(' ') || '',
    }
  }

  if (provider === 'azure-ad') {
    return {
      email: profile.email || profile.preferred_username,
      name: profile.name,
      firstName: profile.given_name,
      lastName: profile.family_name,
    }
  }

  return {
    email: profile.email,
    name: profile.name,
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

/**
 * Gets or creates a user from SSO profile
 */
export async function getOrCreateIdentityUser(email: string, name: string, provider: string) {
  // First check admin_users
  const adminUser = await (prisma as any).adminUser.findUnique({
    where: { email },
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
      permissions: adminUser.role?.rolePermissions.map((rp: any) => `${rp.permission.module}.${rp.action}`) || []
    }
  }

  // Then check regular users
  const user = await (prisma as any).user.findUnique({
    where: { email }
  })

  if (user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatar,
      isSuperAdmin: user.role === 'SUPER_ADMIN',
      type: 'user',
      permissions: []
    }
  }

  // If not found, and it's a new sign up (handled by NextAuth logic later)
  return null
}
