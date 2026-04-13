# Users Feature

This feature contains all user, role, and permission management functionality.

## Structure

```
users/
├── components/
│   ├── UserManagement.tsx      # Main user management component
│   ├── RoleManagement.tsx      # Role and permission management
│   └── PermissionTester.tsx    # Permission testing tool
├── types.ts                    # Shared type definitions
├── utils.ts                    # Utility functions
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Components

### UserManagement
- User CRUD operations
- User search and filtering
- Bulk user operations
- User space assignments
- Password reset functionality

### RoleManagement
- Role CRUD operations
- Permission assignment
- Role templates
- Role cloning
- Role analytics

### PermissionTester
- Test user permissions
- Permission debugging
- Space-level permission testing

## Usage

```typescript
// Import components
import { UserManagement, RoleManagement, PermissionTester } from '@/app/admin/features/users'

// Import types
import { User, Role, Permission } from '@/app/admin/features/users'

// Import utilities
import { formatUserName, filterUsers, sortUsers } from '@/app/admin/features/users'
```

## Types

- `User` - User entity
- `Role` - Role entity
- `Permission` - Permission entity
- `UserFormData` - User form data
- `RoleFormData` - Role form data
- `PermissionTestResult` - Permission test result

## Utilities

- `formatUserName(user)` - Format user display name
- `getUserPrimaryRole(user)` - Get user's primary role
- `isUserActive(user)` - Check if user is active
- `formatRoleName(role)` - Format role display name
- `isSystemRole(role)` - Check if role is system role
- `formatPermissionName(permission)` - Format permission display name
- `filterUsers(users, query)` - Filter users by search query
- `filterRoles(roles, query)` - Filter roles by search query
- `sortUsers(users, field, order)` - Sort users by field

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

