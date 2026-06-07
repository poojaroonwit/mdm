import { z } from 'zod'

// Action Schema
// ============================================================================

/**
 * Action types for user interactions
 */
export const ActionTypeSchema = z.enum([
  'navigate',     // Navigate to another screen/page
  'api',          // Make an API call
  'openUrl',      // Open external URL
  'share',        // Share content
  'refresh',      // Refresh data
  'submit',       // Submit form
  'custom',       // Custom action handler
  'showModal',    // Show modal/dialog
  'hideModal',    // Hide modal/dialog
  'showToast',    // Show toast notification
  'setContext',   // Update app context/state
])

/**
 * Action configuration
 */
export interface Action {
  type: 'navigate' | 'api' | 'openUrl' | 'share' | 'refresh' | 'submit' | 'custom' | 'showModal' | 'hideModal' | 'showToast' | 'setContext'
  target?: string
  params?: Record<string, any>
  endpoint?: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  confirmation?: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
  }
  onSuccess?: Action
  onError?: Action
  handler?: string
}

export const ActionSchema: z.ZodType<Action> = z.lazy(() => z.object({
  type: ActionTypeSchema,
  target: z.string().optional(),
  params: z.record(z.string(), z.any()).optional(),
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  body: z.any().optional(),
  confirmation: z.object({
    title: z.string(),
    message: z.string(),
    confirmText: z.string().optional(),
    cancelText: z.string().optional(),
  }).optional(),
  onSuccess: z.lazy(() => ActionSchema).optional(),
  onError: z.lazy(() => ActionSchema).optional(),
  handler: z.string().optional(),
}))

// ============================================================================