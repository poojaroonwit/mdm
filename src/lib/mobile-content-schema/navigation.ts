import { z } from 'zod'
import { ColorSchema } from './base'

// Navigation Schema
// ============================================================================

/**
 * Navigation item
 */
export interface NavigationItem {
  id: string
  type: 'page' | 'link' | 'divider' | 'group'
  label?: string
  icon?: string
  pageId?: string
  url?: string
  children?: NavigationItem[]
  badge?: {
    text: string
    color: string
  }
  condition?: string
}

export const NavigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() => z.object({
  id: z.string(),
  type: z.enum(['page', 'link', 'divider', 'group']),
  label: z.string().optional(),
  icon: z.string().optional(),
  pageId: z.string().optional(),
  url: z.string().optional(),
  children: z.array(NavigationItemSchema).optional(),
  badge: z.object({
    text: z.string(),
    color: ColorSchema,
  }).optional(),
  condition: z.string().optional(),
}))

/**
 * Navigation configuration
 */
export const NavigationSchema = z.object({
  /**
   * Bottom tab bar items
   */
  bottomTabs: z.array(NavigationItemSchema).optional(),
  
  /**
   * Drawer/sidebar items
   */
  drawer: z.array(NavigationItemSchema).optional(),
  
  /**
   * Initial/default page
   */
  initialPage: z.string(),
  
  /**
   * Login page ID
   */
  loginPage: z.string().optional(),
  
  /**
   * Deep link configuration
   */
  deepLinks: z.array(z.object({
    pattern: z.string(),
    pageId: z.string(),
    params: z.record(z.string(), z.string()).optional(),
  })).optional(),
})

export type Navigation = z.infer<typeof NavigationSchema>

// ============================================================================