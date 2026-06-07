import { z } from 'zod'
import { PlatformSchema } from './base'
import { ActionSchema } from './action'
import { DataBindingSchema } from './data-binding'
import { ResponsiveStyleSchema, StyleSchema } from './style'

// Component Types
// ============================================================================

/**
 * All supported component types
 */
export const ComponentTypeSchema = z.enum([
  // Layout
  'container',
  'row',
  'column',
  'stack',
  'grid',
  'scrollView',
  'safeArea',
  
  // Basic
  'text',
  'image',
  'icon',
  'button',
  'link',
  'divider',
  'spacer',
  
  // Input
  'textInput',
  'textArea',
  'select',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'datePicker',
  'timePicker',
  'filePicker',
  
  // Data Display
  'list',
  'table',
  'card',
  'badge',
  'avatar',
  'chip',
  'progress',
  'skeleton',
  
  // Navigation
  'tabs',
  'bottomNav',
  'drawer',
  'appBar',
  'breadcrumb',
  
  // Feedback
  'modal',
  'toast',
  'alert',
  'tooltip',
  
  // Charts (for dashboards)
  'lineChart',
  'barChart',
  'pieChart',
  'areaChart',
  
  // Media
  'video',
  'audio',
  'webView',
  'map',
  
  // Custom
  'custom',
])

export type ComponentType = z.infer<typeof ComponentTypeSchema>

// ============================================================================

// Base Component Schema
// ============================================================================

/**
 * Base component properties shared by all components
 */
export const BaseComponentSchema = z.object({
  /**
   * Unique identifier for the component
   */
  id: z.string(),
  
  /**
   * Component type
   */
  type: ComponentTypeSchema,
  
  /**
   * Human-readable name (for debugging/admin)
   */
  name: z.string().optional(),
  
  /**
   * Platform-specific visibility
   */
  platforms: z.array(PlatformSchema).optional(),
  
  /**
   * Condition for rendering (expression string)
   * e.g., "user.role === 'admin'" or "data.items.length > 0"
   */
  condition: z.string().optional(),
  
  /**
   * Style configuration
   */
  style: StyleSchema.optional(),
  
  /**
   * Responsive styles
   */
  responsiveStyle: ResponsiveStyleSchema.optional(),
  
  /**
   * Data bindings
   */
  dataBindings: z.array(DataBindingSchema).optional(),
  
  /**
   * Event handlers
   */
  events: z.object({
    onPress: ActionSchema.optional(),
    onLongPress: ActionSchema.optional(),
    onChange: ActionSchema.optional(),
    onFocus: ActionSchema.optional(),
    onBlur: ActionSchema.optional(),
    onLoad: ActionSchema.optional(),
    onError: ActionSchema.optional(),
    onRefresh: ActionSchema.optional(),
    onEndReached: ActionSchema.optional(),
  }).optional(),
  
  /**
   * Accessibility properties
   */
  accessibility: z.object({
    label: z.string().optional(),
    hint: z.string().optional(),
    role: z.string().optional(),
    hidden: z.boolean().optional(),
  }).optional(),
  
  /**
   * Test ID for automated testing
   */
  testId: z.string().optional(),
  
  /**
   * Child components
   */
  children: z.lazy(() => z.array(ComponentSchema)).optional(),
  
  /**
   * Component-specific properties
   */
  props: z.record(z.string(), z.any()).optional(),
})

export const ComponentSchema: z.ZodType<any> = BaseComponentSchema

export type Component = z.infer<typeof ComponentSchema>

// ============================================================================