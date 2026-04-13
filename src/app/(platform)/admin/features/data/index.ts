/**
 * Data Management Feature
 * Main export file for the data feature
 */

// Components
export { DatabaseManagement } from './components/DatabaseManagement'
export { DatabaseDataModelMerged } from './components/DatabaseDataModelMerged'
export { DataExportImport } from './components/DataExportImport'
export { DataMasking } from './components/DataMasking'
export { DataModelManagement } from './components/DataModelManagement'
export { SchemaMigrations } from './components/SchemaMigrations'
export { SQLLinting } from './components/SQLLinting'

// Types
export type {
  DatabaseConnection,
  QueryPerformance,
  DatabaseStats,
  TableInfo,
  IndexInfo,
  ExportJob,
  ImportJob,
  DataSchema,
  MaskingRule,
  Migration,
  LintIssue,
  LintResult,
  LintRule,
  DataModel,
  Folder,
} from './types'

// Utils
export {
  getConnectionStatusColor,
  getJobStatusColor,
  formatFileSize,
  formatDatabaseType,
  isConnectionActive,
  filterConnections,
  filterJobsByStatus,
  sortMigrationsByVersion,
  getLintSummary,
  formatTableSize,
  isMigrationApplied,
  canRollbackMigration,
} from './utils'

