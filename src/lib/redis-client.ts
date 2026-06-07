/**
 * Redis client with fallback to in-memory store
 * Supports both Redis and in-memory storage for development/production flexibility
 */

import { IS_BUILD_TIME, checkBuildTimeAtRuntime } from './redis-client/build-time'

let redisClient: any = null
let redisAvailable = false

// In-memory fallback store with size limits and cleanup
interface MemoryEntry {
  value: any
  expiresAt?: number
  lastAccessed: number
}

const memoryStore = new Map<string, MemoryEntry>()

// Configuration for in-memory store (reduced limits to prevent memory bloat)
const MEMORY_STORE_CONFIG = {
  maxSize: 2000, // Maximum number of entries (reduced from 10000)
  cleanupInterval: 60000, // Clean up expired entries every 60 seconds
  maxAge: 1800000, // Maximum age for entries without TTL (30 minutes, reduced from 1 hour)
}

// Track last cleanup time
let lastCleanup = Date.now()
let cleanupTimer: NodeJS.Timeout | null = null

/**
 * Clean up expired entries and enforce size limits
 */
function cleanupMemoryStore(): void {
  if (IS_BUILD_TIME) return
  
  const now = Date.now()
  let cleaned = 0
  let removed = 0

  // Remove expired entries
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt && now > entry.expiresAt) {
      memoryStore.delete(key)
      cleaned++
    } else if (!entry.expiresAt && (now - entry.lastAccessed) > MEMORY_STORE_CONFIG.maxAge) {
      // Remove entries without TTL that are older than maxAge
      memoryStore.delete(key)
      cleaned++
    }
  }

  // If still over limit, remove least recently accessed entries (LRU eviction)
  if (memoryStore.size > MEMORY_STORE_CONFIG.maxSize) {
    const entries = Array.from(memoryStore.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    const toRemove = memoryStore.size - MEMORY_STORE_CONFIG.maxSize
    for (let i = 0; i < toRemove; i++) {
      memoryStore.delete(entries[i][0])
      removed++
    }
  }

  if (cleaned > 0 || removed > 0) {
    console.log(`[MemoryStore] Cleaned ${cleaned} expired entries, evicted ${removed} LRU entries. Current size: ${memoryStore.size}`)
  }

  lastCleanup = now
}

/**
 * Start periodic cleanup if not already running
 */
function startCleanupTimer(): void {
  if (IS_BUILD_TIME || cleanupTimer) return
  
  cleanupTimer = setInterval(() => {
    cleanupMemoryStore()
  }, MEMORY_STORE_CONFIG.cleanupInterval)
  
  // Clean up on process exit
  if (typeof process !== 'undefined') {
    process.on('exit', () => {
      if (cleanupTimer) {
        clearInterval(cleanupTimer)
      }
    })
  }
}

// Start cleanup timer when module loads (if not in build mode)
if (!IS_BUILD_TIME && typeof process !== 'undefined') {
  startCleanupTimer()
  // Initial cleanup after a short delay
  setTimeout(cleanupMemoryStore, 5000)
}

/**
 * Initialize Redis client if available
 */
export async function initRedis(): Promise<void> {
  // CRITICAL: Skip Redis initialization during build time
  // Check at the very beginning and return immediately
  if (IS_BUILD_TIME) {
    redisAvailable = false
    redisClient = null
    return
  }
  
  try {
    // Double-check before any async operations
    if (IS_BUILD_TIME) {
      redisAvailable = false
      redisClient = null
      return
    }
    
    // Only try to use Redis if REDIS_URL is configured
    if (process.env.REDIS_URL) {
      // Triple-check before importing ioredis (which might trigger connections)
      if (IS_BUILD_TIME) {
        redisAvailable = false
        redisClient = null
        return
      }
      
      const redis = await import('ioredis')
      
      // Final check before creating client instance
      if (IS_BUILD_TIME) {
        redisAvailable = false
        redisClient = null
        return
      }
      
      // Create client with all error suppression enabled
      redisClient = new redis.default(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            // Check build time at execution time using shared helper function
            const isBuildNow = checkBuildTimeAtRuntime()
            
            // Only log if definitely not in build - completely silent during build
            if (!isBuildNow) {
              console.warn('[Redis] Max retries reached, falling back to in-memory store')
            }
            redisAvailable = false
            return null
          }
          return Math.min(times * 50, 2000)
        },
        // Disable automatic reconnection during build
        enableReadyCheck: !IS_BUILD_TIME,
        lazyConnect: true, // Don't connect immediately
        // Additional options to prevent connection attempts
        connectTimeout: IS_BUILD_TIME ? 0 : 10000,
        enableOfflineQueue: !IS_BUILD_TIME,
      })

      // ALWAYS set up a silent error handler during build, or conditional during runtime
      // Use a function that checks build time at execution time, not definition time
      redisClient.on('error', (err: Error) => {
        // Check build time at error time using shared helper function
        const isBuildNow = checkBuildTimeAtRuntime()
        
        // Only log if definitely not in build - completely silent during build
        if (!isBuildNow) {
          console.warn('[Redis] Error:', err.message || err.toString())
        }
        redisAvailable = false
      })

      // Only set up connect handler if not in build time
      if (!IS_BUILD_TIME) {
        redisClient.on('connect', () => {
          console.log('[Redis] Connected successfully')
          redisAvailable = true
        })
      }

      // Only test connection if not in build time
      if (!IS_BUILD_TIME) {
        try {
          await redisClient.connect()
          await redisClient.ping()
          redisAvailable = true
        } catch (connectError) {
          // Suppress connection errors during build
          if (!IS_BUILD_TIME) {
            console.warn('[Redis] Connection test failed:', connectError)
          }
          redisAvailable = false
        }
      } else {
        // During build, don't attempt connection at all
        redisAvailable = false
        // Close any connection attempts immediately
        if (redisClient && typeof redisClient.disconnect === 'function') {
          try {
            redisClient.disconnect()
          } catch {
            // Ignore disconnect errors
          }
        }
      }
    } else {
      // Suppress message during build time
      if (!IS_BUILD_TIME) {
        console.log('[Redis] REDIS_URL not configured, using in-memory store')
      }
      redisAvailable = false
    }
  } catch (error) {
    // Check build time at error time using shared helper function
    const isBuildNow = checkBuildTimeAtRuntime()
    
    // Only log if definitely not in build - completely silent during build
    if (!isBuildNow) {
      console.warn('[Redis] Failed to initialize, using in-memory store:', error)
    }
    redisAvailable = false
    // Ensure client is null during build
    if (isBuildNow) {
      redisClient = null
    }
  }
}

