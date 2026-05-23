'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Loader2,
  ExternalLink,
  Eye,
} from 'lucide-react'
import { showError, showSuccess, showInfo } from '@/lib/toast-utils'
import { format } from 'date-fns'

interface IntakeSubmission {
  id: string
  data: Record<string, any>
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED'
  ticketId?: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string | null
    email: string
    avatar?: string | null
  } | null
  form?: {
    id: string
    name: string
    formFields: any[]
  }
}

interface IntakeSubmissionListProps {
  formId: string
  spaceId?: string
  onClose?: () => void
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-500',
    variant: 'secondary' as const,
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    color: 'bg-green-500',
    variant: 'default' as const,
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-500',
    variant: 'destructive' as const,
  },
  CONVERTED: {
    label: 'Converted',
    icon: FileText,
    color: 'bg-blue-500',
    variant: 'default' as const,
  },
}

export function IntakeSubmissionList({ formId, onClose }: IntakeSubmissionListProps) {
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<IntakeSubmission | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false)
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    loadSubmissions()
  }, [formId, statusFilter])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const url = statusFilter
        ? `/api/intake-forms/${formId}/submissions?status=${statusFilter}`
        : `/api/intake-forms/${formId}/submissions`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
      showError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/intake-submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        showSuccess('Submission status updated')
        loadSubmissions()
      } else {
        const result = await response.json()
        showError(result.error || 'Failed to update status')
      }
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred')
    }
  }

  const handleConvert = async (spaceId: string, title?: string, description?: string, priority?: string) => {
    if (!selectedSubmission) return

    setConverting(true)
    try {
      const response = await fetch(`/api/intake-submissions/${selectedSubmission.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          title,
          description,
          priority,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        showSuccess('Submission converted to ticket successfully')
        setIsConvertDialogOpen(false)
        setSelectedSubmission(null)
        loadSubmissions()
      } else {
        showError(result.error || 'Failed to convert submission')
      }
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred')
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground text-center">
              Submissions will appear here once users submit the form
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const statusInfo = statusConfig[submission.status]
            const StatusIcon = statusInfo.icon
            const submissionData = submission.data as any
            const title = submissionData.title || submissionData.subject || submissionData.name || 'Untitled Submission'

            return (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{title}</h3>
                        <Badge variant={statusInfo.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        {submission.user && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={submission.user.avatar || undefined} />
                              <AvatarFallback>
                                {submission.user.name?.[0] || submission.user.email[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{submission.user.name || submission.user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        {submission.ticketId && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Converted to ticket</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        {Object.entries(submissionData).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <span className="font-medium">{key}:</span>{' '}
                            <span className="text-muted-foreground">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {submission.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(submission.id, 'APPROVED')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setIsConvertDialogOpen(true)
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Convert
                          </Button>
                        </>
                      )}
                      {submission.status !== 'CONVERTED' && (
                        <Select
                          value={submission.status}
                          onValueChange={(value) => handleStatusChange(submission.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Submission Detail Dialog */}
      {selectedSubmission && !isConvertDialogOpen && (
        <Dialog open={!!selectedSubmission} onOpenChange={(open) => {
          if (!open) setSelectedSubmission(null)
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant={statusConfig[selectedSubmission.status].variant}>
                  {statusConfig[selectedSubmission.status].label}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Submitted By</h3>
                {selectedSubmission.user ? (
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={selectedSubmission.user.avatar || undefined} />
                      <AvatarFallback>
                        {selectedSubmission.user.name?.[0] || selectedSubmission.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div>{selectedSubmission.user.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{selectedSubmission.user.email}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Anonymous</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Submitted Data</h3>
                <div className="space-y-2">
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="border rounded p-2">
                      <div className="font-medium text-sm mb-1">{key}</div>
                      <div className="text-sm text-muted-foreground">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Submitted: {format(new Date(selectedSubmission.createdAt), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
            <DialogFooter className="justify-end">
              {selectedSubmission.status === 'PENDING' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange(selectedSubmission.id, 'APPROVED')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSubmission(null)
                      setIsConvertDialogOpen(true)
                    }}
                  >
                    Convert to Ticket
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Convert to Ticket Dialog */}
      {isConvertDialogOpen && selectedSubmission && (
        <ConvertToTicketDialog
          submission={selectedSubmission}
          onConvert={handleConvert}
          onCancel={() => {
            setIsConvertDialogOpen(false)
            setSelectedSubmission(null)
          }}
          loading={converting}
        />
      )}
    </div>
  )
}

interface ConvertToTicketDialogProps {
  submission: IntakeSubmission
  onConvert: (spaceId: string, title?: string, description?: string, priority?: string) => void
  onCancel: () => void
  loading: boolean
}

function ConvertToTicketDialog({ submission, onConvert, onCancel, loading }: ConvertToTicketDialogProps) {
  const [spaceId, setSpaceId] = useState('')
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string }>>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('MEDIUM')

  useEffect(() => {
    loadSpaces()
    // Pre-fill from submission data
    const data = submission.data as any
    setTitle(data.title || data.subject || data.name || '')
    setDescription(data.description || data.message || '')
  }, [])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
        if (data.spaces && data.spaces.length > 0) {
          setSpaceId(data.spaces[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Space</Label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ticket title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ticket description"
              rows={4}
            />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConvert(spaceId, title, description, priority)}
            disabled={loading || !spaceId}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Convert to Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
