'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus,
  Eye,
  History,
  Search
} from 'lucide-react'
import {
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { ChangeRequest } from '../types'

export function ChangeRequests() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newRequest, setNewRequest] = useState({
    title: '',
    changeType: 'ALTER_TABLE',
    sqlStatement: '',
    rollbackSql: ''
  })

  useEffect(() => {
    loadChangeRequests()
  }, [])

  const loadChangeRequests = async () => {
    try {
      const response = await fetch('/api/db/change-requests')
      if (response.ok) {
        const data = await response.json()
        setChangeRequests(data.changeRequests || data || [])
      }
    } catch (error) {
      console.error('Failed to load change requests:', error)
      toast.error('Failed to load change requests')
    } finally {
      setLoading(false)
    }
  }

  const createChangeRequest = async () => {
    if (!newRequest.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!newRequest.sqlStatement.trim()) {
      toast.error('SQL statement is required')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/db/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      })

      if (response.ok) {
        toast.success('Change request created')
        setShowCreateDialog(false)
        setNewRequest({ title: '', changeType: 'ALTER_TABLE', sqlStatement: '', rollbackSql: '' })
        loadChangeRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create change request')
      }
    } catch (error) {
      console.error('Failed to create change request:', error)
      toast.error('Failed to create change request')
    } finally {
      setSubmitting(false)
    }
  }

  const approveRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/db/change-requests/${id}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Change request approved')
        loadChangeRequests()
      } else {
        toast.error('Failed to approve change request')
      }
    } catch (error) {
      console.error('Failed to approve change request:', error)
      toast.error('Failed to approve change request')
    }
  }

  const rejectRequest = async (id: string) => {
    if (!confirm('Are you sure you want to reject this change request?')) {
      return
    }

    try {
      const response = await fetch(`/api/db/change-requests/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by user' })
      })

      if (response.ok) {
        toast.success('Change request rejected')
        loadChangeRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject change request')
      }
    } catch (error) {
      console.error('Failed to reject change request:', error)
      toast.error('Failed to reject change request')
    }
  }

  const mergeRequest = async (id: string) => {
    if (!confirm('Are you sure you want to merge this change request? This will execute the SQL statement.')) {
      return
    }

    try {
      const response = await fetch(`/api/db/change-requests/${id}/merge`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Change request merged successfully')
        loadChangeRequests()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to merge change request')
      }
    } catch (error) {
      console.error('Failed to merge change request:', error)
      toast.error('Failed to merge change request')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      merged: 'default'
    }

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle2 className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
      merged: <CheckCircle2 className="w-3 h-3" />
    }

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center gap-1">
        {icons[status]}
        {status.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading change requests...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="w-8 h-8" />
            Change Requests
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage database change approval workflows
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Change Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Create Change Request</DialogTitle>
              <DialogDescription>
                Submit a database change for approval
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="p-6 pt-2 pb-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="e.g., Add email index to users table"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Change Type</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newRequest.changeType}
                    onChange={(e) => setNewRequest({ ...newRequest, changeType: e.target.value })}
                  >
                    <option value="CREATE_TABLE">Create Table</option>
                    <option value="ALTER_TABLE">Alter Table</option>
                    <option value="DROP_TABLE">Drop Table</option>
                    <option value="CREATE_INDEX">Create Index</option>
                    <option value="DROP_INDEX">Drop Index</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">SQL Statement</label>
                  <Textarea
                    value={newRequest.sqlStatement}
                    onChange={(e) => setNewRequest({ ...newRequest, sqlStatement: e.target.value })}
                    placeholder="CREATE INDEX idx_users_email ON users(email);"
                    rows={5}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rollback SQL (Optional)</label>
                  <Textarea
                    value={newRequest.rollbackSql}
                    onChange={(e) => setNewRequest({ ...newRequest, rollbackSql: e.target.value })}
                    placeholder="DROP INDEX idx_users_email;"
                    rows={3}
                    className="font-mono"
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createChangeRequest} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search change requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="merged">Merged</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {(['all', 'pending', 'approved', 'merged', 'rejected'] as const).map((statusFilter) => {
          let filteredRequests = statusFilter === 'all' 
            ? changeRequests 
            : changeRequests.filter(r => r.status === statusFilter)
          
          // Apply search filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filteredRequests = filteredRequests.filter(r => 
              r.title.toLowerCase().includes(query) ||
              r.changeType.toLowerCase().includes(query) ||
              r.sqlStatement.toLowerCase().includes(query) ||
              (r.requestedByName || '').toLowerCase().includes(query)
            )
          }
          
          return (
            <TabsContent key={statusFilter} value={statusFilter} className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GitBranch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No {statusFilter === 'all' ? '' : statusFilter} change requests found</p>
                    {statusFilter === 'all' && (
                      <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Change Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {request.title}
                        {getStatusBadge(request.status)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {request.changeType} • Created by {request.requestedByName || request.requestedBy} • {new Date(request.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => approveRequest(request.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => rejectRequest(request.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button size="sm" onClick={() => mergeRequest(request.id)}>
                          <GitBranch className="w-4 h-4 mr-1" />
                          Merge
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">SQL Statement</label>
                      <pre className="mt-1 p-3 bg-muted rounded text-sm overflow-x-auto">
                        {request.sqlStatement}
                      </pre>
                    </div>
                    {request.rollbackSql && (
                      <div>
                        <label className="text-sm font-medium">Rollback SQL</label>
                        <pre className="mt-1 p-3 bg-muted rounded text-sm overflow-x-auto">
                          {request.rollbackSql}
                        </pre>
                      </div>
                    )}
                    {request.approvals && request.approvals.length > 0 && (
                      <div>
                        <label className="text-sm font-medium flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Approval History
                        </label>
                        <div className="mt-2 space-y-2">
                          {request.approvals.map((approval, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {approval.approved ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span>{approval.approved ? 'Approved' : 'Rejected'}</span>
                              <span className="text-muted-foreground">
                                by {approval.userId} at {new Date(approval.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                ))
              )}
            </TabsContent>
          )
        })}
      </Tabs>
      </div>
    </div>
  )
}

