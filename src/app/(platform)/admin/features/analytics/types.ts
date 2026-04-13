/**
 * Analytics Feature Types
 * Centralized type definitions for the analytics feature
 */

export interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalSpaces: number
  totalAttachments: number
  storageUsed: number
  storageLimit: number
  queriesToday: number
  errorsToday: number
  responseTime: number
  uptime: number
  timestamp?: Date
  cpu?: number
  memory?: number
  disk?: number
  network?: number
  loadAverage?: number
}

export interface ActivityData {
  date: string
  users: number
  queries: number
  uploads: number
  errors: number
}

export interface StorageData {
  provider: string
  used: number
  limit: number
  percentage: number
  usage?: number
  files?: number
  color?: string
  [key: string]: any // Index signature for Recharts compatibility
}

export interface HealthStatus {
  service: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  uptime: number
  responseTime: number
  lastCheck: Date
  errorRate: number
  dependencies: string[]
}

export interface PerformanceMetric {
  timestamp: Date
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkIn: number
  networkOut: number
  responseTime: number
  requestsPerSecond: number
  errorRate: number
  activeConnections: number
}

export interface DatabaseMetric {
  timestamp: Date
  queryTime: number
  connections: number
  slowQueries: number
  cacheHitRate: number
  deadlocks: number
  locks: number
}

export interface Alert {
  id: string
  name: string
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  isActive: boolean
  lastTriggered?: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  description?: string
}

export interface PerformanceSettings {
  monitoring: {
    enabled: boolean
    interval: number
    retention: number
  }
  alerts: {
    enabled: boolean
    email: string[]
    webhook?: string
  }
  thresholds: {
    cpu: number
    memory: number
    disk: number
    responseTime: number
    errorRate: number
  }
}

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  service: string
  message: string
  context: Record<string, any>
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  duration?: number
  tags: string[]
}

export interface LogStats {
  total: number
  byLevel: Record<string, number>
  byService: Record<string, number>
  byHour: Array<{ hour: string; count: number }>
  errorRate: number
  avgResponseTime: number
}

export interface LogFilter {
  search: string
  level: string
  service: string
  dateRange: string
  tags: string[]
  userId?: string
}

export interface LogRetention {
  id: string
  service: string
  level: string
  retentionDays: number
  enabled: boolean
}

