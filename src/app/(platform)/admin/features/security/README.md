# Security Feature

This feature contains all security, authentication, and audit logging functionality.

## Structure

```
security/
├── components/
│   ├── SecurityFeatures.tsx    # Security policies and settings
│   ├── SSOConfiguration.tsx   # Single Sign-On configuration
│   └── AuditLogs.tsx         # Audit log viewer and management
├── types.ts                   # Shared type definitions
├── utils.ts                   # Utility functions
├── index.ts                   # Public exports
└── README.md                  # This file
```

## Components

### SecurityFeatures
- Security policy management
- Password policies
- Session policies
- IP whitelisting
- Rate limiting
- Two-factor authentication settings
- Security event monitoring

### SSOConfiguration
- Google SSO setup
- Azure AD SSO setup
- SSO provider management

### AuditLogs
- Audit log viewing
- Log filtering and search
- Log export
- Security event tracking
- User activity monitoring

## Usage

```typescript
// Import components
import { SecurityFeatures, SSOConfiguration, AuditLogs } from '@/app/admin/features/security'

// Import types
import { SecurityPolicy, SSOConfig, AuditLog } from '@/app/admin/features/security'

// Import utilities
import { filterAuditLogs, getSeverityColor, sortAuditLogs } from '@/app/admin/features/security'
```

## Types

- `SecurityPolicy` - Security policy configuration
- `SSOConfig` - Single Sign-On configuration
- `AuditLog` - Audit log entry
- `SecurityEvent` - Security event
- `IPWhitelist` - IP whitelist entry
- `SecuritySettings` - Security settings configuration

## Utilities

- `getSeverityColor(severity)` - Get badge color for severity level
- `getStatusColor(status)` - Get badge color for audit log status
- `filterAuditLogs(logs, query)` - Filter audit logs by search query
- `filterBySeverity(logs, severity)` - Filter logs by severity level
- `filterByStatus(logs, status)` - Filter logs by status
- `sortAuditLogs(logs, order)` - Sort audit logs by timestamp
- `isPolicyActive(policy)` - Check if security policy is active
- `formatPolicyType(type)` - Format policy type display name
- `getSecurityEventIcon(type)` - Get icon name for security event type

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

