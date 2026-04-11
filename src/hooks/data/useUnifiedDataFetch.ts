/**
 * Unified Data Platform Fetching Hook
 * Standardized pattern for data fetching with loading, error, and retry logic
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export interface UseUnifiedDataFetchOptions<T> {
  fetchFn: () => Promise<T>
  enabled?: boolean
  immediate?: boolean
  retryCount?: number
  retryDelay?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  dependencies?: any[]
}

export interface UseUnifiedDataFetchReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<T | null>
  reset: () => void
}

export function useUnifiedDataFetch<T>(
  options: UseUnifiedDataFetchOptions<T>
): UseUnifiedDataFetchReturn<T> {
  const {
    fetchFn,
    enabled = true,
    immediate = true,
    retryCount = 0,
    retryDelay = 1000,
    onSuccess,
    onError,
    dependencies = []
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate && enabled)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  const executeFetch = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      
      // Check if request was aborted
      if (signal.aborted) {
        return null
      }

      setData(result)
      retryCountRef.current = 0
      onSuccess?.(result)
      return result
    } catch (err) {
      // Check if request was aborted
      if (signal.aborted) {
        return null
      }

      const error = err instanceof Error ? err : new Error('Unknown error')
      
      // Retry logic
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return executeFetch()
      }

      setError(error)
      retryCountRef.current = 0
      onError?.(error)
      throw error
    } finally {
      if (!signal.aborted) {
        setLoading(false)
      }
    }
  }, [fetchFn, enabled, retryCount, retryDelay, onSuccess, onError])

  const refetch = useCallback(async () => {
    retryCountRef.current = 0
    return executeFetch()
  }, [executeFetch])

  const reset = useCallback(() => {
    // Cancel pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setData(null)
    setError(null)
    setLoading(false)
    retryCountRef.current = 0
  }, [])

  useEffect(() => {
    if (immediate && enabled) {
      executeFetch()
    }

    return () => {
      // Cleanup: abort pending request on unmount or dependency change
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [immediate, enabled, executeFetch, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch,
    reset
  }
}

