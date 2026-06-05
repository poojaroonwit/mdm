/**
 * Pagination Hook
 * Common pagination logic for tables and lists
 */

import { useState, useCallback } from 'react'
import { DEFAULT_PAGINATION } from '@/lib/constants/defaults'

export interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  total?: number
  onPageChange?: (page: number, limit: number) => void
}

export interface UsePaginationReturn {
  page: number
  limit: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  reset: () => void
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = DEFAULT_PAGINATION.page,
    initialLimit = DEFAULT_PAGINATION.limit,
    total: initialTotal = 0,
    onPageChange,
  } = options

  const [page, setPageState] = useState(initialPage)
  const [limit, setLimitState] = useState(initialLimit)
  const [total, setTotal] = useState(initialTotal)

  const totalPages = Math.ceil(total / limit)

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage)
      onPageChange?.(newPage, limit)
    },
    [limit, onPageChange]
  )

  const setLimit = useCallback(
    (newLimit: number) => {
      setLimitState(newLimit)
      setPageState(1)
      onPageChange?.(1, newLimit)
    },
    [onPageChange]
  )

  const nextPage = useCallback(() => {
    const maxPage = totalPages > 0 ? totalPages : page + 1
    setPage(Math.min(page + 1, maxPage))
  }, [page, setPage, totalPages])

  const prevPage = useCallback(() => {
    setPage(Math.max(1, page - 1))
  }, [page, setPage])

  const previousPage = prevPage

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  const reset = useCallback(() => {
    setPage(initialPage)
    setLimit(initialLimit)
    setTotal(initialTotal)
  }, [initialPage, initialLimit, initialTotal])

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    previousPage,
    goToPage,
    reset
  }
}
