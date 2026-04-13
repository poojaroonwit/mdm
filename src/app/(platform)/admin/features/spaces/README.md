# Spaces Feature

This feature contains all space management, layout templates, and space settings functionality.

## Structure

```
spaces/
├── components/
│   ├── SpaceSelection.tsx      # Space selection and management
│   ├── SpaceLayoutsAdmin.tsx  # Layout template management
│   └── SpaceSettingsAdmin.tsx # Space settings navigation
├── types.ts                    # Shared type definitions
├── utils.ts                    # Utility functions
├── index.ts                    # Public exports
└── README.md                   # This file
```

## Components

### SpaceSelection
- Space listing and management
- Space creation and editing
- Space filtering (by status, tags, search)
- Space status management (active, inactive, archive)
- Card and table view modes
- Tag management

### SpaceLayoutsAdmin
- Layout template management
- Template creation and editing
- Template preview
- Space-specific template assignment
- Template JSON configuration

### SpaceSettingsAdmin
- Space selection for settings navigation
- Quick navigation to space settings
- Space dropdown selector

## Usage

```typescript
// Import components
import {
  SpaceSelection,
  SpaceLayoutsAdmin,
  SpaceSettingsAdmin,
} from '@/app/admin/features/spaces'

// Import types
import { Space, LayoutTemplate } from '@/app/admin/features/spaces'

// Import utilities
import { isSpaceActive, filterSpacesByStatus, formatSpaceSlug } from '@/app/admin/features/spaces'
```

## Types

- `Space` - Space configuration
- `LayoutTemplate` - Layout template configuration

## Utilities

- `isSpaceActive(space)` - Check if space is active
- `isSpaceDefault(space)` - Check if space is default
- `isSpaceArchived(space)` - Check if space is archived
- `filterSpacesByStatus(spaces, status)` - Filter spaces by status
- `filterSpacesBySearch(spaces, query)` - Filter spaces by search query
- `filterSpacesByTags(spaces, tags)` - Filter spaces by tags
- `sortSpacesByName(spaces, order)` - Sort spaces by name
- `getAllTags(spaces)` - Get all unique tags from spaces
- `formatSpaceSlug(name)` - Format space name into URL-friendly slug

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

