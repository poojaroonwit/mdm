'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Users,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Filter,
  Calendar,
  Target,
  PieChart,
  LineChart,
  AreaChart,
  Gauge,
  Thermometer,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

interface AnalyticsMetric {
  id: string
  name: string
  value: number
  previousValue: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  target?: number
  status: 'good' | 'warning' | 'critical'
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  threshold: {
    warning: number
    critical: number
  }
  status: 'good' | 'warning' | 'critical'
  description: string
}

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  userRetention: number
  averageSessionDuration: number
  bounceRate: number
  conversionRate: number
  deviceBreakdown: {
    desktop: number
    mobile: number
    tablet: number
  }
  browserBreakdown: {
    chrome: number
    firefox: number
    safari: number
    edge: number
    other: number
  }
  geographicBreakdown: {
    [country: string]: number
  }
}

interface PageAnalytics {
  pageId: string
  pageName: string
  views: number
  uniqueViews: number
  averageTimeOnPage: number
  bounceRate: number
  exitRate: number
  conversionRate: number
  loadTime: number
  performanceScore: number
  lastUpdated: string
}

interface AnalyticsDashboardProps {
  metrics: AnalyticsMetric[]
  performanceMetrics: PerformanceMetric[]
  userAnalytics: UserAnalytics
  pageAnalytics: PageAnalytics[]
  onRefreshData: () => void
  onExportData: (format: 'csv' | 'json' | 'pdf') => void
  onSetAlert: (metricId: string, threshold: number) => void
  onUpdateSettings: (settings: any) => void
}

export function AnalyticsDashboard({
  metrics,
  performanceMetrics,
  userAnalytics,
  pageAnalytics,
  onRefreshData,
  onExportData,
  onSetAlert,
  onUpdateSettings
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'users' | 'pages' | 'settings'>('overview')
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [alertThreshold, setAlertThreshold] = useState(80)

  const getTrendIcon = useCallback((trend: AnalyticsMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-primary" />
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />
      case 'stable': return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }, [])

  const getStatusColor = useCallback((status: AnalyticsMetric['status']) => {
    switch (status) {
      case 'good': return 'text-primary'
      case 'warning': return 'text-warning'
      case 'critical': return 'text-destructive'
    }
  }, [])

  const getPerformanceStatusSurfaceColor = useCallback((status: PerformanceMetric['status']) => {
    switch (status) {
      case 'good': return 'bg-primary/10 text-primary'
      case 'warning': return 'bg-warning/20 text-warning'
      case 'critical': return 'bg-destructive/10 text-destructive'
    }
  }, [])

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }, [])

  const formatPercentage = useCallback((num: number) => {
    return `${num.toFixed(1)}%`
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor performance, user behavior, and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onRefreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onExportData('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map(metric => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">{metric.name}</div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm ${getStatusColor(metric.status)}`}>
                    {metric.change > 0 ? '+' : ''}{formatPercentage(metric.change)}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatNumber(metric.value)} {metric.unit}
              </div>
              {metric.target && (
                <div className="text-xs text-muted-foreground">
                  Target: {formatNumber(metric.target)} {metric.unit}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'performance' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('performance')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Performance
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === 'pages' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('pages')}
        >
          <Eye className="h-4 w-4 mr-2" />
          Pages
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* All Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.map(metric => (
                  <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPerformanceStatusSurfaceColor(metric.status)}`}>
                        {metric.status === 'good' && <CheckCircle className="h-4 w-4" />}
                        {metric.status === 'warning' && <AlertTriangle className="h-4 w-4" />}
                        {metric.status === 'critical' && <XCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(metric.value)} {metric.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${getStatusColor(metric.status)}`}>
                        {metric.change > 0 ? '+' : ''}{formatPercentage(metric.change)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map(metric => (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <StatusBadge status={metric.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            metric.status === 'good' ? 'bg-primary' :
                            metric.status === 'warning' ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{
                            width: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {metric.value} {metric.unit}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceMetrics.map(metric => (
              <Card key={metric.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">{metric.name}</div>
                    <StatusBadge status={metric.status} />
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {metric.value} {metric.unit}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.description}
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Warning: {metric.threshold.warning}</span>
                      <span>Critical: {metric.threshold.critical}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          metric.status === 'good' ? 'bg-primary' :
                          metric.status === 'warning' ? 'bg-warning' : 'bg-destructive'
                        }`}
                        style={{
                          width: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(userAnalytics.totalUsers)}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(userAnalytics.activeUsers)}</div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(userAnalytics.newUsers)}</div>
                    <div className="text-sm text-muted-foreground">New Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(userAnalytics.averageSessionDuration)}</div>
                    <div className="text-sm text-muted-foreground">Avg. Session (min)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-medium">{formatPercentage(userAnalytics.deviceBreakdown.desktop)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-medium">{formatPercentage(userAnalytics.deviceBreakdown.mobile)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="h-4 w-4" />
                      <span>Tablet</span>
                    </div>
                    <span className="font-medium">{formatPercentage(userAnalytics.deviceBreakdown.tablet)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(userAnalytics.geographicBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span>{country}</span>
                        <span className="font-medium">{formatNumber(count)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-4">
          {pageAnalytics.map(page => (
            <Card key={page.pageId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {page.pageName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Views</div>
                    <div className="text-lg font-semibold">{formatNumber(page.views)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Unique Views</div>
                    <div className="text-lg font-semibold">{formatNumber(page.uniqueViews)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Avg. Time</div>
                    <div className="text-lg font-semibold">{page.averageTimeOnPage}s</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Bounce Rate</div>
                    <div className="text-lg font-semibold">{formatPercentage(page.bounceRate)}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Load Time</div>
                    <div className="text-lg font-semibold">{page.loadTime}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Performance Score</div>
                    <div className="text-lg font-semibold">{page.performanceScore}/100</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    <div className="text-lg font-semibold">{formatPercentage(page.conversionRate)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Analytics Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
                <div className="space-y-4">
                  {metrics.map(metric => (
                    <div key={metric.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {formatNumber(metric.value)} {metric.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[alertThreshold]}
                          onValueChange={(value) => setAlertThreshold(value[0])}
                          min={0}
                          max={100}
                          step={5}
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground w-12">{alertThreshold}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSetAlert(metric.id, alertThreshold)}
                        >
                          Set Alert
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Data Collection</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">User Analytics</div>
                      <div className="text-sm text-muted-foreground">Collect user behavior data</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Performance Monitoring</div>
                      <div className="text-sm text-muted-foreground">Monitor page performance</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Error Tracking</div>
                      <div className="text-sm text-muted-foreground">Track and report errors</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
