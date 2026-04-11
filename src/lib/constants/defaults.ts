/**
 * Default Configurations
 * Centralized default values used across the application
 */

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const

/**
 * Default date formats
 */
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  DATETIME: 'MMM dd, yyyy HH:mm',
  DATETIME_FULL: 'MMM dd, yyyy HH:mm:ss',
  TIME: 'HH:mm:ss',
  TIME_SHORT: 'HH:mm',
} as const

/**
 * Default file upload settings
 */
export const DEFAULT_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'application/pdf', 'text/*'],
  chunkSize: 1024 * 1024, // 1MB chunks
} as const

/**
 * Default timeout values (in milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  FILE_UPLOAD: 300000, // 5 minutes
  DATABASE_QUERY: 30000, // 30 seconds
  WEBSOCKET: 60000, // 1 minute
} as const

/**
 * Default retry settings
 */
export const DEFAULT_RETRY = {
  maxAttempts: 3,
  delay: 1000, // 1 second
  backoffMultiplier: 2,
} as const

/**
 * Default cache settings
 */
export const DEFAULT_CACHE = {
  ttl: 3600, // 1 hour in seconds
  maxSize: 100, // Max items
} as const

/**
 * Default session settings
 */
export const DEFAULT_SESSION = {
  timeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
} as const

/**
 * Default UI settings
 */
export const DEFAULT_UI = {
  theme: 'light',
  primaryColor: '#1e40af',
  secondaryColor: '#64748b',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
} as const

/**
 * Default validation settings
 */
export const DEFAULT_VALIDATION = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  minUsernameLength: 3,
  maxUsernameLength: 50,
  maxEmailLength: 255,
} as const

