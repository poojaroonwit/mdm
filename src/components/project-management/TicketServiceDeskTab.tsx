'use client'

import type { ChangeEvent, Dispatch, KeyboardEvent, SetStateAction } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { showInfo } from '@/lib/toast-utils'
import { Clock, Edit, ExternalLink, GitBranch, Loader, MessageSquare, Paperclip, Trash2 } from 'lucide-react'
import { SearchableSelect } from './SearchableSelect'
import { searchServiceDeskTickets } from './ticket-detail-api'
import { getTicketSpaceId } from './ticket-detail-helpers'
import type {
  ServiceDeskAttachment,
  ServiceDeskComment,
  ServiceDeskTimeLog,
  TicketDetailTicket,
} from './ticket-detail-types'

type ServiceDeskTimeLogDraft = {
  hours: string
  minutes: string
  description: string
}

type ServiceDeskLinkDraft = {
  requestId: string
  linkType: string
}

interface TicketServiceDeskTabProps {
  ticket: TicketDetailTicket
  serviceDeskRequestId: string | null
  serviceDeskComments: ServiceDeskComment[]
  serviceDeskAttachments: ServiceDeskAttachment[]
  serviceDeskTimeLogs: ServiceDeskTimeLog[]
  syncingFromServiceDesk: boolean
  updatingServiceDesk: boolean
  deletingServiceDesk: boolean
  pushingToServiceDesk: boolean
  newServiceDeskComment: string
  setNewServiceDeskComment: (value: string) => void
  newServiceDeskResolution: string
  setNewServiceDeskResolution: (value: string) => void
  newServiceDeskTimeLog: ServiceDeskTimeLogDraft
  setNewServiceDeskTimeLog: Dispatch<SetStateAction<ServiceDeskTimeLogDraft>>
  newServiceDeskLink: ServiceDeskLinkDraft
  setNewServiceDeskLink: Dispatch<SetStateAction<ServiceDeskLinkDraft>>
  onUpdateServiceDeskTicket: () => void
  onSyncFromServiceDesk: () => void
  onDeleteServiceDeskTicket: () => void
  onAddServiceDeskComment: () => void
  onUploadServiceDeskAttachment: (event: ChangeEvent<HTMLInputElement>) => void
  onLogServiceDeskTime: () => void
  onSetServiceDeskResolution: () => void
  onLinkServiceDeskTickets: () => void
  onPushToServiceDesk: () => void
}

const serviceDeskLinkOptions = [
  { value: 'relates_to', label: 'Relates To' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'depends_on', label: 'Depends On' },
  { value: 'blocked_by', label: 'Blocked By' },
]

