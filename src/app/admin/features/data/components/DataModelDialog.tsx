'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DataModel } from '../types'
import { showSuccess, showError } from '@/lib/toast-utils'

interface Space {
  id: string
  name: string
  slug?: string
}

interface DataModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: DataModel | null
  spaces: Space[]
  onSuccess: () => void
}

export function DataModelDialog({
  open,
  onOpenChange,
  model,
  spaces,
  onSuccess,
}: DataModelDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    display_name: '',
    description: '',
    space_ids: [] as string[],
  })

  useEffect(() => {
    if (model) {
      setForm({
        name: model.name || '',
        display_name: model.display_name || model.name || '',
        description: model.description || '',
        space_ids: model.space_ids || [],
      })
    } else {
      setForm({
        name: '',
        display_name: '',
        description: '',
        space_ids: [],
      })
    }
  }, [model, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = model ? 'PUT' : 'POST'
      const url = model ? `/api/data-models/${model.id}` : '/api/data-models'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          display_name: form.display_name || form.name,
          description: form.description || null,
          ...(model ? {} : { space_ids: form.space_ids }),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save data model')
      }

      // If editing, update spaces separately
      if (model && form.space_ids.length > 0) {
        await fetch(`/api/data-models/${model.id}/spaces`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ space_ids: form.space_ids }),
        })
      }

      showSuccess(model ? 'Data model updated successfully' : 'Data model created successfully')
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to save data model')
    } finally {
      setLoading(false)
    }
  }

  const toggleSpace = (spaceId: string) => {
    setForm((prev) => ({
      ...prev,
      space_ids: prev.space_ids.includes(spaceId)
        ? prev.space_ids.filter((id) => id !== spaceId)
        : [...prev.space_ids, spaceId],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{model ? 'Edit Data Model' : 'Create Data Model'}</DialogTitle>
          <DialogDescription>
            {model
              ? 'Update the data model details and space associations.'
              : 'Create a new data model and assign it to spaces.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter model name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter display name (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                rows={3}
              />
            </div>

            {!model && (
              <div className="space-y-2">
                <Label>Spaces *</Label>
                <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                  {spaces.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No spaces available</p>
                  ) : (
                    <div className="space-y-2">
                      {spaces.map((space) => (
                        <div key={space.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`space-${space.id}`}
                            checked={form.space_ids.includes(space.id)}
                            onCheckedChange={() => toggleSpace(space.id)}
                          />
                          <Label
                            htmlFor={`space-${space.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {space.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {form.space_ids.length === 0 && (
                  <p className="text-sm text-red-500">At least one space must be selected</p>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!model && form.space_ids.length === 0)}>
              {loading ? 'Saving...' : model ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

