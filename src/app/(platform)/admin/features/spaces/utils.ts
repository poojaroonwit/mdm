/**
 * Spaces Feature Utilities
 * Helper functions for space operations
 */

import { Space } from './types'

/**
 * Check if space is active
 */
export function isSpaceActive(space: Space): boolean {
  return space.is_active === true
}

/**
 * Check if space is default
 */
export function isSpaceDefault(space: Space): boolean {
  return space.is_default === true
}

/**
 * Check if space is archived
 */
export function isSpaceArchived(space: Space): boolean {
  return space.deleted_at !== null && space.deleted_at !== undefined
}

/**
 * Filter spaces by status
 */
export function filterSpacesByStatus(
  spaces: Space[],
  status: 'all' | 'active' | 'inactive' | 'archive'
): Space[] {
  if (status === 'all') return spaces
  
  switch (status) {
    case 'active':
      return spaces.filter(space => isSpaceActive(space) && !isSpaceArchived(space))
    case 'inactive':
      return spaces.filter(space => !isSpaceActive(space) && !isSpaceArchived(space))
    case 'archive':
      return spaces.filter(space => isSpaceArchived(space))
    default:
      return spaces
  }
}

/**
 * Filter spaces by search query
 */
export function filterSpacesBySearch(spaces: Space[], query: string): Space[] {
  if (!query.trim()) return spaces
  
  const lowerQuery = query.toLowerCase()
  return spaces.filter(space =>
    space.name?.toLowerCase().includes(lowerQuery) ||
    space.description?.toLowerCase().includes(lowerQuery) ||
    space.slug?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter spaces by tags
 */
export function filterSpacesByTags(spaces: Space[], tags: string[]): Space[] {
  if (tags.length === 0) return spaces
  
  return spaces.filter(space =>
    space.tags && space.tags.some(tag => tags.includes(tag))
  )
}

/**
 * Sort spaces by name
 */
export function sortSpacesByName(spaces: Space[], order: 'asc' | 'desc' = 'asc'): Space[] {
  return [...spaces].sort((a, b) => {
    const comparison = (a.name || '').localeCompare(b.name || '')
    return order === 'asc' ? comparison : -comparison
  })
}

/**
 * Get all unique tags from spaces
 */
export function getAllTags(spaces: Space[]): string[] {
  const tagSet = new Set<string>()
  spaces.forEach(space => {
    if (space.tags) {
      space.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
}

/**
 * Format space slug
 */
export function formatSpaceSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

