/**
 * Business Intelligence Feature Types
 * Centralized type definitions for the business intelligence feature
 */

export interface Dashboard {
  id: string
  name: string
  description: string
  spaceId: string
  spaceName: string
  isPublic: boolean
  widgets: DashboardWidget[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'text' | 'image'
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: any
  dataSource: string
  filters: FilterConfig[]
}

export interface FilterConfig {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between'
  value: any
}

export interface Report {
  id: string
  name: string
  description: string
  spaceId: string
  spaceName: string
  type: 'scheduled' | 'on_demand'
  schedule?: string
  format: 'pdf' | 'excel' | 'csv' | 'json'
  recipients: string[]
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
  createdAt: Date
  createdBy: string
}

export interface DataSource {
  id: string
  name: string
  type: 'database' | 'api' | 'file' | 'space_data'
  connection: string
  spaceId?: string
  tables?: string[]
  isActive: boolean
}

export interface ChartTemplate {
  id: string
  name: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  description: string
  icon: string
  config: any
}

export interface KernelServer {
  id: string
  name: string
  host: string
  port: number
  protocol: 'http' | 'https' | 'ws' | 'wss'
  status: 'online' | 'offline' | 'error' | 'starting' | 'stopping'
  language: string
  version: string
  description?: string
  maxConnections: number
  currentConnections: number
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  authentication: {
    type: 'none' | 'basic' | 'token' | 'oauth'
    username?: string
    password?: string
    token?: string
    clientId?: string
    clientSecret?: string
  }
  environment: {
    python?: string
    r?: string
    node?: string
    java?: string
    julia?: string
  }
  packages: string[]
  capabilities: string[]
  healthCheck: {
    enabled: boolean
    interval: number
    timeout: number
    endpoint: string
  }
  logs: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
    maxSize: number
    retention: number
  }
}

export interface KernelTemplate {
  id: string
  name: string
  language: string
  description: string
  dockerImage: string
  requirements: string[]
  environment: Record<string, string>
  startupScript: string
  healthCheck: string
  documentation: string
}

