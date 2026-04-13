/**
 * Data Management Feature Utilities
 * Helper functions for data operations
 */

import { DatabaseConnection, ExportJob, ImportJob, Migration, LintResult, TableInfo } from './types'
import { formatFileSize } from '@/lib/formatters'
import { 
  getConnectionStatusColor as getSharedConnectionStatusColor,
  getJobStatusColor as getSharedJobStatusColor 
} from '@/lib/status-colors'
import { filterBySearch, filterByStatus, sortByVersion } from '@/lib/filter-utils'

// Re-export formatFileSize for convenience
export { formatFileSize }

/**
 * Format database connection status badge color
 * Uses shared status color utility
 */
export function getConnectionStatusColor(status: DatabaseConnection['status']): string {
  return getSharedConnectionStatusColor(status as 'connected' | 'disconnected' | 'error')
}

/**
 * Format export/import job status badge color
 * Uses shared status color utility
 */
export function getJobStatusColor(status: ExportJob['status'] | ImportJob['status']): string {
  return getSharedJobStatusColor(status as 'completed' | 'running' | 'failed' | 'pending')
}

/**
 * Format database type display name
 * Note: This function is kept for backward compatibility.
 * For new code, use getAsset() from @/lib/assets to get localized names.
 */
export function formatDatabaseType(type: DatabaseConnection['type']): string {
  const typeMap: Record<DatabaseConnection['type'], string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    mongodb: 'MongoDB',
    redis: 'Redis',
  }
  return typeMap[type] || type
}

/**
 * Check if database connection is active
 */
export function isConnectionActive(connection: DatabaseConnection): boolean {
  return connection.isActive && connection.status === 'connected'
}

/**
 * Filter database connections by search query
 * Uses shared filter utility
 */
export function filterConnections(connections: DatabaseConnection[], query: string): DatabaseConnection[] {
  return filterBySearch(connections, query, ['name', 'database', 'host', 'type'])
}

/**
 * Filter export/import jobs by status
 * Uses shared filter utility
 */
export function filterJobsByStatus<T extends ExportJob | ImportJob>(
  jobs: T[],
  status: T['status'] | 'all'
): T[] {
  return filterByStatus(jobs, status as any)
}

/**
 * Sort migrations by version
 * Uses shared sort utility
 */
export function sortMigrationsByVersion(migrations: Migration[], order: 'asc' | 'desc' = 'desc'): Migration[] {
  return sortByVersion(migrations, 'version', order)
}

/**
 * Get lint result summary
 */
export function getLintSummary(result: LintResult | null): { errors: number; warnings: number; info: number } {
  if (!result) return { errors: 0, warnings: 0, info: 0 }
  
  return {
    errors: result.issues.filter(i => i.severity === 'error').length,
    warnings: result.issues.filter(i => i.severity === 'warning').length,
    info: result.issues.filter(i => i.severity === 'info').length,
  }
}

/**
 * Format table size in human-readable format
 */
export function formatTableSize(size: number): string {
  return formatFileSize(size)
}

/**
 * Check if migration is applied
 */
export function isMigrationApplied(migration: Migration): boolean {
  return migration.status === 'applied'
}

/**
 * Check if migration can be rolled back
 */
export function canRollbackMigration(migration: Migration): boolean {
  return migration.status === 'applied' && !!migration.downSql
}

