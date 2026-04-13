/**
 * Storage Feature Types
 * Centralized type definitions for the storage feature
 */

export interface Bucket {
  id: string
  name: string
  public: boolean
  fileCount: number
  totalSize: number
  created: Date
  spaceId?: string
  spaceName?: string
  storageName?: string // Added for UI display
}

export interface StorageFile {
  id: string
  name: string
  size: number
  mimeType: string
  updatedAt: Date
  createdAt: Date
  publicUrl?: string
  bucketId: string
  bucketName: string
  path?: string
  uploadedBy?: string
  uploadedByName?: string
  type?: 'file' | 'folder'
}

export interface CacheInstance {
  id: string
  name: string
  type: 'redis' | 'memcached' | 'memory' | 'file'
  host: string
  port: number
  isActive: boolean
  status: 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  memory: {
    used: number
    total: number
    peak: number
  }
  stats: {
    hits: number
    misses: number
    evictions: number
    expired: number
    keys: number
  }
}

export interface CacheKey {
  key: string
  type: string
  size: number
  ttl?: number
  lastAccessed?: Date
  hitCount: number
  isExpired: boolean
}

export interface CacheStats {
  totalKeys: number
  memoryUsage: number
  hitRate: number
  missRate: number
  evictionRate: number
  avgResponseTime: number
  connections: number
  commandsPerSecond: number
}

export interface CacheConfig {
  maxMemory: string
  evictionPolicy: string
  ttl: number
  compression: boolean
  persistence: boolean
  clustering: boolean
}

export interface Backup {
  id: string
  name: string
  type: 'full' | 'incremental' | 'differential'
  status: 'completed' | 'running' | 'failed' | 'scheduled'
  size: number
  createdAt: Date
  completedAt?: Date
  description?: string
  includes: string[]
  storageLocation: string
  retentionDays: number
  isEncrypted: boolean
  checksum: string
}

export interface BackupSchedule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  type: 'full' | 'incremental'
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
  retentionDays: number
  includeAttachments: boolean
  includeDatabase: boolean
  includeSettings: boolean
}

export interface RestorePoint {
  id: string
  name: string
  timestamp: Date
  size: number
  type: 'manual' | 'scheduled' | 'automatic'
  description?: string
}

