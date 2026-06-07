import { z } from 'zod'
import { ColorSchema } from './base'
import { ActionSchema } from './action'
import { ComponentSchema } from './component'
import { DataBindingSchema } from './data-binding'
import { StyleSchema } from './style'

// Page Schema
// ============================================================================

/**
 * Page configuration
 */
export const PageSchema = z.object({
  /**
   * Unique page identifier
   */
  id: z.string(),
  
  /**
   * Page name/slug for routing
   */
  name: z.string(),
  
  /**
   * Display title
   */
  title: z.string(),
  
  /**
   * Page description
   */
  description: z.string().optional(),
  
  /**
   * Route path (e.g., "/users/:id")
   */
  path: z.string(),
  
  /**
   * Page icon
   */
  icon: z.string().optional(),
  
  /**
   * Page components (the actual UI tree)
   */
  components: z.array(ComponentSchema),
  
  /**
   * Page-level data bindings
   */
  dataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * Page-level styles
   */
  style: StyleSchema.optional(),
  
  /**
   * Background configuration
   */
  background: z.object({
    type: z.enum(['color', 'image', 'gradient']),
    color: ColorSchema.optional(),
    image: z.string().optional(),
    gradient: z.object({
      colors: z.array(ColorSchema),
      angle: z.number(),
    }).optional(),
  }).optional(),
  
  /**
   * Header configuration
   */
  header: z.object({
    visible: z.boolean(),
    title: z.string().optional(),
    showBackButton: z.boolean().optional(),
    rightActions: z.array(z.object({
      icon: z.string(),
      action: ActionSchema,
    })).optional(),
    style: StyleSchema.optional(),
  }).optional(),
  
  /**
   * Pull-to-refresh configuration
   */
  refreshable: z.boolean().optional(),
  
  /**
   * Page transition animation
   */
  transition: z.enum(['slide', 'fade', 'none', 'modal']).optional(),
  
  /**
   * Authentication required
   */
  requiresAuth: z.boolean().optional(),
  
  /**
   * Required roles/permissions
   */
  permissions: z.array(z.string()).optional(),
  
  /**
   * SEO metadata (for web)
   */
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
  
  /**
   * Created timestamp
   */
  createdAt: z.string(),
  
  /**
   * Last updated timestamp
   */
  updatedAt: z.string(),
  
  /**
   * Version number
   */
  version: z.number().optional(),
})

export type Page = z.infer<typeof PageSchema>

// ============================================================================