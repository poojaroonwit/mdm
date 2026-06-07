import { z } from 'zod'
import { PlatformSchema } from './base'

// Export Schema (For Page Builder Export)
// ============================================================================

/**
 * Export options
 */
export const ExportOptionsSchema = z.object({
  /**
   * Format: full app or single page
   */
  format: z.enum(['full', 'page', 'component']),
  
  /**
   * Include all pages or specific page IDs
   */
  pageIds: z.array(z.string()).optional(),
  
  /**
   * Include data bindings
   */
  includeDataBindings: z.boolean().optional(),
  
  /**
   * Include navigation
   */
  includeNavigation: z.boolean().optional(),
  
  /**
   * Include theme
   */
  includeTheme: z.boolean().optional(),
  
  /**
   * Minify output
   */
  minify: z.boolean().optional(),
  
  /**
   * Target platform (for platform-specific optimizations)
   */
  targetPlatform: PlatformSchema.optional(),
})

export type ExportOptions = z.infer<typeof ExportOptionsSchema>

// ============================================================================