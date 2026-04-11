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

  // MinIO
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32).optional(),

  // Vault
  USE_VAULT: z.string().transform((val) => val === 'true').optional(),
  VAULT_ADDR: z.string().url().optional(),
  VAULT_TOKEN: z.string().optional(),

  // Application
})

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env)
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

