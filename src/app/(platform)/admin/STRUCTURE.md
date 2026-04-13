# Admin Folder Structure - Best Practices

## Current Issues
- 40+ components in a flat `components/` directory
- Hard to navigate and find related components
- No clear feature boundaries
- Mixed concerns (UI, business logic, utilities)

## Recommended Structure

```
src/app/admin/
├── page.tsx                          # Main admin page (redirect)
├── layout.tsx                        # Admin layout wrapper (if needed)
│
├── components/                       # Shared/admin-wide components
│   ├── shared/                      # Reusable admin components
│   │   ├── PreviewDialog.tsx
│   │   ├── VersionHistoryDialog.tsx
│   │   └── ...
│   └── layout/                      # Admin layout components
│       └── AdminSidebar.tsx
│
├── features/                        # Feature-based organization
│   │
│   ├── chatbot/                     # ✅ Already well-organized
│   │   ├── components/
│   │   ├── style/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   ├── users/                       # User & Role Management
│   │   ├── components/
│   │   │   ├── UserManagement.tsx
│   │   │   ├── RoleManagement.tsx
│   │   │   ├── PermissionTester.tsx
│   │   │   └── UserList.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── security/                    # Security & Authentication
│   │   ├── components/
│   │   │   ├── SecurityFeatures.tsx
│   │   │   ├── SSOConfiguration.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   └── SecuritySettings.tsx
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── data/                        # Data Management
│   │   ├── components/
│   │   │   ├── DatabaseManagement.tsx
│   │   │   ├── DataExportImport.tsx
│   │   │   ├── DataMasking.tsx
│   │   │   ├── DataModelManagement.tsx
│   │   │   ├── SchemaMigrations.tsx
│   │   │   └── SQLLinting.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── analytics/                   # Analytics & Monitoring
│   │   ├── components/
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── SystemHealthDashboard.tsx
│   │   │   ├── PerformanceMonitoring.tsx
│   │   │   └── LogManagement.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── storage/                     # Storage & Files
│   │   ├── components/
│   │   │   ├── StorageManagement.tsx
│   │   │   ├── AttachmentManager.tsx
│   │   │   └── CacheManagement.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── integration/                 # Integrations & APIs
│   │   ├── components/
│   │   │   ├── IntegrationHub.tsx
│   │   │   ├── APIManagement.tsx
│   │   │   └── APIConfiguration.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── spaces/                      # Space Management
│   │   ├── components/
│   │   │   ├── SpaceManagement.tsx
│   │   │   ├── SpaceSettingsAdmin.tsx
│   │   │   ├── SpaceLayoutsAdmin.tsx
│   │   │   └── SpaceSelection.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── system/                      # System Administration
│   │   ├── components/
│   │   │   ├── SystemSettings.tsx
│   │   │   ├── BackupRecovery.tsx
│   │   │   ├── KernelManagement.tsx
│   │   │   ├── KernelSetupGuide.tsx
│   │   │   └── ChangeRequests.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── business-intelligence/      # BI & Data Science
│   │   ├── components/
│   │   │   ├── BusinessIntelligence.tsx
│   │   │   ├── BigQueryInterface.tsx
│   │   │   ├── BigQueryInterfaceGranular.tsx
│   │   │   ├── DataScienceNotebook.tsx
│   │   │   └── AIAnalyst.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── content/                     # Content Management
│   │   ├── components/
│   │   │   ├── PageTemplatesAdmin.tsx
│   │   │   ├── ThemeBranding.tsx
│   │   │   └── ProjectsManagement.tsx
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── notifications/               # Notifications
│       ├── components/
│       │   └── NotificationCenter.tsx
│       ├── hooks/
│       ├── types.ts
│       └── utils.ts
│
├── hooks/                           # Shared admin hooks
│   ├── useAdminAuth.ts
│   ├── useAdminPermissions.ts
│   └── ...
│
├── lib/                             # Admin utilities & helpers
│   ├── api/
│   │   ├── users.ts
│   │   ├── security.ts
│   │   └── ...
│   ├── utils/
│   │   └── admin-helpers.ts
│   └── constants/
│       └── admin-constants.ts
│
├── types/                           # Shared admin types
│   ├── admin.ts
│   └── index.ts
│
└── spaces/                          # Space routes (keep as is)
    └── [space]/
        └── layout/
            └── page.tsx
```

## Benefits of This Structure

### 1. **Feature-Based Organization**
- Related components grouped together
- Easy to find all code for a feature
- Clear boundaries between features

### 2. **Scalability**
- Easy to add new features
- Each feature is self-contained
- Can extract features to separate packages if needed

### 3. **Maintainability**
- Clear separation of concerns
- Easier code reviews
- Reduced cognitive load

### 4. **Reusability**
- Shared components in `components/shared/`
- Shared hooks in `hooks/`
- Shared utilities in `lib/`

### 5. **Type Safety**
- Feature-specific types in each feature folder
- Shared types in `types/`
- Better IntelliSense support

## Migration Strategy

### Phase 1: Create Feature Folders
1. Create `features/` directory
2. Create feature subdirectories (users, security, data, etc.)
3. Create `components/` subdirectory in each feature

### Phase 2: Move Components
1. Move related components to their feature folders
2. Update imports in moved files
3. Update imports in files that use moved components

### Phase 3: Extract Shared Code
1. Move shared components to `components/shared/`
2. Extract shared hooks to `hooks/`
3. Extract shared utilities to `lib/`

### Phase 4: Clean Up
1. Remove empty `components/` directory (or keep only shared)
2. Update all import paths
3. Test all functionality

## Component Naming Conventions

- **Feature Components**: PascalCase (e.g., `UserManagement.tsx`)
- **Sub-components**: PascalCase with feature prefix (e.g., `UserList.tsx`, `UserForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUsers.ts`, `useUserPermissions.ts`)
- **Utils**: camelCase (e.g., `user-helpers.ts`, `format-utils.ts`)
- **Types**: camelCase (e.g., `user-types.ts`, `admin-types.ts`)

## Import Path Examples

```typescript
// Feature component
import { UserManagement } from '@/app/admin/features/users/components/UserManagement'

// Shared component
import { PreviewDialog } from '@/app/admin/components/shared/PreviewDialog'

// Feature hook
import { useUsers } from '@/app/admin/features/users/hooks/useUsers'

// Shared hook
import { useAdminAuth } from '@/app/admin/hooks/useAdminAuth'

// Feature types
import { User } from '@/app/admin/features/users/types'

// Shared types
import { AdminConfig } from '@/app/admin/types'
```

## Next Steps

1. Review and approve this structure
2. Start with one feature (e.g., `users/`) as a pilot
3. Gradually migrate other features
4. Update documentation as you go

