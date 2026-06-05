'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Clock, 
  TrendingUp, TrendingDown, BarChart3, RefreshCw, Bell, Database
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncStats {
  total_schedules: number
  active_schedules: number
  completed_today: number
  failed_today: number
  running_now: number
  total_records_today: number
  avg_duration_ms: number
}

interface SyncAlert {
  id: string
  sync_schedule_id: string
  schedule_name: string
  alert_type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  created_at: string
  acknowledged: boolean
}

interface RecentExecution {
  id: string
  schedule_name: string
  status: string
  started_at: string
  completed_at?: string
  records_fetched: number
  records_inserted: number
  records_updated: number
  records_failed: number
  duration_ms: number
  error_message?: string
}

interface SyncMonitoringDashboardProps {
  spaceId: string
}

export function SyncMonitoringDashboard({ spaceId }: SyncMonitoringDashboardProps) {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [alerts, setAlerts] = useState<SyncAlert[]>([])
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboardData = async () => {
    try {
      setRefreshing(true)
      
      // Load stats
      const statsRes = await fetch(`/api/data-sync-schedules/stats?space_id=${spaceId}`)
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Load alerts
      const alertsRes = await fetch(`/api/data-sync-schedules/alerts?space_id=${spaceId}`)
      const alertsData = await alertsRes.json()
      setAlerts(alertsData.alerts || [])

      // Load recent executions
      const execRes = await fetch(`/api/data-sync-schedules/recent-executions?space_id=${spaceId}`)
      const execData = await execRes.json()
      setRecentExecutions(execData.executions || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [spaceId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'RUNNING':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === 'critical' || a.severity === 'error')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sync Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring of data synchronization</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_schedules}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_schedules} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed_today}</div>
              <p className="text-xs text-muted-foreground">
                {stats.failed_today} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_records_today.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.avg_duration_ms / 1000)}s
              </div>
              <p className="text-xs text-muted-foreground">
                Average execution time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts ({criticalAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded border border-red-200">
                  <StatusBadge status={alert.severity} label={alert.severity.toUpperCase()} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.schedule_name}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <div className="space-y-4">
      <Tabs defaultValue="executions">
        <TabsList>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {unacknowledgedAlerts.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {unacknowledgedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Latest sync execution history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExecutions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-medium">{exec.schedule_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(exec.status)}
                          <span className="capitalize">{exec.status.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Fetched: {exec.records_fetched}</div>
                          <div className="text-muted-foreground">
                            Inserted: {exec.records_inserted} | Updated: {exec.records_updated}
                            {exec.records_failed > 0 && (
                              <span className="text-red-600"> | Failed: {exec.records_failed}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{Math.round(exec.duration_ms / 1000)}s</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentExecutions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No executions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Sync anomalies and issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unacknowledgedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <StatusBadge status={alert.severity} label={alert.severity.toUpperCase()} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{alert.schedule_name}</p>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {unacknowledgedAlerts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>No active alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Analytics</CardTitle>
              <CardDescription>Performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Analytics charts coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

