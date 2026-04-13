/**
 * Storage Feature
 * Main export file for the storage feature
 */

// Components
export { StorageManagement } from './components/StorageManagement'
export { CacheManagement } from './components/CacheManagement'
export { BackupRecovery } from './components/BackupRecovery'
// FileSystemManagement removed - was unused duplicate of StorageManagement

// Types
export type {
  Bucket,
  StorageFile,
  CacheInstance,
  CacheKey,
  CacheStats,
  CacheConfig,
  Backup,
  BackupSchedule,
  RestorePoint,
} from './types'

// Utils
export {
  isImageFile,
  isVideoFile,
  getCacheStatusColor,
  calculateCacheHitRate,
  getBackupStatusColor,
  filterFiles,
  filterFilesByType,
  sortFiles,
  calculateBucketSize,
  isBackupScheduled,
  isBackupRunning,
  isBackupCompleted,
  isScheduleActive,
  formatBackupType,
  formatScheduleFrequency,
} from './utils'

// Re-export shared utilities (import directly from @/lib instead)
// formatFileSize: use from '@/lib/formatters'
// getFileIcon: use from '@/lib/file-utils'

