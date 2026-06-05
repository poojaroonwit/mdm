'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActionBadge } from '@/components/ui/action-badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatTimestamp } from '@/lib/date-formatters'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Edit, 
  Trash2,
  Mail,
  Clock,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AuditLogEntry {
  id: string
  user_id: string
  user_name: string
  user_email: string
  action: string
  description: string
  metadata: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface MemberAuditLogProps {
  spaceId: string
  auditLogs: AuditLogEntry[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

const ACTION_ICONS = {
  'member_added': <UserPlus className="h-4 w-4 text-primary" />,
  'member_removed': <UserMinus className="h-4 w-4 text-destructive" />,
  'role_changed': <Shield className="h-4 w-4 text-primary" />,
  'permissions_updated': <Edit className="h-4 w-4 text-primary" />,
  'invitation_sent': <Mail className="h-4 w-4 text-warning" />,
  'invitation_accepted': <UserPlus className="h-4 w-4 text-primary" />,
  'space_accessed': <Clock className="h-4 w-4 text-muted-foreground" />,
  'default': <AlertTriangle className="h-4 w-4 text-muted-foreground" />
}

export function MemberAuditLog({
  spaceId,
  auditLogs,
  loading = false,
  onLoadMore,
  hasMore = false
}: MemberAuditLogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    
    const matchesDate = (() => {
      if (dateFilter === 'all') return true
      const logDate = new Date(log.created_at)
      const now = new Date()
      
      switch (dateFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString()
        case 'week':
          return logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
          return logDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        default:
          return true
      }
    })()
    
    return matchesSearch && matchesAction && matchesDate
  })

  const exportAuditLog = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Description', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.user_name,
        log.action,
        log.description,
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${spaceId}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action as keyof typeof ACTION_ICONS] || ACTION_ICONS.default
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Member Audit Log
              </CardTitle>
              <CardDescription>
                Track all member-related activities and changes in this space.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={exportAuditLog}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit log..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="member_added">Member Added</SelectItem>
                  <SelectItem value="member_removed">Member Removed</SelectItem>
                  <SelectItem value="role_changed">Role Changed</SelectItem>
                  <SelectItem value="permissions_updated">Permissions Updated</SelectItem>
                  <SelectItem value="invitation_sent">Invitation Sent</SelectItem>
                  <SelectItem value="invitation_accepted">Invitation Accepted</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Audit Log Entries */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit log entries found</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted">
                  <div className="flex-shrink-0">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={log.user_email} />
                        <AvatarFallback>
                          {log.user_name ? log.user_name[0].toUpperCase() : log.user_email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{log.user_name}</span>
                      <ActionBadge action={log.action} label={log.action.replace('_', ' ')} />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {log.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatTimestamp(log.created_at)}</span>
                      {log.ip_address && (
                        <span>IP: {log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
