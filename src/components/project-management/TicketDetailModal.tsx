'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, User, X, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'

interface TicketAttribute {
  id?: string
  name: string
  displayName: string
  type: string
  value?: string | null
  jsonValue?: any
  isRequired?: boolean
}

interface TicketDetailModalProps {
  ticket: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    dueDate?: string | null
    startDate?: string | null
    estimate?: number | null
    labels?: string[]
    assignee?: {
      id: string
      name: string
      email: string
      avatar?: string | null
    } | null
    attributes?: TicketAttribute[]
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: (ticket: any) => void
  onDelete?: (ticketId: string) => void
}

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: TicketDetailModalProps) {
  const [editedTicket, setEditedTicket] = useState(ticket)
  const [newAttribute, setNewAttribute] = useState({
    name: '',
    displayName: '',
    type: 'TEXT',
    value: '',
  })

  if (!ticket) return null

  const handleSave = () => {
    if (onSave) {
      onSave(editedTicket)
    }
  }

  const handleAddAttribute = () => {
    if (!newAttribute.name || !newAttribute.displayName) return

    const updatedAttributes = [
      ...(editedTicket?.attributes || []),
      {
        ...newAttribute,
        id: `temp-${Date.now()}`,
      },
    ]

    setEditedTicket({
      ...editedTicket!,
      attributes: updatedAttributes,
    })

    setNewAttribute({
      name: '',
      displayName: '',
      type: 'TEXT',
      value: '',
    })
  }

  const handleRemoveAttribute = (index: number) => {
    const updatedAttributes = editedTicket?.attributes?.filter((_, i) => i !== index) || []
    setEditedTicket({
      ...editedTicket!,
      attributes: updatedAttributes,
    })
  }

  const handleUpdateAttribute = (index: number, field: string, value: any) => {
    const updatedAttributes = [...(editedTicket?.attributes || [])]
    updatedAttributes[index] = {
      ...updatedAttributes[index],
      [field]: value,
    }
    setEditedTicket({
      ...editedTicket!,
      attributes: updatedAttributes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>View and edit ticket information</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="col-span-2 space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedTicket?.title || ''}
                  onChange={(e) =>
                    setEditedTicket({ ...editedTicket!, title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedTicket?.description || ''}
                  onChange={(e) =>
                    setEditedTicket({ ...editedTicket!, description: e.target.value })
                  }
                  className="mt-1 min-h-[100px]"
                  placeholder="Add a description..."
                />
              </div>

              {/* Custom Attributes */}
              <div>
                <Label>Custom Attributes</Label>
                <div className="mt-2 space-y-2">
                  {editedTicket?.attributes?.map((attr, index) => (
                    <div
                      key={attr.id || index}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <Input
                          value={attr.displayName}
                          onChange={(e) =>
                            handleUpdateAttribute(index, 'displayName', e.target.value)
                          }
                          placeholder="Attribute name"
                        />
                        <Select
                          value={attr.type}
                          onValueChange={(value) => handleUpdateAttribute(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEXT">Text</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="BOOLEAN">Boolean</SelectItem>
                            <SelectItem value="DATE">Date</SelectItem>
                            <SelectItem value="SELECT">Select</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        value={attr.value || ''}
                        onChange={(e) => handleUpdateAttribute(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add new attribute */}
                  <div className="flex items-center gap-2 p-2 border border-dashed rounded-lg">
                    <Input
                      value={newAttribute.name}
                      onChange={(e) =>
                        setNewAttribute({ ...newAttribute, name: e.target.value })
                      }
                      placeholder="Attribute key"
                      className="flex-1"
                    />
                    <Input
                      value={newAttribute.displayName}
                      onChange={(e) =>
                        setNewAttribute({ ...newAttribute, displayName: e.target.value })
                      }
                      placeholder="Display name"
                      className="flex-1"
                    />
                    <Select
                      value={newAttribute.type}
                      onValueChange={(value) =>
                        setNewAttribute({ ...newAttribute, type: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXT">Text</SelectItem>
                        <SelectItem value="NUMBER">Number</SelectItem>
                        <SelectItem value="BOOLEAN">Boolean</SelectItem>
                        <SelectItem value="DATE">Date</SelectItem>
                        <SelectItem value="SELECT">Select</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={handleAddAttribute}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={editedTicket?.status}
                  onValueChange={(value) =>
                    setEditedTicket({ ...editedTicket!, status: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label>Priority</Label>
                <Select
                  value={editedTicket?.priority}
                  onValueChange={(value) =>
                    setEditedTicket({ ...editedTicket!, priority: value })
                  }
                >
                  <SelectTrigger className="mt-1">
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

              {/* Due Date */}
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={
                    editedTicket?.dueDate
                      ? format(new Date(editedTicket.dueDate), 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) =>
                    setEditedTicket({
                      ...editedTicket!,
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Estimate */}
              <div>
                <Label>Estimate (hours)</Label>
                <Input
                  type="number"
                  value={editedTicket?.estimate || ''}
                  onChange={(e) =>
                    setEditedTicket({
                      ...editedTicket!,
                      estimate: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* Assignee */}
              {ticket.assignee && (
                <div>
                  <Label>Assigned To</Label>
                  <div className="mt-1 flex items-center gap-2 p-2 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ticket.assignee.avatar || undefined} />
                      <AvatarFallback>
                        {ticket.assignee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{ticket.assignee.name}</div>
                      <div className="text-xs text-gray-500">{ticket.assignee.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onDelete(ticket.id)
                      onOpenChange(false)
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

