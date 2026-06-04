'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useSpace } from '@/contexts/space-context'
import type { Report, ReportCategory, ReportFolder } from '@/types/reports'

interface ReportsFilters {
  source?: string
  category_id?: string
  status?: string
  search?: string
  showFavorites?: boolean
}

export function useReports(filters: ReportsFilters = {}) {
  const { status } = useSession()
  const { currentSpace } = useSpace()

  return useQuery({
    queryKey: ['reports', currentSpace?.id, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(currentSpace?.id && { space_id: currentSpace.id }),
        ...(filters.search && { search: filters.search }),
        ...(filters.source && { source: filters.source }),
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load reports')
      }

      const data = await response.json()
      let filteredReports = data.reports || []
      
      // Apply favorites filter
      if (filters.showFavorites) {
        const stored = localStorage.getItem('report_favorites')
        const favoriteIds = stored ? JSON.parse(stored) : []
        filteredReports = filteredReports.filter((r: Report) => favoriteIds.includes(r.id))
      }

      return {
        reports: filteredReports as Report[],
        categories: (data.categories || []) as ReportCategory[],
        folders: (data.folders || []) as ReportFolder[]
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: status === 'authenticated',
  })
}

export function useReport(reportId: string) {
  const { status } = useSession()

  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/${reportId}`)
      if (!response.ok) {
        throw new Error('Failed to load report')
      }
      const data = await response.json()
      return data.report as Report
    },
    enabled: !!reportId && status === 'authenticated',
  })
}

export function useCreateReport() {
  const queryClient = useQueryClient()
  const { currentSpace } = useSpace()

  return useMutation({
    mutationFn: async (reportData: any) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          space_ids: [currentSpace?.id]
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create report')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    }
  })
}

export function useUpdateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: any }) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update report')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] })
    }
  })
}

export function useDeleteReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reportId: string) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete report')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    }
  })
}

