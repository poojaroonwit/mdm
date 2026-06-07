'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Loader2 } from 'lucide-react'
import type { IntakeSubmission } from './IntakeSubmissionList'

interface ConvertToTicketDialogProps {
  submission: IntakeSubmission
  onConvert: (spaceId: string, title?: string, description?: string, priority?: string) => void
  onCancel: () => void
  loading: boolean
}

export function ConvertToTicketDialog({ submission, onConvert, onCancel, loading }: ConvertToTicketDialogProps) {
  const [spaceId, setSpaceId] = useState('')
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string }>>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('MEDIUM')
  const selectedSpaceLabel = spaces.find((space) => space.id === spaceId)?.name || 'Select a space'

  useEffect(() => {
    loadSpaces()
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
                <SelectValue placeholder="Select a space">{selectedSpaceLabel}</SelectValue>
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
