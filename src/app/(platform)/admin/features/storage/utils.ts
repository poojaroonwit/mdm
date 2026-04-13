/**
 * Storage Feature Utilities
 * Helper functions for storage operations
 */

import { Bucket, StorageFile, CacheInstance, Backup, BackupSchedule } from './types'
import { formatFileSize } from '@/lib/formatters'
import { getConnectionStatusColor, getJobStatusColor } from '@/lib/status-colors'
import { filterBySearch, filterByValue, sortBy } from '@/lib/filter-utils'

/**
 * Check if file is an image
 */
export function isImageFile(file: StorageFile): boolean {
  return file.mimeType?.startsWith('image/') || false
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: StorageFile): boolean {
  return file.mimeType?.startsWith('video/') || false
}

/**
 * Get cache instance status color
 * Uses shared status color utility
 */
export function getCacheStatusColor(status: CacheInstance['status']): string {
  return getConnectionStatusColor(status as 'connected' | 'disconnected' | 'error')
}

/**
 * Calculate cache hit rate percentage
 */
export function calculateCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses
  if (total === 0) return 0
  return Math.round((hits / total) * 100)
}

/**
 * Get backup status color
 * Uses shared status color utility
 */
export function getBackupStatusColor(status: Backup['status']): string {
  // Map 'scheduled' to 'pending' for job status colors
  const jobStatus = status === 'scheduled' ? 'pending' : status
  return getJobStatusColor(jobStatus as 'completed' | 'running' | 'failed' | 'pending')
}

/**
 * Filter files by search query
 * Uses shared filter utility
 */
export function filterFiles(files: StorageFile[], query: string): StorageFile[] {
  return filterBySearch(files, query, ['name', 'mimeType'])
}

/**
 * Filter files by type
 * Uses shared filter utility
 */
export function filterFilesByType(files: StorageFile[], type: 'file' | 'folder' | 'all'): StorageFile[] {
  return filterByValue(files, 'type', type as any)
}

/**
 * Sort files by name, size, or date
 * Uses shared sort utility
 */
export function sortFiles(
  files: StorageFile[],
  sortByField: 'name' | 'size' | 'date',
  order: 'asc' | 'desc' = 'asc'
): StorageFile[] {
  switch (sortByField) {
    case 'name':
      return sortBy(files, 'name', order)
    case 'size':
      return sortBy(files, 'size', order)
    case 'date':
      return sortBy(files, item => new Date(item.updatedAt), order)
    default:
      return files
  }
}

/**
 * Calculate bucket total size
 */
export function calculateBucketSize(bucket: Bucket): string {
  return formatFileSize(bucket.totalSize)
}

/**
 * Check if backup is scheduled
 */
export function isBackupScheduled(backup: Backup): boolean {
  return backup.status === 'scheduled'
}

/**
 * Check if backup is running
 */
export function isBackupRunning(backup: Backup): boolean {
  return backup.status === 'running'
}

/**
 * Check if backup is completed
 */
export function isBackupCompleted(backup: Backup): boolean {
  return backup.status === 'completed'
}

/**
 * Check if schedule is active
 */
export function isScheduleActive(schedule: BackupSchedule): boolean {
  return schedule.isActive === true
}

/**
 * Format backup type display name
 */
export function formatBackupType(type: Backup['type']): string {
  const typeMap: Record<Backup['type'], string> = {
    full: 'Full Backup',
    incremental: 'Incremental',
    differential: 'Differential',
  }
  return typeMap[type] || type
}

/**
 * Format schedule frequency display name
 */
export function formatScheduleFrequency(frequency: BackupSchedule['frequency']): string {
  const freqMap: Record<BackupSchedule['frequency'], string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  }
  return freqMap[frequency] || frequency
}

