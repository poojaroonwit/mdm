import { z } from 'zod'
import { ColorSchema } from './base'
import { DataBindingSchema } from './data-binding'
import { NavigationSchema } from './navigation'
import { PageSchema } from './page'

// App Schema (Complete Mobile App Configuration)
// ============================================================================

/**
 * Theme configuration
 */
export const ThemeConfigSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']),
  colors: z.object({
    primary: ColorSchema,
    secondary: ColorSchema,
    background: ColorSchema,
    surface: ColorSchema,
    text: ColorSchema,
    textSecondary: ColorSchema,
    border: ColorSchema,
    error: ColorSchema,
    warning: ColorSchema,
    success: ColorSchema,
    info: ColorSchema,
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontFamilyMono: z.string().optional(),
    baseFontSize: z.number(),
    headingScale: z.number(),
  }).optional(),
  spacing: z.object({
    base: z.number(),
    scale: z.number(),
  }).optional(),
  borderRadius: z.object({
    small: z.number(),
    medium: z.number(),
    large: z.number(),
    full: z.number(),
  }).optional(),
})

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>

/**
 * Complete mobile app schema
 * This is what mobile apps receive from the API
 */
export const MobileAppSchema = z.object({
  /**
   * Schema version for compatibility checking
   */
  schemaVersion: z.string(),
  
  /**
   * App identifier
   */
  appId: z.string(),
  
  /**
   * App display name
   */
  name: z.string(),
  
  /**
   * App description
   */
  description: z.string().optional(),
  
  /**
   * App version
   */
  version: z.string(),
  
  /**
   * Build number
   */
  buildNumber: z.number().optional(),
  
  /**
   * Organization/tenant ID
   */
  organizationId: z.string().optional(),
  
  /**
   * Space ID (for multi-tenant)
   */
  spaceId: z.string().optional(),
  
  /**
   * Theme configuration
   */
  theme: z.object({
    light: ThemeConfigSchema,
    dark: ThemeConfigSchema.optional(),
  }),
  
  /**
   * Navigation configuration
   */
  navigation: NavigationSchema,
  
  /**
   * All pages
   */
  pages: z.array(PageSchema),
  
  /**
   * Global data bindings (available to all pages)
   */
  globalDataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * API configuration
   */
  api: z.object({
    baseUrl: z.string(),
    headers: z.record(z.string(), z.string()).optional(),
    timeout: z.number().optional(),
    retryCount: z.number().optional(),
  }),
  
  /**
   * Authentication configuration
   */
  auth: z.object({
    type: z.enum(['jwt', 'oauth2', 'apiKey', 'none']),
    loginEndpoint: z.string().optional(),
    refreshEndpoint: z.string().optional(),
    logoutEndpoint: z.string().optional(),
    tokenStorage: z.enum(['secure', 'memory']).optional(),
  }).optional(),
  
  /**
   * Feature flags
   */
  features: z.record(z.string(), z.boolean()).optional(),
  
  /**
   * Localization
   */
  localization: z.object({
    defaultLocale: z.string(),
    supportedLocales: z.array(z.string()),
    stringsUrl: z.string().optional(),
  }).optional(),
  
  /**
   * Analytics configuration
   */
  analytics: z.object({
    enabled: z.boolean(),
    providers: z.array(z.object({
      name: z.string(),
      config: z.record(z.string(), z.any()),
    })),
  }).optional(),
  
  /**
   * Offline support configuration
   */
  offline: z.object({
    enabled: z.boolean(),
    syncInterval: z.number().optional(),
    cachePages: z.array(z.string()).optional(),
  }).optional(),
  
  /**
   * Assets manifest
   */
  assets: z.object({
    images: z.record(z.string(), z.string()).optional(),
    icons: z.record(z.string(), z.string()).optional(),
    fonts: z.array(z.object({
      family: z.string(),
      url: z.string(),
      weight: z.string().optional(),
      style: z.string().optional(),
    })).optional(),
  }).optional(),
  
  /**
   * Last updated timestamp
   */
  updatedAt: z.string(),
  
  /**
   * Content hash for cache invalidation
   */
  contentHash: z.string().optional(),
})

export type MobileApp = z.infer<typeof MobileAppSchema>

// ============================================================================