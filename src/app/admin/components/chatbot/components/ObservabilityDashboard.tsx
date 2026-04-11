'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, TrendingUp, Activity, Zap, Clock, AlertCircle, CheckCircle, XCircle, BarChart3, LineChart, PieChart } from 'lucide-react'
import { Chatbot } from '../types'

interface ObservabilityDashboardProps {
  chatbot: Chatbot | null
}

interface TraceData {
  id: string
  name: string
  userId?: string
  timestamp: string
  latency?: number
  status: 'success' | 'error' | 'pending'
  metadata?: any
  observations?: any[]
}

interface MetricData {
  totalRequests: number
  successRate: number
  averageLatency: number
  errorRate: number
  toolUsage: Record<string, number>
  costByModel: Record<string, number>
  requestsOverTime: Array<{ date: string; count: number }>
}

export function ObservabilityDashboard({ chatbot }: ObservabilityDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [traces, setTraces] = useState<TraceData[]>([])
  const [metrics, setMetrics] = useState<MetricData | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [langfuseEnabled, setLangfuseEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    if (chatbot?.id) {
      // Check if Langfuse is enabled by trying to fetch traces
      checkLangfuseEnabled()
      loadObservabilityData()
    }
  }, [chatbot?.id, selectedTimeRange])

  const checkLangfuseEnabled = async () => {
    try {
      const response = await fetch(`/api/chatbots/${chatbot?.id}/observability/traces?timeRange=1h`)
      // If we get a response (even empty), Langfuse is configured
      setLangfuseEnabled(response.ok)
    } catch {
      setLangfuseEnabled(false)
    }
  }

  const loadObservabilityData = async () => {
    if (!chatbot?.id) return

    setLoading(true)
    try {
      // Load traces from Langfuse
      const tracesResponse = await fetch(`/api/chatbots/${chatbot.id}/observability/traces?timeRange=${selectedTimeRange}`)
      if (tracesResponse.ok) {
        const tracesData = await tracesResponse.json()
        setTraces(tracesData.traces || [])
      }

      // Load metrics
      const metricsResponse = await fetch(`/api/chatbots/${chatbot.id}/observability/metrics?timeRange=${selectedTimeRange}`)
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData.metrics || null)
      }
    } catch (error) {
      console.error('Error loading observability data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (langfuseEnabled === null) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!langfuseEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Observability Dashboard</CardTitle>
          <CardDescription>
            Enable Langfuse to view detailed observability metrics and traces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Langfuse is not configured. Add it in the integrations/settings UI to enable observability.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Observability Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Real-time metrics and traces from Langfuse
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button onClick={loadObservabilityData} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="w-full">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="traces">
              <Activity className="h-4 w-4 mr-2" />
              Traces
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <LineChart className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Zap className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            {metrics && (
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.totalRequests}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.averageLatency.toFixed(0)}ms</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-500">{metrics.errorRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {metrics && Object.keys(metrics.costByModel).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cost by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(metrics.costByModel).map(([model, cost]) => (
                      <div key={model} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium">{model}</span>
                        <span className="text-sm text-muted-foreground">${Number(cost).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="traces" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Traces</CardTitle>
                <CardDescription>
                  Execution traces from Langfuse showing agent interactions and tool calls
                </CardDescription>
              </CardHeader>
              <CardContent>
                {traces.length > 0 ? (
                  <div className="space-y-2">
                    {traces.map((trace) => (
                      <div key={trace.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {trace.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {trace.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                            {trace.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                            <span className="font-medium">{trace.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(trace.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {trace.latency && (
                          <div className="text-xs text-muted-foreground">
                            Latency: {trace.latency}ms
                          </div>
                        )}
                        {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground">Metadata</summary>
                            <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(trace.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No traces found for the selected time range
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 pt-4">
            {metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.requestsOverTime.length > 0 ? (
                    <div className="h-64 flex items-end justify-between gap-1">
                      {metrics.requestsOverTime.map((point, index) => {
                        const maxCount = Math.max(...metrics.requestsOverTime.map(p => p.count))
                        const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-primary rounded-t"
                              style={{ height: `${height}%` }}
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No metrics data available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4 pt-4">
            {metrics && Object.keys(metrics.toolUsage).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tool Usage</CardTitle>
                  <CardDescription>
                    Frequency of tool calls by the agent
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(metrics.toolUsage)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([tool, count]) => (
                        <div key={tool} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{tool}</span>
                          <span className="text-sm text-muted-foreground">{count as number} calls</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </div>
      )}
    </div>
  )
}

