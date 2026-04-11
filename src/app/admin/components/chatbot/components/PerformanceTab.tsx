'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, Trash2, TrendingUp, Zap, RefreshCw, DollarSign, BarChart3, Download, TrendingDown, TrendingUp as TrendingUpIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { Chatbot } from '../types'
import { ObservabilityDashboard } from './ObservabilityDashboard'
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

          {/* Rate Limiting Tab */}
          <TabsContent value="rate-limit" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Control how many requests users can make per time period to prevent abuse and control costs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Rate Limiting</Label>
                  <Switch
                    checked={rateLimit.enabled}
                    onCheckedChange={(checked) => setRateLimit({ ...rateLimit, enabled: checked })}
                  />
                </div>

                {rateLimit.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Requests per Minute</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerMinute || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerMinute: parseInt(e.target.value) || 0 })}
                          placeholder="60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Hour</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerHour || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerHour: parseInt(e.target.value) || 0 })}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Day</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerDay || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerDay: parseInt(e.target.value) || 0 })}
                          placeholder="10000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Requests per Month (Optional)</Label>
                        <Input
                          type="number"
                          value={rateLimit.maxRequestsPerMonth || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, maxRequestsPerMonth: parseInt(e.target.value) || 0 })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Burst Limit (Optional)</Label>
                        <Input
                          type="number"
                          value={rateLimit.burstLimit || ''}
                          onChange={(e) => setRateLimit({ ...rateLimit, burstLimit: parseInt(e.target.value) || 0 })}
                          placeholder="Allow burst of N requests"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Window Size (seconds)</Label>
                        <Input
                          type="number"
                          value={rateLimit.windowSize}
                          onChange={(e) => setRateLimit({ ...rateLimit, windowSize: parseInt(e.target.value) || 60 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Block Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={rateLimit.blockDuration}
                        onChange={(e) => setRateLimit({ ...rateLimit, blockDuration: parseInt(e.target.value) || 300 })}
                        placeholder="300"
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to block users when they exceed the rate limit
                      </p>
                    </div>
                  </div>
                )}

                <Button onClick={saveRateLimit} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Rate Limit Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cache Tab */}
          <TabsContent value="cache" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Caching</CardTitle>
                <CardDescription>
                  Cache responses to reduce API costs and improve response times for duplicate queries.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Caching</Label>
                  <Switch
                    checked={cacheConfig.enabled}
                    onCheckedChange={(checked) => setCacheConfig({ ...cacheConfig, enabled: checked })}
                  />
                </div>

                {cacheConfig.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>TTL (Time to Live) in seconds</Label>
                        <Input
                          type="number"
                          value={cacheConfig.ttl}
                          onChange={(e) => setCacheConfig({ ...cacheConfig, ttl: parseInt(e.target.value) || 3600 })}
                          placeholder="3600"
                        />
                        <p className="text-xs text-muted-foreground">How long cached responses are valid</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Max Cache Size</Label>
                        <Input
                          type="number"
                          value={cacheConfig.maxSize}
                          onChange={(e) => setCacheConfig({ ...cacheConfig, maxSize: parseInt(e.target.value) || 1000 })}
                          placeholder="1000"
                        />
                        <p className="text-xs text-muted-foreground">Maximum number of cached responses</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cache Strategy</Label>
                      <Select
                        value={cacheConfig.strategy}
                        onValueChange={(value: string) => setCacheConfig({ ...cacheConfig, strategy: value as 'exact' | 'semantic' | 'fuzzy' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact">Exact Match</SelectItem>
                          <SelectItem value="semantic">Semantic Match</SelectItem>
                          <SelectItem value="fuzzy">Fuzzy Match</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {cacheConfig.strategy === 'exact' && 'Cache only exact message matches'}
                        {cacheConfig.strategy === 'semantic' && 'Cache similar messages (normalized, case-insensitive)'}
                        {cacheConfig.strategy === 'fuzzy' && 'Cache based on first N words'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include Context in Cache Key</Label>
                        <p className="text-xs text-muted-foreground">Include conversation history in cache key for more precise matching</p>
                      </div>
                      <Switch
                        checked={cacheConfig.includeContext}
                        onCheckedChange={(checked) => setCacheConfig({ ...cacheConfig, includeContext: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cache Key Prefix (Optional)</Label>
                      <Input
                        value={cacheConfig.cacheKeyPrefix || ''}
                        onChange={(e) => setCacheConfig({ ...cacheConfig, cacheKeyPrefix: e.target.value || null })}
                        placeholder="Optional prefix for cache keys"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={saveCacheConfig} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Cache Config
                  </Button>
                  <Button onClick={clearCache} variant="destructive" disabled={saving}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retry Tab */}
          <TabsContent value="retry" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Retry Logic</CardTitle>
                <CardDescription>
                  Configure automatic retries with exponential backoff for failed API requests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Retry Logic</Label>
                  <Switch
                    checked={retryConfig.enabled}
                    onCheckedChange={(checked) => setRetryConfig({ ...retryConfig, enabled: checked })}
                  />
                </div>

                {retryConfig.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Retries</Label>
                        <Input
                          type="number"
                          value={retryConfig.maxRetries}
                          onChange={(e) => setRetryConfig({ ...retryConfig, maxRetries: parseInt(e.target.value) || 3 })}
                          placeholder="3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Initial Delay (ms)</Label>
                        <Input
                          type="number"
                          value={retryConfig.initialDelay}
                          onChange={(e) => setRetryConfig({ ...retryConfig, initialDelay: parseInt(e.target.value) || 1000 })}
                          placeholder="1000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Delay (ms)</Label>
                        <Input
                          type="number"
                          value={retryConfig.maxDelay}
                          onChange={(e) => setRetryConfig({ ...retryConfig, maxDelay: parseInt(e.target.value) || 30000 })}
                          placeholder="30000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Backoff Multiplier</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={retryConfig.backoffMultiplier}
                          onChange={(e) => setRetryConfig({ ...retryConfig, backoffMultiplier: parseFloat(e.target.value) || 2.0 })}
                          placeholder="2.0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Retryable Status Codes</Label>
                      <Input
                        value={retryConfig.retryableStatusCodes.join(', ')}
                        onChange={(e) => setRetryConfig({ ...retryConfig, retryableStatusCodes: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="500, 502, 503, 504"
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list of HTTP status codes to retry</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Jitter</Label>
                        <p className="text-xs text-muted-foreground">Add randomness to retry delays to prevent thundering herd</p>
                      </div>
                      <Switch
                        checked={retryConfig.jitter}
                        onCheckedChange={(checked) => setRetryConfig({ ...retryConfig, jitter: checked })}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={saveRetryConfig} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Retry Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Budget Tab */}
          <TabsContent value="budget" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Budget & Tracking</CardTitle>
                <CardDescription>
                  Set spending limits and track costs per chatbot, user, or thread.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Cost Tracking</Label>
                  <Switch
                    checked={costBudget.enabled}
                    onCheckedChange={(checked) => setCostBudget({ ...costBudget, enabled: checked })}
                  />
                </div>

                {costBudget.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Monthly Budget (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costBudget.monthlyBudget || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, monthlyBudget: parseFloat(e.target.value) || null })}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Budget (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={costBudget.dailyBudget || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, dailyBudget: parseFloat(e.target.value) || null })}
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Alert Threshold (0-1)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={costBudget.alertThreshold}
                          onChange={(e) => setCostBudget({ ...costBudget, alertThreshold: parseFloat(e.target.value) || 0.8 })}
                          placeholder="0.8"
                        />
                        <p className="text-xs text-muted-foreground">Alert when budget reaches this percentage</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Alert Email</Label>
                        <Input
                          type="email"
                          value={costBudget.alertEmail || ''}
                          onChange={(e) => setCostBudget({ ...costBudget, alertEmail: e.target.value || null })}
                          placeholder="admin@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tracking Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-normal">Track Costs Per User</Label>
                          <Switch
                            checked={costBudget.trackPerUser}
                            onCheckedChange={(checked) => setCostBudget({ ...costBudget, trackPerUser: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="font-normal">Track Costs Per Thread</Label>
                          <Switch
                            checked={costBudget.trackPerThread}
                            onCheckedChange={(checked) => setCostBudget({ ...costBudget, trackPerThread: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={saveCostBudget} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Budget Config
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analytics</CardTitle>
                <CardDescription>
                  View spending statistics and trends for this chatbot.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : costStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Cost</div>
                        <div className="text-2xl font-bold">${costStats.totalCost.toFixed(2)}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                        <div className="text-2xl font-bold">{costStats.totalRequests}</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Average Cost</div>
                        <div className="text-2xl font-bold">${costStats.averageCost.toFixed(4)}</div>
                      </div>
                    </div>

                    {Object.keys(costStats.costByModel || {}).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by Model</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByModel).map(([model, cost]: [string, any]) => (
                            <div key={model} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{model}</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {costStats.costByUser && Object.keys(costStats.costByUser).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by User</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByUser).map(([userId, cost]: [string, any]) => (
                            <div key={userId} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{userId.substring(0, 8)}...</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {costStats.costByThread && Object.keys(costStats.costByThread).length > 0 && (
                      <div className="space-y-2">
                        <Label>Cost by Thread</Label>
                        <div className="space-y-2">
                          {Object.entries(costStats.costByThread).map(([threadId, cost]: [string, any]) => (
                            <div key={threadId} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{threadId.substring(0, 12)}...</span>
                              <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={loadCostStats} variant="outline" disabled={statsLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Stats
                      </Button>
                      <Button onClick={() => exportCostData('csv')} variant="outline" disabled={statsLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={() => exportCostData('json')} variant="outline" disabled={statsLoading}>
                        <Download className="h-4 w-4 mr-2" />
                        Export JSON
                      </Button>
                    </div>

                    {/* Cost Forecast Section */}
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg font-semibold">Cost Forecast (Next 30 Days)</Label>
                        <Button onClick={loadCostForecast} variant="outline" size="sm" disabled={forecastLoading}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${forecastLoading ? 'animate-spin' : ''}`} />
                          Refresh Forecast
                        </Button>
                      </div>
                      {forecastLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : costForecast ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg">
                              <div className="text-sm text-muted-foreground">Forecasted Cost</div>
                              <div className="text-2xl font-bold">${costForecast.forecastedCost.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ${costForecast.forecastedDailyAverage.toFixed(2)}/day average
                              </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="text-sm text-muted-foreground">Trend</div>
                              <div className="flex items-center gap-2 mt-1">
                                {costForecast.trend === 'increasing' && <TrendingUpIcon className="h-5 w-5 text-red-500" />}
                                {costForecast.trend === 'decreasing' && <TrendingDown className="h-5 w-5 text-green-500" />}
                                {costForecast.trend === 'stable' && <BarChart3 className="h-5 w-5 text-muted-foreground" />}
                                <span className="text-lg font-semibold capitalize">{costForecast.trend}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Confidence: {(costForecast.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          {costForecast.historicalData && costForecast.historicalData.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Based on {costForecast.historicalData.length} days of historical data
                            </div>
                          )}
                        </div>
                      ) : (
                        <Alert>
                          <AlertDescription>No forecast data available. Need at least 2 days of cost data.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No cost data available yet. Start using the chatbot to see statistics.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observability Tab */}
          <TabsContent value="observability" className="space-y-4 pt-4">
            <ObservabilityDashboard chatbot={chatbot} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

