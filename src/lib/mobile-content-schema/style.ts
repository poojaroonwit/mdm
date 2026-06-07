import { z } from 'zod'
import { ColorSchema, DimensionSchema } from './base'

// Style Schema
// ============================================================================

/**
 * Platform-agnostic style properties
 * Mobile apps translate these to native styles
 */
export const StyleSchema = z.object({
  // Layout
  width: DimensionSchema.optional(),
  height: DimensionSchema.optional(),
  minWidth: DimensionSchema.optional(),
  maxWidth: DimensionSchema.optional(),
  minHeight: DimensionSchema.optional(),
  maxHeight: DimensionSchema.optional(),
  
  // Spacing
  padding: z.union([z.number(), z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
  })]).optional(),
  margin: z.union([z.number(), z.object({
    top: z.number().optional(),
    right: z.number().optional(),
    bottom: z.number().optional(),
    left: z.number().optional(),
  })]).optional(),
  
  // Positioning
  position: z.enum(['relative', 'absolute', 'fixed']).optional(),
  top: DimensionSchema.optional(),
  right: DimensionSchema.optional(),
  bottom: DimensionSchema.optional(),
  left: DimensionSchema.optional(),
  zIndex: z.number().optional(),
  
  // Flexbox
  flex: z.number().optional(),
  flexDirection: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
  flexWrap: z.enum(['wrap', 'nowrap', 'wrap-reverse']).optional(),
  justifyContent: z.enum(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']).optional(),
  alignItems: z.enum(['flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  alignSelf: z.enum(['auto', 'flex-start', 'flex-end', 'center', 'stretch', 'baseline']).optional(),
  gap: z.number().optional(),
  
  // Colors
  backgroundColor: ColorSchema.optional(),
  color: ColorSchema.optional(),
  
  // Border
  borderWidth: z.number().optional(),
  borderColor: ColorSchema.optional(),
  borderRadius: z.union([z.number(), z.object({
    topLeft: z.number().optional(),
    topRight: z.number().optional(),
    bottomRight: z.number().optional(),
    bottomLeft: z.number().optional(),
  })]).optional(),
  borderStyle: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
  
  // Typography
  fontSize: z.number().optional(),
  fontWeight: z.enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']).optional(),
  fontFamily: z.string().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
  
  // Effects
  opacity: z.number().min(0).max(1).optional(),
  shadow: z.object({
    color: ColorSchema,
    offsetX: z.number(),
    offsetY: z.number(),
    blurRadius: z.number(),
    spreadRadius: z.number().optional(),
  }).optional(),
  
  // Visibility
  display: z.enum(['flex', 'none', 'block']).optional(),
  overflow: z.enum(['visible', 'hidden', 'scroll']).optional(),
}).partial()

export type Style = z.infer<typeof StyleSchema>

/**
 * Responsive styles per breakpoint
 */
export const ResponsiveStyleSchema = z.object({
  base: StyleSchema.optional(),
  xs: StyleSchema.optional(),
  sm: StyleSchema.optional(),
  md: StyleSchema.optional(),
  lg: StyleSchema.optional(),
  xl: StyleSchema.optional(),
})

export type ResponsiveStyle = z.infer<typeof ResponsiveStyleSchema>

// ============================================================================