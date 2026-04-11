'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  Database,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Eye,
  Trash2,
  Edit,
  Plus,
  ArrowUpDown
} from 'lucide-react'
import { AuditLog } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

interface LogFilters {
  search: string
  action: string
  resourceType: string
  status: string
  severity: string
  spaceId: string
  dateRange: string
  userId: string
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    action: 'all',
    resourceType: 'all',
    status: 'all',
    severity: 'all',
    spaceId: 'all',
    dateRange: '7d',
    userId: ''
  })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadAuditLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filters])

  const loadAuditLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/audit-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.resource.toLowerCase().includes(searchLower) ||
        log.userName.toLowerCase().includes(searchLower) ||
        log.ipAddress.toLowerCase().includes(searchLower)
      )
    }

    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    if (filters.resourceType !== 'all') {
      filtered = filtered.filter(log => log.resourceType === filters.resourceType)
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(log => log.status === filters.status)
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(log => log.severity === filters.severity)
    }

    if (filters.spaceId !== 'all') {
      filtered = filtered.filter(log => log.spaceId === filters.spaceId)
    }

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof AuditLog]
      const bValue = b[sortBy as keyof AuditLog]
      
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredLogs(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const exportLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />
      case 'create':
      case 'update':
      case 'delete':
        return <Edit className="h-4 w-4" />
      case 'upload':
      case 'download':
        return <FileText className="h-4 w-4" />
      case 'settings':
        return <Settings className="h-4 w-4" />
      case 'query':
        return <Database className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Audit Logs
          </h2>
          <p className="text-muted-foreground">
            Complete activity tracking and security event logging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAuditLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search logs..."
                className="pl-8"
              />
            </div>
            
            <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="upload">Upload</SelectItem>
                <SelectItem value="download">Download</SelectItem>
                <SelectItem value="query">Query</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                {filteredLogs.length} of {logs.length} logs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timestamp">Timestamp</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="userName">User</SelectItem>
                  <SelectItem value="severity">Severity</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
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
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  Adjust your filters to see audit logs
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-muted-foreground">on</span>
                        <span className="font-medium">{log.resource}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.resourceType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp.toLocaleString()}
                        </span>
                        {log.spaceName && (
                          <span>{log.spaceName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Log Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Action:</span> {selectedLog.action}
              </div>
              <div>
                <span className="font-medium">Resource:</span> {selectedLog.resource}
              </div>
              <div>
                <span className="font-medium">User:</span> {selectedLog.userName}
              </div>
              <div>
                <span className="font-medium">Timestamp:</span> {selectedLog.timestamp.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">IP Address:</span> {selectedLog.ipAddress}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge className="ml-2" variant={selectedLog.status === 'success' ? 'default' : 'destructive'}>
                  {selectedLog.status}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="font-medium">User Agent:</span>
              <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                {selectedLog.userAgent}
              </div>
            </div>

            {Object.keys(selectedLog.details).length > 0 && (
              <div>
                <span className="font-medium">Additional Details:</span>
                <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                  <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
