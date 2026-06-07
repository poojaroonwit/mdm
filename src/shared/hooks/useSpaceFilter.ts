'use client'

import { useSpace } from '@/contexts/space-context'
import { useMemo } from 'react'

export interface UseSpaceFilterOptions {
  spaceId?: string | null
  allowAll?: boolean // If true, null spaceId means all spaces
}

export interface SpaceFilterResult {
  spaceId: string | null
  isFiltered: boolean
  isAllSpaces: boolean
}

/**
 * Hook to get space filter value based on context and props
 * This ensures consistent space filtering across all features
 */
export function useSpaceFilter(
  options: UseSpaceFilterOptions = {}
): SpaceFilterResult {
  const { currentSpace } = useSpace()
  
  const { spaceId, allowAll = false } = options

  const result = useMemo(() => {
    // If spaceId is explicitly provided (including null), use it
    if (spaceId !== undefined) {
      return {
        spaceId,
        isFiltered: spaceId !== null,
        isAllSpaces: spaceId === null && allowAll,
      }
    }

    // Otherwise, use current space from context
    const effectiveSpaceId = currentSpace?.id || null
    
    return {
      spaceId: effectiveSpaceId,
      isFiltered: effectiveSpaceId !== null,
      isAllSpaces: effectiveSpaceId === null && allowAll,
    }
  }, [spaceId, currentSpace?.id, allowAll])

  return result
}

