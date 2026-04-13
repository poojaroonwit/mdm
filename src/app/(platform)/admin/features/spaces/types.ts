/**
 * Spaces Feature Types
 * Centralized type definitions for the spaces feature
 */

export interface Space {
  id: string
  name: string
  description?: string
  slug?: string
  is_default?: boolean
  is_active?: boolean
  deleted_at?: string | null
  member_count?: number
  tags?: string[]
}

export interface LayoutTemplate {
  id: string
  name: string
  description?: string
  json: any
  allowedSpaceIds: string[]
}

