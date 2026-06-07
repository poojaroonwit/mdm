'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, X } from 'lucide-react'

export interface CreateSpaceFormData {
  name: string
  description: string
  slug: string
  tags: string[]
  tagInput: string
}

interface CreateSpaceDialogProps {
  open: boolean
  formData: CreateSpaceFormData
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onFormDataChange: (data: CreateSpaceFormData) => void
  onSubmit: (event: React.FormEvent) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}

export function CreateSpaceDialog({
  open,
  formData,
  isLoading,
  onOpenChange,
  onFormDataChange,
  onSubmit,
  onAddTag,
  onRemoveTag,
}: CreateSpaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Space
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your data and collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogBody className="p-6 pt-2 pb-4 space-y-4">
            <div>
              <Label htmlFor="name">Space Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="Enter space name"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder="Enter space description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug (Optional)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onFormDataChange({ ...formData, slug: e.target.value })}
                placeholder="my-workspace"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for URLs. Auto-generated from name if not provided.
              </p>
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="tags"
                  value={formData.tagInput}
                  onChange={(e) => onFormDataChange({ ...formData, tagInput: e.target.value })}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onAddTag()
                    }
                  }}
                />
                <Button type="button" onClick={onAddTag} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => onRemoveTag(tag)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter className="p-6 pt-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Space'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
