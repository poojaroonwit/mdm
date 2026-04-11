'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Database,
  RefreshCw,
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface UsageStats {
  tickets?: {
    total: number
    created_recent: number
    updated_recent: number
    creators: number
    status_count: number
  }
  reports?: {
    total: number
    created_recent: number
    creators: number
    source_types: number
  }
  dashboards?: {
    total: number
    created_recent: number
    creators: number
    active: number
  }
  workflows?: {
    total: number
    created_recent: number
    creators: number
    status_count: number
  }
}

interface UserActivity {
  userId: string
  name: string
  email: string
  activeDays: number
  totalActions: number
  lastActivity: string
}

interface SpaceUsage {
  spaceId: string
  name: string
  ticketCount: number
  reportCount: number
  memberCount: number
}

export function UsageTrackingDashboard() {
  const [usageStats, setUsageStats] = useState<UsageStats>({})
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [spaceUsage, setSpaceUsage] = useState<SpaceUsage[]>([])
  const [timeRange, setTimeRange] = useState('7d')
  const [resourceType, setResourceType] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsageTracking()
  }, [timeRange, resourceType])

  const loadUsageTracking = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        range: timeRange,
        ...(resourceType !== 'all' && { resourceType }),
      })
      const response = await fetch(`/api/admin/usage-tracking?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsageStats(data.usageStats || {})
        setUserActivity(data.userActivity || [])
        setSpaceUsage(data.spaceUsage || [])
      }
    } catch (error) {
      console.error('Error loading usage tracking:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Usage Tracking</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Track resource usage and user activity across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadUsageTracking} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Resource Type Filter */}
      <div className="flex items-center gap-2">
        <Select value={resourceType} onValueChange={setResourceType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="tickets">Tickets</SelectItem>
            <SelectItem value="reports">Reports</SelectItem>
            <SelectItem value="dashboards">Dashboards</SelectItem>
            <SelectItem value="workflows">Workflows</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Usage Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {usageStats.tickets && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Tickets</CardTitle>
              <FileText className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.tickets.total}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats.tickets.created_recent} created in period
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{usageStats.tickets.creators} creators</Badge>
                <Badge variant="outline">{usageStats.tickets.status_count} statuses</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {usageStats.reports && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Reports</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.reports.total}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats.reports.created_recent} created in period
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{usageStats.reports.creators} creators</Badge>
                <Badge variant="outline">{usageStats.reports.source_types} source types</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {usageStats.dashboards && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Dashboards</CardTitle>
              <BarChart3 className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.dashboards.total}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats.dashboards.active} active
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{usageStats.dashboards.creators} creators</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {usageStats.workflows && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Workflows</CardTitle>
              <Activity className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.workflows.total}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats.workflows.created_recent} created in period
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline">{usageStats.workflows.creators} creators</Badge>
                <Badge variant="outline">{usageStats.workflows.status_count} statuses</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Activity and Space Usage */}
      <div className="space-y-4">
        <Tabs defaultValue="users">
          <TabsList>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="spaces">Space Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Active Users</CardTitle>
              <CardDescription>
                Users with the most activity in the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No user activity data available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userActivity.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-4 border border-zinc-100/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                            <Users className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name || user.email}</p>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.totalActions}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">ACTIONS</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{user.activeDays}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">DAYS</p>
                          </div>
                          <div className="px-3 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100/60 dark:border-zinc-800/60 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            {new Date(user.lastActivity).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Space Usage</CardTitle>
              <CardDescription>
                Resource usage across different spaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spaceUsage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No space usage data available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {spaceUsage.map((space) => (
                      <div
                        key={space.spaceId}
                        className="flex items-center justify-between p-4 border border-zinc-100/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-md">
                            <Database className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{space.name}</p>
                            <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">ID: {space.spaceId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{space.ticketCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">TICKETS</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{space.reportCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">REPORTS</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{space.memberCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">MEMBERS</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

