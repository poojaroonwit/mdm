'use client'

import { useEffect, useState } from 'react'
import { useSpace } from '@/contexts/space-context'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreatedSpace {
  id: string
  name: string
  slug?: string
}

interface CreateSpaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (space: CreatedSpace) => void
  title?: string
  description?: string
}

const INITIAL_FORM = {
  name: '',
  description: '',
  slug: '',
}

export function CreateSpaceDialog({
  open,
  onOpenChange,
  onCreated,
  title = 'Create New Space',
  description = 'Create a new workspace so you can organize records, tickets, and data management activity.',
}: CreateSpaceDialogProps) {
  const { refreshSpaces, setCurrentSpace } = useSpace()
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM)
      setError(null)
      setIsSubmitting(false)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Space name is required.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          slug: form.slug.trim() || undefined,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create space')
      }

      const createdSpace: CreatedSpace | undefined = data?.space
      await refreshSpaces()

      if (createdSpace) {
        setCurrentSpace(createdSpace as any)
        onCreated?.(createdSpace)
      }

      onOpenChange(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create space')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-space-name">Space Name</Label>
              <Input
                id="create-space-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Data Management Space"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-space-description">Description</Label>
              <Textarea
                id="create-space-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-space-slug">Slug</Label>
              <Input
                id="create-space-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                placeholder="data-management-space"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to generate it from the space name.
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Space'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