/**
 * Get value from Redis or memory store
 */
export async function get(key: string): Promise<string | null> {
  if (redisAvailable && redisClient) {
    try {
      return await redisClient.get(key)
    } catch (error) {
      console.warn('[Redis] Get failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const entry = memoryStore.get(key)
  if (!entry) return null

  const now = Date.now()
  
  // Check expiration
  if (entry.expiresAt && now > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }

  // Update last accessed time
  entry.lastAccessed = now

  return typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value)
}

/**
 * Set value in Redis or memory store
 */
export async function set(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, value)
      } else {
        await redisClient.set(key, value)
      }
      return
    } catch (error) {
      console.warn('[Redis] Set failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const now = Date.now()
  const expiresAt = ttlSeconds ? now + (ttlSeconds * 1000) : undefined
  
  // Check if we need to evict entries before adding
  if (memoryStore.size >= MEMORY_STORE_CONFIG.maxSize && !memoryStore.has(key)) {
    // Evict least recently used entry
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    for (const [k, entry] of memoryStore.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = k
      }
    }
    
    if (oldestKey) {
      memoryStore.delete(oldestKey)
    }
  }
  
  memoryStore.set(key, { value, expiresAt, lastAccessed: now })
}

/**
 * Delete key from Redis or memory store
 */
export async function del(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key)
      return
    } catch (error) {
      console.warn('[Redis] Del failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  memoryStore.delete(key)
}

/**
 * Delete keys matching pattern
 */
export async function delPattern(pattern: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      return new Promise((resolve, reject) => {
        const stream = redisClient.scanStream({ match: pattern })
        const pipeline = redisClient.pipeline()
        let keysCount = 0

        stream.on('data', (keys: string[]) => {
          keys.forEach((key) => {
            pipeline.del(key)
            keysCount++
          })
        })

        stream.on('end', async () => {
          if (keysCount > 0) {
            await pipeline.exec()
          }
          resolve()
        })

        stream.on('error', (err: Error) => {
          reject(err)
        })
      })
    } catch (error) {
      console.warn('[Redis] DelPattern failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  // Memory fallback - simple prefix matching
  const prefix = pattern.replace('*', '')
  for (const [key] of memoryStore.entries()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Flush all data from Redis or memory store
 */
export async function flushAll(): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.flushall()
      return
    } catch (error) {
      console.warn('[Redis] FlushAll failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  memoryStore.clear()
}

/**
 * Increment value
 */
export async function incr(key: string): Promise<number> {
  if (redisAvailable && redisClient) {
    try {
      return await redisClient.incr(key)
    } catch (error) {
      console.warn('[Redis] Incr failed, falling back to memory:', error)
      redisAvailable = false
    }
  }

  const now = Date.now()
  const entry = memoryStore.get(key)
  const current = entry ? (typeof entry.value === 'number' ? entry.value : parseInt(entry.value) || 0) : 0
  const newValue = current + 1
  
  // Check if we need to evict entries before adding
  if (memoryStore.size >= MEMORY_STORE_CONFIG.maxSize && !memoryStore.has(key)) {
    // Evict least recently used entry
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    for (const [k, entry] of memoryStore.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = k
      }
    }
    
    if (oldestKey) {
      memoryStore.delete(oldestKey)
    }
  }
  
  memoryStore.set(key, { value: newValue, lastAccessed: now })
  return newValue
}

/**
 * Set expiration on a key (in seconds)
 */
export async function expire(key: string, seconds: number): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.expire(key, seconds)
      return
    } catch (error) {
      console.warn('[Redis] Expire failed:', error)
    }
  }
  // For memory store, expiration is handled by expiresAt field
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable
}

