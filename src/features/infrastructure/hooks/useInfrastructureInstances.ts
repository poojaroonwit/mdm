'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { InfrastructureInstance, InfrastructureFilters } from '../types'

export interface UseInfrastructureInstancesOptions {
  spaceId?: string | null
  filters?: InfrastructureFilters
  autoFetch?: boolean
}

export interface UseInfrastructureInstancesResult {
  instances: InfrastructureInstance[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching infrastructure instances with space-aware filtering
 */
export function useInfrastructureInstances(
  options: UseInfrastructureInstancesOptions = {}
): UseInfrastructureInstancesResult {
  const { status } = useSession()
  const { spaceId, filters = {}, autoFetch = true } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })
  
  const [instances, setInstances] = useState<InfrastructureInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstances = async () => {
    if (status !== 'authenticated') {
      setInstances([])
      setError(status === 'unauthenticated' ? 'Authentication required. Please sign in.' : null)
      setLoading(status === 'loading')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()

      // Add space filter if specified
      if (spaceFilter.spaceId) {
        params.append('spaceId', spaceFilter.spaceId)
      }

      // Add other filters
      if (filters.type) {
        params.append('type', filters.type)
      }
      if (filters.status) {
        params.append('status', filters.status)
      }

      const response = await fetch(`/api/infrastructure/instances?${params.toString()}`)
      
      if (!response.ok) {
        let errorMessage = `Failed to fetch instances (${response.status})`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = `${errorData.error}${errorData.reason ? `: ${errorData.reason}` : ''}`
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to fetch instances: ${response.statusText} (${response.status})`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setInstances(data.instances || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load instances'
      setError(errorMessage)
      console.error('Error fetching instances:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchInstances()
    }
  }, [spaceFilter.spaceId, filters.type, filters.status, autoFetch, status])

  return {
    instances,
    loading,
    error,
    refetch: fetchInstances,
    spaceFilter,
  }
}

