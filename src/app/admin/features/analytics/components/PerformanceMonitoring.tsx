'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Database, 
  Server, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Download,
  Eye,
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Trash2
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { PerformanceMetric, DatabaseMetric, Alert, PerformanceSettings } from '../types'

export function PerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetric[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [settings, setSettings] = useState<PerformanceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('1h')
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: 'cpu',
    threshold: 80,
    operator: 'gt' as const,
    severity: 'medium' as const,
    description: ''
  })

  useEffect(() => {
    loadMetrics()
    loadDbMetrics()
    loadAlerts()
    loadSettings()
  }, [timeRange])

  const loadMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/performance-metrics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics.map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDbMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/database-metrics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setDbMetrics(data.metrics.map((metric: any) => ({
          ...metric,
          timestamp: new Date(metric.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading database metrics:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/admin/performance-alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts.map((alert: any) => ({
          ...alert,
          lastTriggered: alert.lastTriggered ? new Date(alert.lastTriggered) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/performance-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const createAlert = async () => {
    try {
      const response = await fetch('/api/admin/performance-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      })

      if (response.ok) {
        toast.success('Alert created successfully')
        setShowCreateAlert(false)
        setNewAlert({
          name: '',
          metric: 'cpu',
          threshold: 80,
          operator: 'gt',
          severity: 'medium',
          description: ''
        })
        loadAlerts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create alert')
      }
    } catch (error) {
      console.error('Error creating alert:', error)
      toast.error('Failed to create alert')
    }
  }

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    try {
      const response = await fetch(`/api/admin/performance-alerts/${alertId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Alert deleted successfully')
        loadAlerts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete alert')
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
      toast.error('Failed to delete alert')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Performance Monitoring
          </h2>
          <p className="text-muted-foreground">
            Real-time system performance metrics and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(metrics[metrics.length - 1]?.cpuUsage || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>System load</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(metrics[metrics.length - 1]?.memoryUsage || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>RAM utilization</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(metrics[metrics.length - 1]?.responseTime || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>Average latency</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentage(metrics[metrics.length - 1]?.errorRate || 0)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 mr-1" />
                <span>Request failures</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>CPU, Memory, and Network usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpuUsage" stroke="#8884d8" strokeWidth={2} name="CPU %" />
                    <Line type="monotone" dataKey="memoryUsage" stroke="#82ca9d" strokeWidth={2} name="Memory %" />
                    <Line type="monotone" dataKey="diskUsage" stroke="#ffc658" strokeWidth={2} name="Disk %" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Metrics</CardTitle>
                <CardDescription>Response time and request rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="responseTime" stroke="#8884d8" fill="#8884d8" name="Response Time (ms)" />
                    <Area type="monotone" dataKey="requestsPerSecond" stroke="#82ca9d" fill="#82ca9d" name="Requests/sec" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>Query performance and connection metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={dbMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="queryTime" stroke="#8884d8" strokeWidth={2} name="Query Time (ms)" />
                  <Line type="monotone" dataKey="connections" stroke="#82ca9d" strokeWidth={2} name="Connections" />
                  <Line type="monotone" dataKey="slowQueries" stroke="#ffc658" strokeWidth={2} name="Slow Queries" />
                  <Line type="monotone" dataKey="cacheHitRate" stroke="#ff7300" strokeWidth={2} name="Cache Hit Rate %" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Alerts</h3>
            <Dialog open={showCreateAlert} onOpenChange={setShowCreateAlert}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Create Performance Alert</DialogTitle>
                  <DialogDescription>
                    Set up alerts for performance thresholds
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="p-6 pt-2 pb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input
                        id="alert-name"
                        value={newAlert.name}
                        onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                        placeholder="Enter alert name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="alert-metric">Metric</Label>
                        <Select value={newAlert.metric} onValueChange={(value: any) => setNewAlert({ ...newAlert, metric: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cpu">CPU Usage</SelectItem>
                            <SelectItem value="memory">Memory Usage</SelectItem>
                            <SelectItem value="disk">Disk Usage</SelectItem>
                            <SelectItem value="responseTime">Response Time</SelectItem>
                            <SelectItem value="errorRate">Error Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="alert-operator">Operator</Label>
                        <Select value={newAlert.operator} onValueChange={(value: any) => setNewAlert({ ...newAlert, operator: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gt">Greater Than</SelectItem>
                            <SelectItem value="lt">Less Than</SelectItem>
                            <SelectItem value="eq">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="alert-threshold">Threshold</Label>
                        <Input
                          id="alert-threshold"
                          type="number"
                          value={newAlert.threshold}
                          onChange={(e) => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="alert-severity">Severity</Label>
                        <Select value={newAlert.severity} onValueChange={(value: any) => setNewAlert({ ...newAlert, severity: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="alert-description">Description</Label>
                      <Textarea
                        id="alert-description"
                        value={newAlert.description}
                        onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                        placeholder="Alert description"
                        rows={3}
                      />
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="p-6 pt-2">
                  <Button variant="outline" onClick={() => setShowCreateAlert(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createAlert} disabled={!newAlert.name}>
                    Create Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <div className="font-medium">{alert.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.metric} {alert.operator} {alert.threshold}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Switch checked={alert.isActive} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-lg font-semibold">Performance Settings</h3>
          {settings && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={settings.monitoring.enabled} />
                    <Label>Enable Performance Monitoring</Label>
                  </div>
                  <div>
                    <Label htmlFor="monitoring-interval">Monitoring Interval (seconds)</Label>
                    <Input
                      id="monitoring-interval"
                      type="number"
                      value={settings.monitoring.interval}
                    />
                  </div>
                  <div>
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={settings.monitoring.retention}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={settings.alerts.enabled} />
                    <Label>Enable Alerts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={!!settings.alerts.email && settings.alerts.email.length > 0} />
                    <Label>Email Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={!!settings.alerts.webhook} />
                    <Label>Webhook Notifications</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cpu-threshold">CPU Threshold (%)</Label>
                      <Input
                        id="cpu-threshold"
                        type="number"
                        value={settings.thresholds.cpu}
                      />
                    </div>
                    <div>
                      <Label htmlFor="memory-threshold">Memory Threshold (%)</Label>
                      <Input
                        id="memory-threshold"
                        type="number"
                        value={settings.thresholds.memory}
                      />
                    </div>
                    <div>
                      <Label htmlFor="disk-threshold">Disk Threshold (%)</Label>
                      <Input
                        id="disk-threshold"
                        type="number"
                        value={settings.thresholds.disk}
                      />
                    </div>
                    <div>
                      <Label htmlFor="response-threshold">Response Time Threshold (ms)</Label>
                      <Input
                        id="response-threshold"
                        type="number"
                        value={settings.thresholds.responseTime}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
