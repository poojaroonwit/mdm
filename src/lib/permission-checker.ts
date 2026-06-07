import { query } from '@/lib/db'
import { Permission, Role } from '@/lib/permissions'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface UserRoleContext {
  userId: string
  globalRole?: string // SUPER_ADMIN, ADMIN, MANAGER, USER
  spaceId?: string
  spaceRole?: string // owner, admin, member, viewer, etc.
}

export interface PermissionCheckResult {
  hasPermission: boolean
  source: 'global' | 'space' | 'none'
  role?: string
  permissions: string[]
}

/**
 * Check if a user has a specific permission
 * Considers both global role and space role
 */
export async function checkPermission(
  context: UserRoleContext,
  permissionId: string
): Promise<PermissionCheckResult> {
  const { userId, globalRole, spaceId, spaceRole } = context

  // Get all permissions for the user
  const userPermissions = await getUserPermissions(context)

  const hasPermission = userPermissions.some(p => p === permissionId)

  // Determine source
  let source: 'global' | 'space' | 'none' = 'none'
  let role: string | undefined

  if (hasPermission) {
    // Check if permission comes from global role
    if (globalRole) {
      const globalPerms = await getRolePermissions(globalRole, 'global')
      if (globalPerms.includes(permissionId)) {
        source = 'global'
        role = globalRole
      }
    }

    // Check if permission comes from space role
    if (spaceId && spaceRole && source === 'none') {
      const spacePerms = await getRolePermissions(spaceRole, 'space')
      if (spacePerms.includes(permissionId)) {
        source = 'space'
        role = spaceRole
      }
    }
  }

  return {
    hasPermission,
    source,
    role,
    permissions: userPermissions
  }
}

/**
 * Get all permissions for a user (combining global and space roles)
 */
export async function getUserPermissions(
  context: UserRoleContext
): Promise<string[]> {
  const { globalRole, spaceId, spaceRole } = context
  const permissions: string[] = []

  // Get global role permissions
  if (globalRole) {
    const globalPerms = await getRolePermissions(globalRole, 'global')
    permissions.push(...globalPerms)
  }

  // Get space role permissions
  if (spaceId && spaceRole) {
    const spacePerms = await getRolePermissions(spaceRole, 'space')
    permissions.push(...spacePerms)
  }

  // Get custom permissions from member_permissions table
  if (spaceId) {
    const customPerms = await getCustomPermissions(context.userId, spaceId)
    permissions.push(...customPerms)
  }

  // Remove duplicates
  return Array.from(new Set(permissions))
}

/**
 * Get permissions for a specific role
 */
async function getRolePermissions(
  roleName: string,
  level: 'global' | 'space'
): Promise<string[]> {
  try {
    // First try to get role from database
    const { rows: roles } = await query(
      `SELECT r.id FROM public.roles r 
       WHERE r.name = $1 AND r.level = $2 
       LIMIT 1`,
      [roleName, level]
    )

    if (roles.length === 0) {
      return []
    }

    const roleId = roles[0].id

    // Get permissions for this role
    // Return in format "resource:action" for matching
    const { rows: perms } = await query(
      `SELECT p.name, p.resource, p.action
       FROM public.role_permissions rp
       JOIN public.permissions p ON p.id = rp.permission_id
       WHERE rp.role_id::text = $1`,
      [roleId]
    )

    // Return permissions in format "resource:action" (matching permission ID format)
    // If name is already in that format, use it; otherwise construct from resource:action
    return perms.map((p: any) => {
      // Check if name is already in "resource:action" format
      if (p.name && p.name.includes(':')) {
        return p.name
      }
      // Otherwise construct from resource and action
      return `${p.resource}:${p.action}`
    })
  } catch (error) {
    console.error('Error getting role permissions:', error)
    return []
  }
}

/**
 * Get custom permissions for a user in a space
 */
async function getCustomPermissions(
  userId: string,
  spaceId: string
): Promise<string[]> {
  try {
    const { rows } = await query(
      `SELECT permissions 
       FROM public.member_permissions 
       WHERE user_id::text = $1 AND space_id::text = $2 
       LIMIT 1`,
      [userId, spaceId]
    )

    if (rows.length === 0) {
      return []
    }

    return rows[0].permissions || []
  } catch (error) {
    console.error('Error getting custom permissions:', error)
    return []
  }
}

/**
 * Check if user can perform an action on a resource
 */
export async function canPerformAction(
  context: UserRoleContext,
  resource: string,
  action: string
): Promise<boolean> {
  const permissions = await getUserPermissions(context)
  const permissionId = `${resource}:${action}`
  return permissions.includes(permissionId)
}

/**
 * Get effective role for a user in a context
 * Returns the highest privilege role
 */
export function getEffectiveRole(context: UserRoleContext): {
  globalRole?: string
  spaceRole?: string
  effectiveLevel: 'global' | 'space' | 'none'
} {
  const { globalRole, spaceRole } = context

  // Global roles take precedence for system-level permissions
  if (globalRole && ['SUPER_ADMIN', 'ADMIN'].includes(globalRole)) {
    return {
      globalRole,
      spaceRole,
      effectiveLevel: 'global'
    }
  }

  // Space roles for space-specific permissions
  if (spaceRole) {
    return {
      globalRole,
      spaceRole,
      effectiveLevel: 'space'
    }
  }

  return {
    globalRole,
    spaceRole,
    effectiveLevel: 'none'
  }
}

/**
 * Get user role context from session and space (for API routes)
 */
export async function getUserRoleContext(
  request: NextRequest,
  spaceId?: string
): Promise<UserRoleContext | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  let spaceRole: string | undefined

  if (spaceId) {
    const spaceMember = await query(
      `SELECT role FROM space_members 
       WHERE space_id::text = $1 AND user_id::text = $2 
       LIMIT 1`,
      [spaceId, session.user.id]
    )
    if (spaceMember.rows.length > 0) {
      spaceRole = spaceMember.rows[0].role
    }
  }

  return {
    userId: session.user.id,
    globalRole: session.user.role || undefined,
    spaceId,
    spaceRole
  }
}

