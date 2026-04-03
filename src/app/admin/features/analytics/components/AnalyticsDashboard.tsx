'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Database, 
  HardDrive, 
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { SystemMetrics, ActivityData, StorageData } from '../types'

interface PerformanceData {
  time: string
  responseTime: number
  memoryUsage: number
  cpuUsage: number
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [storageData, setStorageData] = useState<StorageData[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || null)
        setActivityData(data.activityData || [])
        setStorageData(data.storageData || [])
        setPerformanceData(data.performanceData || [])
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (value: number, threshold: number) => {
    if (value >= threshold) return 'text-red-500'
    if (value >= threshold * 0.8) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = (value: number, threshold: number) => {
    if (value >= threshold) return <ArrowUp className="h-4 w-4 text-red-500" />
    if (value >= threshold * 0.8) return <Minus className="h-4 w-4 text-yellow-500" />
    return <ArrowDown className="h-4 w-4 text-green-500" />
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const COLORS = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Real-time system metrics and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-500">{metrics.activeUsers} active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Storage Used</CardTitle>
              <HardDrive className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(metrics.storageUsed)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>of {formatBytes(metrics.storageLimit)} limit</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Response Time</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
              <div className="flex items-center text-xs">
                {getStatusIcon(metrics.responseTime, 1000)}
                <span className={getStatusColor(metrics.responseTime, 1000)}>
                  {metrics.responseTime < 1000 ? 'Excellent' : metrics.responseTime < 2000 ? 'Good' : 'Slow'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">System Health</CardTitle>
              {metrics.errorsToday === 0 ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(metrics.uptime)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span>{metrics.errorsToday} errors today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Daily active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--zinc-50)', 
                        borderColor: 'var(--zinc-200)',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '600'
                      }} 
                    />
                    <Area type="monotone" dataKey="users" stroke="#18181b" fill="url(#colorUsers)" fillOpacity={1} />
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Distribution</CardTitle>
                <CardDescription>Storage usage by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={storageData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="usage"
                    >
                      {storageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
              <CardDescription>User activity and system usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--zinc-50)', 
                      borderColor: 'var(--zinc-200)',
                      borderRadius: '12px',
                      fontSize: '10px'
                    }} 
                  />
                  <Line type="monotone" dataKey="users" stroke="#18181b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="queries" stroke="#71717a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uploads" stroke="#a1a1aa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
                <CardDescription>Storage consumption by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={storageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                    <XAxis dataKey="provider" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--zinc-50)', 
                        borderColor: 'var(--zinc-200)',
                        borderRadius: '12px',
                        fontSize: '10px'
                      }} 
                    />
                    <Bar dataKey="usage" fill="#18181b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Count by Provider</CardTitle>
                <CardDescription>Number of files stored by each provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {storageData.map((item, index) => (
                    <div key={item.provider} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium capitalize">{item.provider}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{(item.files || 0).toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(item.usage || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Real-time performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} name="Response Time (ms)" />
                  <Line type="monotone" dataKey="memoryUsage" stroke="#82ca9d" strokeWidth={2} name="Memory Usage (%)" />
                  <Line type="monotone" dataKey="cpuUsage" stroke="#ffc658" strokeWidth={2} name="CPU Usage (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
