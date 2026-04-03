'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Badge } from './badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { formatDateTime } from '@/lib/date-formatters'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  User,
  Activity,
  Database,
  Settings,
  Users,
  FileText
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  old_value: any
  new_value: any
  ip_address: string
  user_agent: string
  created_at: string
  user_name: string
  user_email: string
}

interface AuditLogsResponse {
  data: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface AuditLogsProps {
  className?: string
}

export function AuditLogs({ className }: AuditLogsProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  })

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchAuditLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.action) params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/audit-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch audit logs')

      const data: AuditLogsResponse = await response.json()
      setAuditLogs(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [pagination.page, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      case 'UPDATE': return <Settings className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
      case 'DELETE': return <Database className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
      case 'LOGIN': return <User className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
      default: return <FileText className="h-3.5 w-3.5 text-zinc-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100/50 dark:border-emerald-900/30'
      case 'UPDATE': return 'bg-zinc-100/50 dark:bg-zinc-800/20 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-zinc-700/30'
      case 'DELETE': return 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-100/50 dark:border-rose-900/30'
      case 'LOGIN': return 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
    }
  }


  const exportLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.entityType) params.append('entityType', filters.entityType)
      if (filters.action) params.append('action', filters.action)
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/audit-logs/export?${params}`)
      if (!response.ok) throw new Error('Failed to export audit logs')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit logs')
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Track all system changes and user activities
              </CardDescription>
            </div>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="entityType" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Entity Type</Label>
              <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="SystemSettings">System Settings</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="DataModel">Data Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="action" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Action</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2 block">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{log.entity_type}</div>
                          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight uppercase">ID: {log.entity_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{log.user_name || 'Unknown'}</div>
                          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight uppercase">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatDateTime(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-mono">
                          {log.ip_address || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setShowDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              View detailed information about this audit log entry including all changes and metadata.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getActionIcon(selectedLog.action)}
                    <Badge className={getActionColor(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity Type</Label>
                  <div className="mt-1">{selectedLog.entity_type}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Entity ID</Label>
                  <div className="mt-1 font-mono text-sm">{selectedLog.entity_id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <div className="mt-1">
                    <div>{selectedLog.user_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{selectedLog.user_email}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <div className="mt-1">{formatDateTime(selectedLog.created_at)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <div className="mt-1 font-mono text-sm">{selectedLog.ip_address || 'Unknown'}</div>
                </div>
              </div>

              {selectedLog.old_value && (
                <div>
                  <Label className="text-sm font-medium">Previous Value</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <Label className="text-sm font-medium">New Value</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <div className="mt-1 text-sm font-mono break-all">{selectedLog.user_agent}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
