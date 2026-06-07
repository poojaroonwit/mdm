import { z } from 'zod'

// Base Types
// ============================================================================

/**
 * Supported platforms for conditional rendering
 */
export const PlatformSchema = z.enum(['ios', 'android', 'web', 'all'])
export type Platform = z.infer<typeof PlatformSchema>

/**
 * Responsive breakpoints
 */
export const BreakpointSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl'])
export type Breakpoint = z.infer<typeof BreakpointSchema>

/**
 * Color value - supports hex, rgb, rgba, and semantic colors
 */
export const ColorSchema = z.string()

/**
 * Dimension value - supports px, %, rem, or numeric values
 */
export const DimensionSchema = z.union([z.string(), z.number()])

// ============================================================================