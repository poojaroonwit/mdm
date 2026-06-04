'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSpaceFilter, SpaceFilterResult } from '@/shared/hooks/useSpaceFilter'
import { PluginDefinition, UseMarketplacePluginsOptions } from '../types'

export interface UseMarketplacePluginsResult {
  plugins: PluginDefinition[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  spaceFilter: SpaceFilterResult
}

/**
 * Hook for fetching marketplace plugins with space-aware filtering
 */
export function useMarketplacePlugins(
  options: UseMarketplacePluginsOptions = {}
): UseMarketplacePluginsResult {
  const { status } = useSession()
  const { category, spaceId, filters = {} } = options
  const spaceFilter = useSpaceFilter({ spaceId, allowAll: true })
  
  const [plugins, setPlugins] = useState<PluginDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlugins = async () => {
    if (status !== 'authenticated') {
      setPlugins([])
      setError(status === 'unauthenticated' ? 'Authentication required. Please sign in.' : null)
      setLoading(status === 'loading')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()

      if (category) {
        params.append('category', category)
      }

      if (filters.status) {
        params.append('status', filters.status)
      }

      if (filters.verified !== undefined) {
        params.append('verified', filters.verified.toString())
      }

      if (filters.serviceType) {
        params.append('serviceType', filters.serviceType)
      }

      if (filters.installedOnly) {
        params.append('installedOnly', 'true')
      }

      if (spaceId) {
        params.append('spaceId', spaceId)
      }

      // Fetch from hub by default (can be overridden)
      if (!params.has('source')) {
        const source = process.env.NEXT_PUBLIC_USE_PLUGIN_HUB === 'true' ? 'hub' : 'installed'
        params.append('source', source)
      }
      
      const response = await fetch(`/api/marketplace/plugins?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to fetch plugins: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setPlugins(data.plugins || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plugins'
      setError(errorMessage)
      console.error('Error fetching plugins:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlugins()
  }, [category, filters.status, filters.verified, filters.serviceType, filters.installedOnly, spaceId, status])

  return {
    plugins,
    loading,
    error,
    refetch: fetchPlugins,
    spaceFilter,
  }
}

