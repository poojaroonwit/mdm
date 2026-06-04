'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { Report, ReportFilters } from '../types'

export interface UseReportsOptions {
  spaceId?: string | null
  filters?: ReportFilters
  autoFetch?: boolean
}

export interface UseReportsResult {
  reports: Report[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching reports with space-aware filtering
 */
export function useReports(options: UseReportsOptions = {}): UseReportsResult {
  const { status } = useSession()
  const { spaceId, filters = {}, autoFetch = true } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })
  
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = async () => {
    if (status !== 'authenticated') {
      setReports([])
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
      if (filters.sourceType) {
        params.append('sourceType', filters.sourceType)
      }

      const response = await fetch(`/api/v1/reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reports'
      setError(errorMessage)
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchReports()
    }
  }, [spaceFilter.spaceId, filters.sourceType, autoFetch, status])

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
    spaceFilter,
  }
}

