'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, Zap, RefreshCw, DollarSign, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Chatbot } from '../types'
import { ObservabilityDashboard } from './ObservabilityDashboard'
import { PerformanceAnalyticsTab } from './PerformanceAnalyticsTab'
import { PerformanceConfigurationTabs } from './PerformanceConfigurationTabs'
import { isUuid } from '@/lib/validation'

interface PerformanceTabProps {
  chatbot: Chatbot | null
}

export function PerformanceTab({ chatbot }: PerformanceTabProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Rate Limit State
  const [rateLimit, setRateLimit] = useState({
    enabled: true,
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxRequestsPerDay: 10000,
    maxRequestsPerMonth: null as number | null,
    burstLimit: null as number | null,
    windowSize: 60,
    blockDuration: 300,
  })

  // Cache Config State
  const [cacheConfig, setCacheConfig] = useState({
    enabled: true,
    ttl: 3600,
    maxSize: 1000,
    strategy: 'exact' as 'exact' | 'semantic' | 'fuzzy',
    includeContext: false,
    cacheKeyPrefix: null as string | null,
  })

  // Retry Config State
  const [retryConfig, setRetryConfig] = useState({
    enabled: true,
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2.0,
    retryableStatusCodes: ['500', '502', '503', '504'],
    jitter: true,
  })

  // Cost Budget State
  const [costBudget, setCostBudget] = useState({
    enabled: true,
    monthlyBudget: null as number | null,
    dailyBudget: null as number | null,
    alertThreshold: 0.8,
    alertEmail: null as string | null,
    trackPerUser: false,
    trackPerThread: false,
  })

  // Cost Stats State
  const [costStats, setCostStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [costForecast, setCostForecast] = useState<any>(null)
  const [forecastLoading, setForecastLoading] = useState(false)

  // Load configurations on mount
  useEffect(() => {
    if (chatbot?.id) {
      loadConfigurations()
      loadCostStats()
      loadCostForecast()
    }
  }, [chatbot?.id])

  const loadConfigurations = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    // Chatbots stored in localStorage may have non-UUID IDs
    if (!isUuid(chatbot.id)) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Load all configs in parallel
      const [rateLimitRes, cacheRes, retryRes, budgetRes] = await Promise.all([
        fetch(`/api/chatbots/${chatbot.id}/rate-limit`),
        fetch(`/api/chatbots/${chatbot.id}/cache-config`),
        fetch(`/api/chatbots/${chatbot.id}/retry-config`),
        fetch(`/api/chatbots/${chatbot.id}/cost-budget`),
      ])

      if (rateLimitRes.ok) {
        const data = await rateLimitRes.json()
        if (data.config) {
          setRateLimit({
            enabled: data.config.enabled,
            maxRequestsPerMinute: data.config.maxRequestsPerMinute || 60,
            maxRequestsPerHour: data.config.maxRequestsPerHour || 1000,
            maxRequestsPerDay: data.config.maxRequestsPerDay || 10000,
            maxRequestsPerMonth: data.config.maxRequestsPerMonth,
            burstLimit: data.config.burstLimit,
            windowSize: data.config.windowSize || 60,
            blockDuration: data.config.blockDuration || 300,
          })
        }
      }

      if (cacheRes.ok) {
        const data = await cacheRes.json()
        if (data.config) {
          setCacheConfig({
            enabled: data.config.enabled,
            ttl: data.config.ttl || 3600,
            maxSize: data.config.maxSize || 1000,
            strategy: data.config.strategy || 'exact',
            includeContext: data.config.includeContext || false,
            cacheKeyPrefix: data.config.cacheKeyPrefix,
          })
        }
      }

      if (retryRes.ok) {
        const data = await retryRes.json()
        if (data.config) {
          setRetryConfig({
            enabled: data.config.enabled,
            maxRetries: data.config.maxRetries || 3,
            initialDelay: data.config.initialDelay || 1000,
            maxDelay: data.config.maxDelay || 30000,
            backoffMultiplier: data.config.backoffMultiplier || 2.0,
            retryableStatusCodes: data.config.retryableStatusCodes || ['500', '502', '503', '504'],
            jitter: data.config.jitter ?? true,
          })
        }
      }

      if (budgetRes.ok) {
        const data = await budgetRes.json()
        if (data.budget) {
          setCostBudget({
            enabled: data.budget.enabled,
            monthlyBudget: data.budget.monthlyBudget,
            dailyBudget: data.budget.dailyBudget,
            alertThreshold: data.budget.alertThreshold || 0.8,
            alertEmail: data.budget.alertEmail,
            trackPerUser: data.budget.trackPerUser || false,
            trackPerThread: data.budget.trackPerThread || false,
          })
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
      toast.error('Failed to load configurations')
    } finally {
      setLoading(false)
    }
  }

  const loadCostStats = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      setStatsLoading(false)
      return
    }

    setStatsLoading(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cost-stats`)
      if (response.ok) {
        const data = await response.json()
        setCostStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading cost stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadCostForecast = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      setForecastLoading(false)
      return
    }

    setForecastLoading(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cost-forecast?days=30`)
      if (response.ok) {
        const data = await response.json()
        setCostForecast(data.forecast)
      }
    } catch (error) {
      console.error('Error loading cost forecast:', error)
    } finally {
      setForecastLoading(false)
    }
  }

  const exportCostData = async (format: 'json' | 'csv' = 'csv') => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot export: Chatbot ID must be a valid UUID')
      return
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cost-export?format=${format}`)
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          // deepcode ignore javascript/DOMXSS: Trusted blob URL
          a.href = url
          a.download = `cost-export-${chatbot.id}-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success('Cost data exported as CSV')
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          // deepcode ignore javascript/DOMXSS: Trusted blob URL
          a.href = url
          a.download = `cost-export-${chatbot.id}-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          toast.success('Cost data exported as JSON')
        }
      } else {
        throw new Error('Failed to export')
      }
    } catch (error) {
      console.error('Error exporting cost data:', error)
      toast.error('Failed to export cost data')
    }
  }

  const saveRateLimit = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot save: Chatbot ID must be a valid UUID')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/rate-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateLimit),
      })

      if (response.ok) {
        toast.success('Rate limit configuration saved')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save rate limit configuration')
    } finally {
      setSaving(false)
    }
  }

  const saveCacheConfig = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot save: Chatbot ID must be a valid UUID')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cache-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheConfig),
      })

      if (response.ok) {
        toast.success('Cache configuration saved')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save cache configuration')
    } finally {
      setSaving(false)
    }
  }

  const clearCache = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot clear cache: Chatbot ID must be a valid UUID')
      return
    }

    if (!confirm('Are you sure you want to clear all cached responses?')) return

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cache-config`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Cache cleared successfully')
      } else {
        throw new Error('Failed to clear cache')
      }
    } catch (error) {
      toast.error('Failed to clear cache')
    } finally {
      setSaving(false)
    }
  }

  const saveRetryConfig = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot save: Chatbot ID must be a valid UUID')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/retry-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retryConfig),
      })

      if (response.ok) {
        toast.success('Retry configuration saved')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save retry configuration')
    } finally {
      setSaving(false)
    }
  }

  const saveCostBudget = async () => {
    if (!chatbot?.id) return

    // Only make API calls if chatbot ID is a valid UUID
    if (!isUuid(chatbot.id)) {
      toast.error('Cannot save: Chatbot ID must be a valid UUID')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}/cost-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(costBudget),
      })

      if (response.ok) {
        toast.success('Cost budget configuration saved')
        loadCostStats() // Reload stats
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save cost budget configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="rate-limit" className="flex w-full gap-6">
        {/* Vertical Sidebar Menu */}
        <TabsList orientation="vertical" className="bg-muted/30 p-1 min-h-[400px] h-fit flex-col justify-start items-stretch gap-1 w-[220px] rounded-lg shrink-0">
          <TabsTrigger value="rate-limit" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <Zap className="h-4 w-4" />
            Rate Limits
          </TabsTrigger>
          <TabsTrigger value="cache" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <RefreshCw className="h-4 w-4" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="retry" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <RefreshCw className="h-4 w-4" />
            Retry
          </TabsTrigger>
          <TabsTrigger value="budget" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="analytics" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="observability" className="justify-start gap-2 px-3 py-2.5 rounded-md aria-selected:bg-background aria-selected:shadow-lg aria-selected:font-semibold hover:bg-muted/50 transition-all">
            <TrendingUp className="h-4 w-4" />
            Observability
          </TabsTrigger>
        </TabsList>

        {/* Content Area */}
        <div className="flex-1 w-full max-w-[800px]">

          <PerformanceConfigurationTabs
            cacheConfig={cacheConfig}
            costBudget={costBudget}
            rateLimit={rateLimit}
            retryConfig={retryConfig}
            saving={saving}
            clearCache={clearCache}
            saveCacheConfig={saveCacheConfig}
            saveCostBudget={saveCostBudget}
            saveRateLimit={saveRateLimit}
            saveRetryConfig={saveRetryConfig}
            setCacheConfig={setCacheConfig}
            setCostBudget={setCostBudget}
            setRateLimit={setRateLimit}
            setRetryConfig={setRetryConfig}
          />

          <PerformanceAnalyticsTab
            costForecast={costForecast}
            costStats={costStats}
            forecastLoading={forecastLoading}
            statsLoading={statsLoading}
            exportCostData={exportCostData}
            loadCostForecast={loadCostForecast}
            loadCostStats={loadCostStats}
          />
          <TabsContent value="observability" className="space-y-4 pt-4">
            <ObservabilityDashboard chatbot={chatbot} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

