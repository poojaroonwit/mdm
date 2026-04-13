# System Feature

This feature contains all system configuration, theming, templates, and notification functionality.

## Structure

```
system/
├── components/
│   ├── SystemSettings.tsx      # System-wide settings
│   ├── ThemeBranding.tsx      # Theme and branding management
│   ├── PageTemplatesAdmin.tsx # Page template management
│   └── NotificationCenter.tsx # Notification templates and settings
├── types.ts                    # Shared type definitions
├── utils.ts                    # Utility functions
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Components

### SystemSettings
- General system settings (site name, URL, support email)
- Database configuration
- Email/SMTP configuration
- Security settings
- Feature toggles
- Storage configuration

### ThemeBranding
- Theme management (system and space-specific)
- Color palette configuration
- Typography settings
- Logo and favicon management
- Custom CSS
- Theme preview

### PageTemplatesAdmin
- Page template management
- Template scope (global vs space-specific)
- Template versioning
- Template visibility

### NotificationCenter
- Notification template management
- Email, push, SMS, and webhook templates
- Notification settings configuration
- Template variables
- Notification history

## Usage

```typescript
// Import components
import {
  SystemSettings,
  ThemeBranding,
  PageTemplatesAdmin,
  NotificationCenter,
} from '@/app/admin/features/system'

// Import types
import { SystemSettings, Theme, TemplateItem, NotificationTemplate } from '@/app/admin/features/system'

// Import utilities
import { isThemeActive, filterTemplatesByScope, formatNotificationType } from '@/app/admin/features/system'
```

## Types

- `SystemSettings` - System configuration
- `Theme` - Theme configuration
- `TemplateItem` - Page template information
- `NotificationTemplate` - Notification template configuration
- `NotificationSettings` - Notification service settings

## Utilities

- `isThemeActive(theme)` - Check if theme is active
- `filterThemesByType(themes, type)` - Filter themes by type
- `sortThemesByName(themes, order)` - Sort themes by name
- `filterTemplatesByScope(templates, scope)` - Filter templates by scope
- `filterTemplatesByCategory(templates, category)` - Filter templates by category
- `getAllTemplateCategories(templates)` - Get all unique categories
- `isNotificationTemplateActive(template)` - Check if notification template is active
- `filterNotificationTemplatesByType(templates, type)` - Filter notification templates by type
- `sortNotificationTemplatesByName(templates, order)` - Sort notification templates by name
- `formatNotificationType(type)` - Format notification type display name

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

