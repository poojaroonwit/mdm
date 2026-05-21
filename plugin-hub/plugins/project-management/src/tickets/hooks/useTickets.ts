'use client'

import { useState, useEffect } from 'react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { Ticket, TicketFilters } from '../types'

export interface UseTicketsOptions {
  spaceId?: string | null
  filters?: TicketFilters
  autoFetch?: boolean
}

export interface UseTicketsResult {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching tickets with space-aware filtering
 */
export function useTickets(options: UseTicketsOptions = {}): UseTicketsResult {
  const { spaceId, filters = {}, autoFetch = true } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: '1',
        limit: '50',
      })

      // Add space filter if specified
      if (spaceFilter.spaceId) {
        params.append('spaceId', spaceFilter.spaceId)
      }

      // Add search query if provided
      if (filters.search) {
        params.append('search', filters.search)
      }

      // Add other filters
      if (filters.status) {
        params.append('status', filters.status)
      }
      if (filters.priority) {
        params.append('priority', filters.priority)
      }
      if (filters.assigneeId) {
        params.append('assignedTo', filters.assigneeId)
      }
      if (filters.projectId) {
        params.append('projectId', filters.projectId)
      }
      if (filters.cycleId) {
        params.append('cycleId', filters.cycleId)
      }

      // Add sorting if provided
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy)
        params.append('sortOrder', filters.sortOrder || 'asc')
      }

      const response = await fetch(`/api/tickets?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tickets')
      }

      const data = await response.json()
      setTickets(data.data || data.tickets || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tickets'
      setError(errorMessage)
      console.error('Error fetching tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchTickets()
    }
  }, [spaceFilter.spaceId, filters.status, filters.priority, filters.assigneeId, filters.projectId, filters.cycleId, autoFetch])

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
    spaceFilter,
  }
}

