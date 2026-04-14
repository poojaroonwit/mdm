'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
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
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Settings,
  Trash2,
  RotateCcw,
  Archive,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Database,
  Server,
  Globe,
  Zap,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { LogEntry, LogStats, LogFilter, LogRetention } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export function LogManagement() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [retention, setRetention] = useState<LogRetention[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [showRetentionDialog, setShowRetentionDialog] = useState(false)

  const [filters, setFilters] = useState<LogFilter>({
    search: '',
    level: 'all',
    service: 'all',
    dateRange: '24h',
    tags: []
  })

  const [newRetention, setNewRetention] = useState({
    service: '',
    level: '',
    retentionDays: 30
  })

  useEffect(() => {
    loadLogs()
    loadStats()
    loadRetention()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/log-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading log stats:', error)
    }
  }

  const loadRetention = async () => {
    try {
      const response = await fetch('/api/admin/log-retention')
      if (response.ok) {
        const data = await response.json()
        setRetention(data.retention.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })))
      }
    } catch (error) {
      console.error('Error loading retention policies:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.service.toLowerCase().includes(searchLower) ||
        log.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level)
    }

    if (filters.service !== 'all') {
      filtered = filtered.filter(log => log.service === filters.service)
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }

    // Date range filtering
    const now = new Date()
    const cutoff = new Date()
    switch (filters.dateRange) {
      case '1h':
        cutoff.setHours(now.getHours() - 1)
        break
      case '24h':
        cutoff.setDate(now.getDate() - 1)
        break
      case '7d':
        cutoff.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoff.setDate(now.getDate() - 30)
        break
    }
    filtered = filtered.filter(log => log.timestamp >= cutoff)

    setFilteredLogs(filtered)
  }

  const createRetention = async () => {
    try {
      const response = await fetch('/api/admin/log-retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRetention)
      })

      if (response.ok) {
        setShowRetentionDialog(false)
        setNewRetention({
          service: '',
          level: '',
          retentionDays: 30
        })
        loadRetention()
      }
    } catch (error) {
      console.error('Error creating retention policy:', error)
    }
  }

  const deleteRetention = async (retentionId: string) => {
    if (!confirm('Are you sure you want to delete this retention policy?')) return

    try {
      const response = await fetch(`/api/admin/log-retention/${retentionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadRetention()
      }
    } catch (error) {
      console.error('Error deleting retention policy:', error)
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `logs-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'INFO':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'FATAL':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG': return 'bg-zinc-100/50 dark:bg-zinc-800/20 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/30'
      case 'INFO': return 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100/50 dark:border-emerald-900/30'
      case 'WARN': return 'bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:amber-300 border-amber-100/50 dark:border-amber-900/30'
      case 'ERROR': return 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100/50 dark:border-rose-900/30'
      case 'FATAL': return 'bg-rose-900 dark:bg-rose-100 text-white dark:text-rose-950 border-transparent'
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/30'
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'api':
        return <Globe className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'auth':
        return <Zap className="h-4 w-4" />
      case 'cache':
        return <Activity className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-[0.2em] flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <FileText className="h-5 w-5" />
            Log Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Centralized log management, analysis, and retention policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Log Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {stats.errorRate.toFixed(1)}% error rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">
                {stats.byLevel.ERROR || 0} errors
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgResponseTime)}</div>
              <div className="text-xs text-muted-foreground">
                Response time
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Services</CardTitle>
              <Server className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byService).length}</div>
              <div className="text-xs text-muted-foreground">
                Active services
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="w-full">
      <Tabs defaultValue="logs">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block px-1">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Search messages, services..."
                      className="pl-9 h-9 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block px-1">Level</Label>
                  <Select value={filters.level} onValueChange={(value) => setFilters({ ...filters, level: value })}>
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Levels</SelectItem>
                      <SelectItem value="DEBUG" className="text-xs">DEBUG</SelectItem>
                      <SelectItem value="INFO" className="text-xs">INFO</SelectItem>
                      <SelectItem value="WARN" className="text-xs">WARN</SelectItem>
                      <SelectItem value="ERROR" className="text-xs">ERROR</SelectItem>
                      <SelectItem value="FATAL" className="text-xs">FATAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block px-1">Service</Label>
                  <Select value={filters.service} onValueChange={(value) => setFilters({ ...filters, service: value })}>
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Services</SelectItem>
                      {Object.keys(stats?.byService || {}).map(service => (
                        <SelectItem key={service} value={service} className="text-xs">{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block px-1">Range</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                    <SelectTrigger className="h-9 text-xs font-semibold">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h" className="text-xs">Last Hour</SelectItem>
                      <SelectItem value="24h" className="text-xs">Last 24 Hours</SelectItem>
                      <SelectItem value="7d" className="text-xs">Last 7 Days</SelectItem>
                      <SelectItem value="30d" className="text-xs">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 block px-1">User ID</Label>
                  <Input
                    value={filters.userId || ''}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                    placeholder="User correlation ID"
                    className="h-9 text-xs font-medium"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Log Entries</CardTitle>
                  <CardDescription>
                    {filteredLogs.length} of {logs.length} logs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {isLoading ? (
                  <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                    <p className="text-muted-foreground">
                      Adjust your filters to see log entries
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 p-4 border border-zinc-100/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer group"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getLevelIcon(log.level)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{log.service}</span>
                            <Badge className={cn("text-[8px] h-4 py-0 font-black", getLevelColor(log.level))}>
                              {log.level}
                            </Badge>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-auto">
                              {log.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {log.message}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {log.userId && (
                              <span>User: {log.userId}</span>
                            )}
                            {log.duration && (
                              <span>Duration: {formatDuration(log.duration)}</span>
                            )}
                            {log.tags.length > 0 && (
                              <div className="flex gap-1">
                                {log.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {log.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{log.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h3 className="text-lg font-semibold">Log Analytics</h3>
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logs by Level</CardTitle>
                  <CardDescription>Distribution of log levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.byLevel).map(([level, count]) => ({ level, count }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                      <XAxis dataKey="level" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--zinc-50)', 
                          borderColor: 'var(--zinc-200)',
                          borderRadius: '12px',
                          fontSize: '10px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Logs by Service</CardTitle>
                  <CardDescription>Log volume by service</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(stats.byService).map(([service, count]) => ({ service, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="service" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Logs Over Time</CardTitle>
                  <CardDescription>Log volume by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.byHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Retention Policies</h3>
            <Dialog open={showRetentionDialog} onOpenChange={setShowRetentionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Archive className="h-4 w-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
                <DialogContent className="p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Create Retention Policy</DialogTitle>
                    <DialogDescription>
                      Set up log retention policies for automatic cleanup
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody className="p-6 pt-2 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="retention-service">Service</Label>
                        <Input
                          id="retention-service"
                          value={newRetention.service}
                          onChange={(e) => setNewRetention({ ...newRetention, service: e.target.value })}
                          placeholder="Enter service name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="retention-level">Log Level</Label>
                        <Select value={newRetention.level} onValueChange={(value) => setNewRetention({ ...newRetention, level: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="DEBUG">DEBUG</SelectItem>
                            <SelectItem value="INFO">INFO</SelectItem>
                            <SelectItem value="WARN">WARN</SelectItem>
                            <SelectItem value="ERROR">ERROR</SelectItem>
                            <SelectItem value="FATAL">FATAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="retention-days">Retention Days</Label>
                        <Input
                          id="retention-days"
                          type="number"
                          value={newRetention.retentionDays}
                          onChange={(e) => setNewRetention({ ...newRetention, retentionDays: parseInt(e.target.value) })}
                          placeholder="30"
                        />
                      </div>
                    </div>
                  </DialogBody>
                  <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={() => setShowRetentionDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRetention} disabled={!newRetention.service}>
                      Create Policy
                    </Button>
                  </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {retention.map(policy => (
              <Card key={policy.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{policy.service}</div>
                      <div className="text-sm text-muted-foreground">
                        {policy.level} • {policy.retentionDays} days
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={(policy as any).isActive || false} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRetention(policy.id)}
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
          <h3 className="text-lg font-semibold">Log Settings</h3>
          <Card>
            <CardHeader>
              <CardTitle>Log Configuration</CardTitle>
              <CardDescription>
                Configure log collection and processing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch id="log-collection" />
                <Label htmlFor="log-collection">Enable Log Collection</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="log-aggregation" />
                <Label htmlFor="log-aggregation">Enable Log Aggregation</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="log-indexing" />
                <Label htmlFor="log-indexing">Enable Full-Text Indexing</Label>
              </div>
              <div>
                <Label htmlFor="log-buffer">Log Buffer Size</Label>
                <Input
                  id="log-buffer"
                  type="number"
                  placeholder="1000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="flex items-center gap-2">
                {getLevelIcon(selectedLog.level)}
                Log Details
              </DialogTitle>
              <DialogDescription>
                {selectedLog.service} • {selectedLog.timestamp.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="p-6 pt-2 pb-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Level:</span> 
                    <Badge className={`ml-2 ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Service:</span> {selectedLog.service}
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span> {selectedLog.timestamp.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(selectedLog.duration)}
                  </div>
                  {selectedLog.userId && (
                    <div>
                      <span className="font-medium">User ID:</span> {selectedLog.userId}
                    </div>
                  )}
                  {selectedLog.sessionId && (
                    <div>
                      <span className="font-medium">Session ID:</span> {selectedLog.sessionId}
                    </div>
                  )}
                </div>
                
                <div>
                  <span className="font-medium">Message:</span>
                  <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                    {selectedLog.message}
                  </div>
                </div>

                {Object.keys(selectedLog.context).length > 0 && (
                  <div>
                    <span className="font-medium">Context:</span>
                    <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                      <pre>{JSON.stringify(selectedLog.context, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {selectedLog.tags.length > 0 && (
                  <div>
                    <span className="font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedLog.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
