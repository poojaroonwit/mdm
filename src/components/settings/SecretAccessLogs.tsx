'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ActionBadge } from '@/components/ui/action-badge'
import { CalendarIcon, Download, Filter, RefreshCw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface SecretAccessLog {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  action: 'READ' | 'CREATE' | 'DELETE'
  resourceType: string
  resourceId: string | null
  resourceName: string
  secretPath: string
  ipAddress: string | null
  userAgent: string | null
  metadata: {
    secretPath: string
    reason: string | null
    backend: 'vault' | 'database'
  } | null
  success: boolean
  timestamp: string
}

interface SecretAccessLogsProps {
  className?: string
}

export function SecretAccessLogs({ className }: SecretAccessLogsProps) {
  const [logs, setLogs] = useState<SecretAccessLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    secretPath: '',
    action: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    loadLogs()
  }, [pagination.page, filters])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (filters.userId) params.append('userId', filters.userId)
      if (filters.secretPath) params.append('secretPath', filters.secretPath)
      if (filters.action) params.append('action', filters.action)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)

      const response = await fetch(`/api/admin/secrets/access-logs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load audit logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
      console.error('Error loading secret access logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
  }

  const clearFilters = () => {
    setFilters({
      userId: '',
      secretPath: '',
      action: '',
      startDate: '',
      endDate: '',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Secret Path', 'IP Address', 'Reason', 'Backend'].join(','),
      ...logs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.userName || 'N/A',
        log.userEmail || 'N/A',
        log.action,
        log.secretPath,
        log.ipAddress || 'N/A',
        log.metadata?.reason || 'N/A',
        log.metadata?.backend || 'N/A',
      ].map(field => `"${field}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `secret-access-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const formatSecretPath = (path: string) => {
    // Extract readable name from path
    const parts = path.split('/')
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
    return path
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Secret Access Audit Logs</CardTitle>
            <CardDescription>
              Track all secret access operations for compliance and security
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secretPath">Secret Path</Label>
              <Input
                id="secretPath"
                placeholder="e.g., openai"
                value={filters.secretPath}
                onChange={(e) => handleFilterChange('secretPath', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => handleFilterChange('action', value)}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="User UUID"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Logs Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Secret Path</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Backend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.userName || 'System'}</div>
                          {log.userEmail && (
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} label={log.action} className="uppercase" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatSecretPath(log.secretPath)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.metadata?.reason || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.metadata?.backend || 'database'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

