/**
 * User Management Feature
 * Main export file for the users feature
 */

// Components
export { UserManagement } from './components/UserManagement'
export { UserGroupManagement } from './components/UserGroupManagement'
export { RoleManagement } from './components/RoleManagement'
export { PermissionTester } from './components/PermissionTester'

// Types
export type {
  User,
  Role,
  Permission,
  UserFormData,
  RoleFormData,
  PermissionTestResult,
} from './types'

// Utils
export {
  formatUserName,
  getUserPrimaryRole,
  isUserActive,
  formatRoleName,
  isSystemRole,
  formatPermissionName,
  filterUsers,
  filterRoles,
  sortUsers,
} from './utils'

