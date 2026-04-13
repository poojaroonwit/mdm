/**
 * User Management Feature Types
 * Centralized type definitions for the users feature
 */

export interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  isTwoFactorEnabled: boolean
  avatar?: string
  createdAt: Date
  lastLoginAt?: Date
  defaultSpaceId?: string
  spaces: Array<{
    spaceId: string
    spaceName: string
    role: string
  }>
  groups?: Array<{
    groupId: string
    groupName: string
    role: string
  }>
  allowedLoginMethods?: string[]
  adUserId?: string
  jobTitle?: string
  department?: string
  organization?: string
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description: string
  level: 'global' | 'space'
  isSystem: boolean
  permissions: Permission[]
  userCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface UserFormData {
  name: string
  email: string
  role: string
  isActive: boolean
  defaultSpaceId?: string
  spaces?: Array<{
    spaceId: string
    role: string
  }>
  groupIds?: string[]
  allowedLoginMethods?: string[]
}

export interface RoleFormData {
  name: string
  description: string
  level: 'global' | 'space'
  permissions: string[]
}

export interface PermissionTestResult {
  hasPermission: boolean
  reason?: string
  userPermissions?: string[]
  rolePermissions?: string[]
}

export interface UserGroup {
  id: string
  name: string
  description?: string
  parentId?: string | null
  parent?: { id: string; name: string } | null
  isActive: boolean
  sortOrder: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  memberCount?: number
  childCount?: number
  children?: UserGroup[]
}

export interface UserGroupMember {
  id: string
  groupId: string
  userId: string
  role: string
  createdAt: Date
  userName?: string
  userEmail?: string
  userAvatar?: string
  userRole?: string
}

export interface UserGroupFormData {
  name: string
  description?: string
  parentId?: string | null
  sortOrder?: number
}
