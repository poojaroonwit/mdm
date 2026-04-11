"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date-formatters'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  FileText, 
  HardDrive, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Upload,
  Calendar,
  PieChart as PieChartIcon
} from 'lucide-react'
import { getStorageProviderIcon } from '@/lib/storage-provider-icons'

interface FileAnalyticsProps {
  spaceId: string
}

interface AnalyticsData {
  period: string
  dateRange: {
    from: string
    to: string
  }
  statistics: {
    totalFiles: number
    totalSize: number
    uniqueUploaders: number
    avgFileSize: number
    earliestUpload: string
    latestUpload: string
  }
  fileTypes: Array<{
    mimeType: string
    count: number
    totalSize: number
  }>
  trends: Array<{
    date: string
    uploads: number
    sizeUploaded: number
  }>
  topUploaders: Array<{
    id: string
    name: string
    email: string
    fileCount: number
    totalSize: number
  }>
  storageUsage: Array<{
    provider: string
    fileCount: number
    totalSize: number
  }>
  quota: {
    files: {
      current: number
      max: number
      percentage: number
      isWarning: boolean
    }
    size: {
      current: number
      max: number
      percentage: number
      isWarning: boolean
    }
  }
}

const COLORS = ['#1e40af', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

export function FileAnalytics({ spaceId }: FileAnalyticsProps) {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    if (spaceId && session?.user?.id) {
      fetchAnalytics()
    }
  }, [spaceId, period, session?.user?.id])

  const fetchAnalytics = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/files/analytics?spaceId=${spaceId}&period=${period}`, {
        headers: {
          'x-user-id': session.user.id
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">File Analytics</h2>
          <p className="text-muted-foreground">
            {formatDate(analytics.dateRange.from.toString())} - {formatDate(analytics.dateRange.to.toString())}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.statistics.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.statistics.uniqueUploaders} unique uploaders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(analytics.statistics.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatFileSize(analytics.statistics.avgFileSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quota.size.percentage}%</div>
            <Progress 
              value={analytics.quota.size.percentage} 
              className={analytics.quota.size.isWarning ? 'bg-red-100' : ''}
            />
            {analytics.quota.size.isWarning && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Storage limit warning
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File Limit</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quota.files.percentage}%</div>
            <Progress 
              value={analytics.quota.files.percentage} 
              className={analytics.quota.files.isWarning ? 'bg-red-100' : ''}
            />
            {analytics.quota.files.isWarning && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                File limit warning
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="w-full">
      <Tabs defaultValue="trends">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Upload Trends</TabsTrigger>
          <TabsTrigger value="types">File Types</TabsTrigger>
          <TabsTrigger value="users">Top Users</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'uploads' ? value : formatFileSize(Number(value)),
                      name === 'uploads' ? 'Files' : 'Size'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#1e40af" 
                    strokeWidth={2}
                    name="uploads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sizeUploaded" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="sizeUploaded"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>File Types by Count</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.fileTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => entry ? `${entry.mimeType?.split('/')[0] || ''}: ${entry.count || 0}` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.fileTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Types by Size</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.fileTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="mimeType" 
                      tickFormatter={(value) => value.split('/')[0]}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatFileSize(Number(value)), 'Size']}
                    />
                    <Bar dataKey="totalSize" fill="#1e40af" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Uploaders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topUploaders.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{user.fileCount} files</p>
                      <p className="text-sm text-muted-foreground">{formatFileSize(user.totalSize)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage by Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.storageUsage.map((provider, index) => (
                  <div key={provider.provider} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {getStorageProviderIcon(provider.provider, "h-4 w-4")}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{provider.provider}</p>
                        <p className="text-sm text-muted-foreground">{provider.fileCount} files</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatFileSize(provider.totalSize)}</p>
                      <p className="text-sm text-muted-foreground">
                        {((provider.totalSize / analytics.statistics.totalSize) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
