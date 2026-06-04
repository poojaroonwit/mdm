/**
 * Environment Variable Validation
 * Validates and provides type-safe access to environment variables
 */

import { z } from 'zod'

// Define environment variable schema
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // PostgREST
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // S3-compatible storage
  S3_ENDPOINT: z.string().optional(),
  S3_ENDPOINT_URL: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_DEFAULT_REGION: z.string().optional(),
  AWS_S3_FORCE_PATH_STYLE: z.string().optional(),
  RAILWAY_S3_ENDPOINT: z.string().optional(),
  RAILWAY_BUCKET_ENDPOINT: z.string().optional(),
  RAILWAY_S3_ACCESS_KEY_ID: z.string().optional(),
  RAILWAY_S3_ACCESS_KEY: z.string().optional(),
  RAILWAY_S3_SECRET_ACCESS_KEY: z.string().optional(),
  RAILWAY_S3_SECRET_KEY: z.string().optional(),
  RAILWAY_S3_BUCKET: z.string().optional(),
  RAILWAY_BUCKET_NAME: z.string().optional(),
  RAILWAY_S3_REGION: z.string().optional(),
  RAILWAY_S3_FORCE_PATH_STYLE: z.string().optional(),

  // Legacy MinIO aliases
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_REGION: z.string().optional(),
  MINIO_UPLOADS_BUCKET: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  MINIO_FORCE_PATH_STYLE: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Vault
  USE_VAULT: z.string().transform((val) => val === 'true').optional(),
  VAULT_ADDR: z.string().optional(),
  VAULT_TOKEN: z.string().optional(),

  // Application
})

function normalizeOptionalUrl(value: string | undefined, shouldValidate: boolean) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return shouldValidate ? trimmed : undefined
}

// Validate environment variables
function validateEnv() {
  try {
    const parsedEnv = envSchema.parse({
      ...process.env,
      VAULT_ADDR: normalizeOptionalUrl(
        process.env.VAULT_ADDR,
        process.env.USE_VAULT === 'true'
      ),
    })

    if (parsedEnv.USE_VAULT) {
      if (!parsedEnv.VAULT_ADDR) {
        throw new Error('VAULT_ADDR is required when USE_VAULT=true')
      }

      try {
        new URL(parsedEnv.VAULT_ADDR)
      } catch {
        throw new Error('VAULT_ADDR must be a valid URL when USE_VAULT=true')
      }
    }

    return parsedEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      // Use console.error here to avoid circular dependency with logger
      console.error('Environment validation failed:', error, { missingVars })
      throw new Error(
        `Invalid environment variables:\n${missingVars.join('\n')}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.'
      )
    }
    throw error
  }
}

// Validate on module load (only in production or when explicitly enabled)
let validatedEnv: z.infer<typeof envSchema>
// Skip validation during Docker builds (DOCKER_BUILD=true)
if (process.env.VALIDATE_ENV !== 'false' && process.env.DOCKER_BUILD !== 'true') {
  try {
    validatedEnv = validateEnv()
    // Use console.log here to avoid circular dependency with logger
    if (process.env.NODE_ENV !== 'production') {
      console.log('Environment variables validated successfully')
    }
  } catch (error) {
    // In development, warn but don't crash - use process.env directly
    if (process.env.NODE_ENV === 'development') {
      // Use console.warn here to avoid circular dependency with logger
      console.warn('Environment validation failed in development:', error)
      validatedEnv = process.env as any
    } else {
      // In production, crash early
      throw error
    }
  }
} else {
  validatedEnv = process.env as any
}

// Export validated environment with type safety
export const env = validatedEnv

// Helper functions for common environment checks
export const isDevelopment = () => env.NODE_ENV === 'development'
export const isProduction = () => env.NODE_ENV === 'production'
export const isTest = () => env.NODE_ENV === 'test'

// Helper to get environment variable with fallback
export function getEnv(key: keyof typeof env, fallback?: string): string {
  const value = env[key]
  if (value === undefined || value === null) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return String(value)
}

