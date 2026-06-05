'use client'

import type { Dispatch, SetStateAction } from 'react'
import { format } from 'date-fns'
import { Download, GitBranch, MessageSquare, Paperclip, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TicketRelationshipGraph } from './TicketRelationshipGraph'
import { TicketRelationshipsPanel } from './TicketRelationshipsPanel'
import type {
  TicketAttachment,
  TicketComment,
  TicketDependencies,
  TicketDetailTicket,
  TicketSubtask,
  TicketTimeLog,
} from './ticket-detail-types'

export function CommentsTab({
  comments,
  newComment,
  setNewComment,
  onAddComment,
}: {
  comments: TicketComment[]
  newComment: string
  setNewComment: Dispatch<SetStateAction<string>>
  onAddComment: () => void
}) {
  return (
    <TabsContent value="comments" className="space-y-4 mt-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author?.avatar || undefined} />
                  <AvatarFallback>
                    {comment.author?.name?.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.author?.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex gap-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            className="flex-1"
          />
          <Button onClick={onAddComment} disabled={!newComment.trim()}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Comment
          </Button>
        </div>
      </div>
    </TabsContent>
  )
}

export function AttachmentsTab({
  attachments,
  onUploadAttachment,
}: {
  attachments: TicketAttachment[]
  onUploadAttachment: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <TabsContent value="attachments" className="space-y-4 mt-4">
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <Card key={attachment.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">{attachment.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {(attachment.fileSize / 1024).toFixed(2)} KB
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        <div>
          <Input
            type="file"
            onChange={onUploadAttachment}
            className="cursor-pointer"
          />
        </div>
      </div>
    </TabsContent>
  )
}

export function SubtasksTab({
  subtasks,
  newSubtask,
  setNewSubtask,
  onAddSubtask,
  onToggleSubtaskStatus,
}: {
  subtasks: TicketSubtask[]
  newSubtask: { title: string; status: string }
  setNewSubtask: Dispatch<SetStateAction<{ title: string; status: string }>>
  onAddSubtask: () => void
  onToggleSubtaskStatus: (subtask: TicketSubtask) => void
}) {
  return (
    <TabsContent value="subtasks" className="space-y-4 mt-4">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground mb-2">
          Todo List / Subtasks ({subtasks.length})
        </div>
        {subtasks.map((subtask) => {
          const subtaskMetadata = subtask.metadata || {}
          const isCompleted = subtask.status === 'DONE' || subtask.status === 'CANCELLED'

          return (
            <Card key={subtask.id} className={isCompleted ? 'opacity-60' : ''}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={isCompleted}
                    onChange={() => onToggleSubtaskStatus(subtask)}
                  />
                  <div className="flex-1">
                    <span className={`text-sm ${isCompleted ? 'line-through' : ''}`}>
                      {subtask.title}
                    </span>
                    {subtaskMetadata.gitlabRepository && (
                      <Badge variant="outline" className="text-xs ml-2">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {subtaskMetadata.gitlabRepository.split('/').pop()}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">{subtask.status}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
        <div className="flex gap-2">
          <Input
            placeholder="Subtask title"
            value={newSubtask.title}
            onChange={(event) => setNewSubtask({ ...newSubtask, title: event.target.value })}
            className="flex-1"
          />
          <Button onClick={onAddSubtask} disabled={!newSubtask.title.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </TabsContent>
  )
}

export function DependenciesTab({ dependencies }: { dependencies: TicketDependencies }) {
  return (
    <TabsContent value="dependencies" className="space-y-4 mt-4">
      <div className="space-y-4">
        {dependencies.dependencies.length > 0 && (
          <div>
            <Label className="mb-2 block">Depends On</Label>
            {dependencies.dependencies.map((dependency) => (
              <Card key={dependency.id} className="mb-2">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{dependency.dependsOn?.title}</span>
                    <Badge variant="outline">{dependency.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {dependencies.dependents.length > 0 && (
          <div>
            <Label className="mb-2 block">Blocks</Label>
            {dependencies.dependents.map((dependency) => (
              <Card key={dependency.id} className="mb-2">
                <CardContent className="p-3">
                  <span className="text-sm">{dependency.ticket?.title}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TabsContent>
  )
}

export function RelationshipsTab({
  ticketId,
  onAddRelationship,
  onViewTicket,
}: {
  ticketId: string
  onAddRelationship: () => void
  onViewTicket: (ticketId: string) => void
}) {
  return (
    <TabsContent value="relationships" className="space-y-4 mt-4">
      <div className="space-y-6">
        <TicketRelationshipGraph
          ticketId={ticketId}
          onNodeClick={(nodeId, nodeType) => {
            if (nodeType === 'ticket') {
              onViewTicket(nodeId)
            }
          }}
          onNodeDoubleClick={(nodeId, nodeType) => {
            if (nodeType === 'ticket') {
              onViewTicket(nodeId)
            }
          }}
        />
        <TicketRelationshipsPanel
          ticketId={ticketId}
          onAddRelationship={onAddRelationship}
          onViewTicket={onViewTicket}
        />
      </div>
    </TabsContent>
  )
}

export function TimeTab({
  ticket,
  timeLogs,
  totalHours,
  newTimeLog,
  setNewTimeLog,
  onAddTimeLog,
}: {
  ticket: TicketDetailTicket
  timeLogs: TicketTimeLog[]
  totalHours: number
  newTimeLog: { hours: string; description: string; loggedAt: string }
  setNewTimeLog: Dispatch<SetStateAction<{ hours: string; description: string; loggedAt: string }>>
  onAddTimeLog: () => void
}) {
  return (
    <TabsContent value="time" className="space-y-4 mt-4">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Time</div>
                <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
              </div>
              {ticket.estimate && (
                <div>
                  <div className="text-sm text-muted-foreground">Estimated</div>
                  <div className="text-2xl font-bold">{ticket.estimate}h</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {timeLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{Number(log.hours).toFixed(2)}h</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.loggedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{log.user?.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-2 border-t pt-4">
          <Input
            type="date"
            value={newTimeLog.loggedAt}
            onChange={(event) => setNewTimeLog({ ...newTimeLog, loggedAt: event.target.value })}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.25"
              placeholder="Hours"
              value={newTimeLog.hours}
              onChange={(event) => setNewTimeLog({ ...newTimeLog, hours: event.target.value })}
              className="w-24"
            />
            <Input
              placeholder="Description (optional)"
              value={newTimeLog.description}
              onChange={(event) => setNewTimeLog({ ...newTimeLog, description: event.target.value })}
              className="flex-1"
            />
            <Button onClick={onAddTimeLog} disabled={!newTimeLog.hours}>
              <Plus className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
