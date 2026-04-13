# StorageManagement Refactoring Plan

## Current State
- **File:** `StorageManagement.tsx`
- **Lines:** 1334
- **Status:** Monolithic component with all functionality in one file

## Target Structure

```
components/
├── StorageManagement.tsx          # Main orchestrator (~200-300 lines)
├── BucketList.tsx                 # Bucket sidebar
├── FileBrowser.tsx                # Main file browser area
├── FileGrid.tsx                   # Grid view of files
├── FileList.tsx                   # List view of files
├── FileToolbar.tsx                # Toolbar with actions
├── FileBreadcrumb.tsx             # Breadcrumb navigation
├── dialogs/
│   ├── CreateBucketDialog.tsx     # Create bucket dialog
│   ├── UploadDialog.tsx           # File upload dialog
│   ├── CreateFolderDialog.tsx     # Create folder dialog
│   ├── FileMetadataDialog.tsx     # File metadata/preview
│   ├── FilePermissionsDialog.tsx # Permissions dialog
│   ├── RenameDialog.tsx           # Rename dialog
│   └── MoveDialog.tsx              # Move file dialog
└── hooks/
    ├── useStorageBuckets.ts       # Bucket management
    ├── useStorageFiles.ts         # File operations
    ├── useFileUpload.ts           # Upload handling
    └── useFileOperations.ts       # File CRUD operations
```

## Extraction Plan

### Phase 1: Extract Dialogs
1. CreateBucketDialog
2. UploadDialog
3. CreateFolderDialog
4. FileMetadataDialog
5. FilePermissionsDialog
6. RenameDialog
7. MoveDialog

### Phase 2: Extract UI Components
1. BucketList
2. FileBrowser
3. FileGrid
4. FileList
5. FileToolbar
6. FileBreadcrumb

### Phase 3: Extract Hooks
1. useStorageBuckets
2. useStorageFiles
3. useFileUpload
4. useFileOperations

### Phase 4: Refactor Main Component
- Reduce to orchestration logic only
- Use extracted components and hooks
- Target: ~200-300 lines

## Benefits
- Better maintainability
- Easier testing
- Reusable components
- Clear separation of concerns
- Improved performance (code splitting)

