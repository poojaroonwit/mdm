/**
 * Data Management Feature Types
 * Centralized type definitions for the data feature
 */

export interface DatabaseConnection {
  id: string
  name: string
  spaceId: string
  spaceName: string
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis'
  host: string
  port: number
  database: string
  username: string
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  connectionPool: {
    min: number
    max: number
    current: number
    idle: number
  }
  dataModels: Array<{
    id: string
    name: string
    description?: string
    tableName: string
  }>
}

export interface QueryPerformance {
  id: string
  query: string
  executionTime: number
  rowsAffected: number
  timestamp: Date
  userId?: string
  isSlow: boolean
  explainPlan?: string
}

export interface DatabaseStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  slowQueries: number
  avgQueryTime: number
  cacheHitRate: number
  databaseSize: number
  tableCount: number
  indexCount: number
}

export interface TableInfo {
  name: string
  rows: number
  size: number
  indexes: number
  lastAnalyzed?: Date
  isPartitioned: boolean
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    defaultValue?: string
    isPrimaryKey: boolean
    isForeignKey: boolean
  }>
}

export interface IndexInfo {
  name: string
  table: string
  columns: string[]
  type: string
  size: number
  usage: number
  isUnique: boolean
  isPrimary: boolean
}

export interface ExportJob {
  id: string
  name: string
  type: 'full' | 'incremental' | 'custom'
  format: 'json' | 'csv' | 'xml' | 'sql'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  size?: number
  createdAt: Date
  completedAt?: Date
  downloadUrl?: string
  includes: string[]
  filters?: Record<string, any>
}

export interface ImportJob {
  id: string
  name: string
  file: File
  format: 'json' | 'csv' | 'xml' | 'sql'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  errors?: string[]
  recordsProcessed: number
  recordsTotal: number
}

export interface DataSchema {
  table: string
  columns: string[]
  rowCount: number
  lastModified: Date
}

export interface MaskingRule {
  id: string
  name: string
  tableName: string
  columnName: string
  strategy: string
  enabled: boolean
}

export interface Migration {
  id: string
  version: string
  name: string
  description?: string
  migrationType: string
  upSql?: string
  downSql?: string
  status: 'pending' | 'applied' | 'rolled_back'
  createdAt: string
  appliedAt?: string
}

export interface LintIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
  column?: number
  rule?: string
}

export interface LintResult {
  valid: boolean
  score: number
  issues: LintIssue[]
}

export interface LintRule {
  id: string
  name: string
  description: string
  category: string
  severity: 'error' | 'warning' | 'info'
  enabled: boolean
}

export interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  space_ids?: string[]
  created_at?: string
  updated_at?: string
}

export interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}


export interface ExportProfile {
  id: string
  name: string
  description?: string
  type: 'STUDIO' | 'QUERY'
  config: {
    source?: string
    tableName?: string
    database?: string
    columns?: string[]
    limit?: number
    filters?: Array<{
      column: string
      operator: string
      value: any
    }>
    query?: string
  }
  createdAt: Date
  updatedAt: Date
  spaceId?: string
}