export function TicketServiceDeskTab({
  ticket,
  serviceDeskRequestId,
  serviceDeskComments,
  serviceDeskAttachments,
  serviceDeskTimeLogs,
  syncingFromServiceDesk,
  updatingServiceDesk,
  deletingServiceDesk,
  pushingToServiceDesk,
  newServiceDeskComment,
  setNewServiceDeskComment,
  newServiceDeskResolution,
  setNewServiceDeskResolution,
  newServiceDeskTimeLog,
  setNewServiceDeskTimeLog,
  newServiceDeskLink,
  setNewServiceDeskLink,
  onUpdateServiceDeskTicket,
  onSyncFromServiceDesk,
  onDeleteServiceDeskTicket,
  onAddServiceDeskComment,
  onUploadServiceDeskAttachment,
  onLogServiceDeskTime,
  onSetServiceDeskResolution,
  onLinkServiceDeskTickets,
  onPushToServiceDesk,
}: TicketServiceDeskTabProps) {
  const handleSearchKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !event.currentTarget.value) return

    const spaceId = getTicketSpaceId(ticket)
    if (!spaceId) return

    try {
      const data = await searchServiceDeskTickets(spaceId, event.currentTarget.value)
      showInfo(`Found ${data.total || 0} ticket(s)`)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  return (
    <TabsContent value="servicedesk" className="space-y-4 mt-4">
      <div className="space-y-4">
        {serviceDeskRequestId ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">ServiceDesk Request ID</div>
                    <div className="text-lg font-bold">{serviceDeskRequestId}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onUpdateServiceDeskTicket}
                      disabled={updatingServiceDesk}
                    >
                      {updatingServiceDesk ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 mr-2" />
                      )}
                      Update Ticket
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSyncFromServiceDesk}
                      disabled={syncingFromServiceDesk}
                    >
                      {syncingFromServiceDesk ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Sync from ServiceDesk
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDeleteServiceDeskTicket}
                      disabled={deletingServiceDesk}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingServiceDesk ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">ServiceDesk Comments</Label>
                <div className="space-y-2 mb-4">
                  {serviceDeskComments.map((comment, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="text-sm">{comment.content || comment.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {comment.created_time ? format(new Date(comment.created_time), 'MMM d, yyyy HH:mm') : ''}
                          {comment.technician?.name && ` by ${comment.technician.name}`}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment to ServiceDesk..."
                    value={newServiceDeskComment}
                    onChange={(event) => setNewServiceDeskComment(event.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={onAddServiceDeskComment} disabled={!newServiceDeskComment.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">ServiceDesk Attachments</Label>
                <div className="space-y-2 mb-4">
                  {serviceDeskAttachments.map((attachment, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{attachment.file_name || attachment.name}</div>
                            {attachment.file_size && (
                              <div className="text-xs text-muted-foreground">
                                {(attachment.file_size / 1024).toFixed(2)} KB
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Input type="file" onChange={onUploadServiceDeskAttachment} className="cursor-pointer" />
              </div>

              <div>
                <Label className="mb-2 block">ServiceDesk Time Logs</Label>
                <div className="space-y-2 mb-4">
                  {serviceDeskTimeLogs.map((log, index) => (
                    <Card key={index}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {log.hours || 0}h {log.minutes || 0}m
                            </div>
                            {log.description && (
                              <div className="text-sm text-muted-foreground mt-1">{log.description}</div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.technician?.name || log.created_by?.name}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.25"
                    placeholder="Hours"
                    value={newServiceDeskTimeLog.hours}
                    onChange={(event) =>
                      setNewServiceDeskTimeLog((current) => ({ ...current, hours: event.target.value }))
                    }
                    className="w-24"
                  />
                  <Input
                    type="number"
                    placeholder="Minutes"
                    value={newServiceDeskTimeLog.minutes}
                    onChange={(event) =>
                      setNewServiceDeskTimeLog((current) => ({ ...current, minutes: event.target.value }))
                    }
                    className="w-24"
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newServiceDeskTimeLog.description}
                    onChange={(event) =>
                      setNewServiceDeskTimeLog((current) => ({ ...current, description: event.target.value }))
                    }
                    className="flex-1"
                  />
                  <Button onClick={onLogServiceDeskTime} disabled={!newServiceDeskTimeLog.hours}>
                    <Clock className="h-4 w-4 mr-2" />
                    Log Time
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Set Resolution</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter resolution details..."
                    value={newServiceDeskResolution}
                    onChange={(event) => setNewServiceDeskResolution(event.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={onSetServiceDeskResolution} disabled={!newServiceDeskResolution.trim()}>
                    Set Resolution
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Link Tickets</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ServiceDesk Request ID"
                    value={newServiceDeskLink.requestId}
                    onChange={(event) =>
                      setNewServiceDeskLink((current) => ({ ...current, requestId: event.target.value }))
                    }
                    className="flex-1"
                  />
                  <SearchableSelect
                    value={newServiceDeskLink.linkType}
                    onValueChange={(value) => setNewServiceDeskLink((current) => ({ ...current, linkType: value }))}
                    options={serviceDeskLinkOptions}
                    searchPlaceholder="Search link types..."
                    className="w-40"
                  />
                  <Button onClick={onLinkServiceDeskTickets} disabled={!newServiceDeskLink.requestId}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Link
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Search ServiceDesk Tickets</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by subject, ID, or requester..."
                    id="servicedesk-search"
                    className="flex-1"
                    onKeyDown={handleSearchKeyDown}
                  />
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                This ticket has not been pushed to ServiceDesk yet.
              </p>
              <Button onClick={onPushToServiceDesk} disabled={pushingToServiceDesk}>
                {pushingToServiceDesk ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Push to ServiceDesk
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  )
}
