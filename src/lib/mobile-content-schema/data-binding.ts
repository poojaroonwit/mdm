import { z } from 'zod'

// Data Binding Schema
// ============================================================================

/**
 * Data source types
 */
export const DataSourceTypeSchema = z.enum([
  'api',        // REST API endpoint
  'graphql',    // GraphQL query
  'static',     // Static data
  'context',    // From app context/state
  'parameter',  // From URL/navigation parameters
])

/**
 * Data binding configuration
 * Allows components to bind to data sources
 */
export const DataBindingSchema = z.object({
  /**
   * Unique identifier for this binding
   */
  id: z.string(),
  
  /**
   * Type of data source
   */
  type: DataSourceTypeSchema,
  
  /**
   * For API: endpoint URL (relative or absolute)
   * For GraphQL: query string
   * For context: context path
   * For parameter: parameter name
   */
  source: z.string(),
  
  /**
   * HTTP method for API calls
   */
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  
  /**
   * Headers for API calls
   */
  headers: z.record(z.string(), z.string()).optional(),
  
  /**
   * Request body schema
   */
  body: z.any().optional(),
  
  /**
   * Response data path (JSONPath-like)
   * e.g., "data.items" or "response.user.profile"
   */
  responsePath: z.string().optional(),
  
  /**
   * Transform function name to apply to data
   */
  transform: z.string().optional(),
  
  /**
   * Refresh interval in milliseconds (0 = no auto-refresh)
   */
  refreshInterval: z.number().optional(),
  
  /**
   * Whether to cache the response
   */
  cache: z.boolean().optional(),
  
  /**
   * Cache TTL in seconds
   */
  cacheTTL: z.number().optional(),
  
  /**
   * Pagination configuration
   */
  pagination: z.object({
    type: z.enum(['offset', 'cursor', 'page']),
    pageSize: z.number(),
    pageParam: z.string().optional(),
    limitParam: z.string().optional(),
    offsetParam: z.string().optional(),
    cursorParam: z.string().optional(),
  }).optional(),
})

export type DataBinding = z.infer<typeof DataBindingSchema>

// ============================================================================