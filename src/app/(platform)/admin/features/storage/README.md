# Storage Feature

This feature contains all storage, cache, and backup/recovery functionality.

## Structure

```
storage/
├── components/
│   ├── StorageManagement.tsx    # File storage and bucket management
│   ├── CacheManagement.tsx      # Cache instance and key management
│   └── BackupRecovery.tsx       # Backup and restore operations
├── types.ts                     # Shared type definitions
├── utils.ts                     # Utility functions
├── index.ts                     # Public exports
└── README.md                    # This file
```

## Components

### StorageManagement
- Bucket management (create, delete, configure)
- File upload and download
- File organization (folders, paths)
- File preview and metadata
- File permissions and sharing
- Search and filtering
- Grid and list view modes

### CacheManagement
- Cache instance management (Redis, Memcached, etc.)
- Cache key browsing and management
- Cache statistics and monitoring
- Cache configuration
- Memory usage tracking
- Hit/miss rate analysis

### BackupRecovery
- Backup creation and management
- Backup scheduling
- Restore point management
- Backup encryption
- Retention policies
- Restore operations

## Usage

```typescript
// Import components
import {
  StorageManagement,
  CacheManagement,
  BackupRecovery,
} from '@/app/admin/features/storage'

// Import types
import { Bucket, StorageFile, CacheInstance, Backup } from '@/app/admin/features/storage'

// Import utilities
import { formatFileSize, getFileIcon, filterFiles } from '@/app/admin/features/storage'
```

## Types

- `Bucket` - Storage bucket configuration
- `StorageFile` - File metadata
- `CacheInstance` - Cache instance configuration
- `CacheKey` - Cache key information
- `CacheStats` - Cache statistics
- `CacheConfig` - Cache configuration
- `Backup` - Backup information
- `BackupSchedule` - Backup schedule configuration
- `RestorePoint` - Restore point information

## Utilities

- `formatFileSize(bytes)` - Format file size in human-readable format
- `getFileIcon(mimeType)` - Get file icon based on MIME type
- `isImageFile(file)` - Check if file is an image
- `isVideoFile(file)` - Check if file is a video
- `getCacheStatusColor(status)` - Get badge color for cache status
- `calculateCacheHitRate(hits, misses)` - Calculate cache hit rate percentage
- `getBackupStatusColor(status)` - Get badge color for backup status
- `filterFiles(files, query)` - Filter files by search query
- `filterFilesByType(files, type)` - Filter files by type
- `sortFiles(files, sortBy, order)` - Sort files by name, size, or date
- `calculateBucketSize(bucket)` - Calculate bucket total size
- `isBackupScheduled(backup)` - Check if backup is scheduled
- `isBackupRunning(backup)` - Check if backup is running
- `isBackupCompleted(backup)` - Check if backup is completed
- `isScheduleActive(schedule)` - Check if schedule is active
- `formatBackupType(type)` - Format backup type display name
- `formatScheduleFrequency(frequency)` - Format schedule frequency display name

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

