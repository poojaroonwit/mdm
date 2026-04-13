/**
 * User Management Feature Utilities
 * Helper functions for user, role, and permission operations
 */

import { User, Role, Permission } from './types'

/**
 * Format user display name
 */
export function formatUserName(user: User): string {
  return user.name || user.email || 'Unknown User'
}

/**
 * Get user's primary role
 */
export function getUserPrimaryRole(user: User): string {
  return user.role || 'No Role'
}

/**
 * Check if user is active
 */
export function isUserActive(user: User): boolean {
  return user.isActive === true
}

/**
 * Get role display name
 */
export function formatRoleName(role: Role): string {
  return role.name || 'Unnamed Role'
}

/**
 * Check if role is system role (cannot be deleted)
 */
export function isSystemRole(role: Role): boolean {
  return role.isSystem === true
}

/**
 * Get permission display name
 */
export function formatPermissionName(permission: Permission): string {
  return permission.name || `${permission.resource}:${permission.action}`
}

/**
 * Filter users by search query
 */
export function filterUsers(users: User[], query: string): User[] {
  if (!query.trim()) return users
  
  const lowerQuery = query.toLowerCase()
  return users.filter(user => 
    user.name?.toLowerCase().includes(lowerQuery) ||
    user.email?.toLowerCase().includes(lowerQuery) ||
    user.role?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter roles by search query
 */
export function filterRoles(roles: Role[], query: string): Role[] {
  if (!query.trim()) return roles
  
  const lowerQuery = query.toLowerCase()
  return roles.filter(role =>
    role.name?.toLowerCase().includes(lowerQuery) ||
    role.description?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Sort users by field
 */
export function sortUsers(users: User[], field: 'name' | 'email' | 'role' | 'createdAt', order: 'asc' | 'desc' = 'asc'): User[] {
  const sorted = [...users].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (field) {
      case 'name':
        aValue = a.name || ''
        bValue = b.name || ''
        break
      case 'email':
        aValue = a.email || ''
        bValue = b.email || ''
        break
      case 'role':
        aValue = a.role || ''
        bValue = b.role || ''
        break
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
        break
      default:
        return 0
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
  
  return sorted
}

