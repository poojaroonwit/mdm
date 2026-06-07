'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import type { Space } from './SpaceManagement'

export interface NewSpaceForm {
  name: string
  description: string
  slug: string
  isDefault: boolean
  isActive: boolean
  icon: string
  features: Record<string, any>
}

interface SpaceManagementDialogsProps {
  showCreateDialog: boolean
  showEditDialog: boolean
  newSpace: NewSpaceForm
  selectedSpace: Space | null
  onCreateOpenChange: (open: boolean) => void
  onEditOpenChange: (open: boolean) => void
  onNewSpaceChange: (space: NewSpaceForm) => void
  onSelectedSpaceChange: (space: Space) => void
  onCreate: () => void
  onUpdate: () => void
}

export function SpaceManagementDialogs({
  showCreateDialog,
  showEditDialog,
  newSpace,
  selectedSpace,
  onCreateOpenChange,
  onEditOpenChange,
  onNewSpaceChange,
  onSelectedSpaceChange,
  onCreate,
  onUpdate,
}: SpaceManagementDialogsProps) {
  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={onCreateOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Space
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a new workspace for your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="space-name">Space Name</Label>
              <Input
                id="space-name"
                value={newSpace.name}
                onChange={(e) => onNewSpaceChange({ ...newSpace, name: e.target.value })}
                placeholder="My Workspace"
              />
            </div>
            <div>
              <Label htmlFor="space-description">Description</Label>
              <Textarea
                id="space-description"
                value={newSpace.description}
                onChange={(e) => onNewSpaceChange({ ...newSpace, description: e.target.value })}
                placeholder="Workspace description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="space-slug">Slug</Label>
              <Input
                id="space-slug"
                value={newSpace.slug}
                onChange={(e) => onNewSpaceChange({ ...newSpace, slug: e.target.value })}
                placeholder="my-workspace"
              />
            </div>
            <div>
              <Label htmlFor="space-icon">Icon</Label>
              <Input
                id="space-icon"
                value={newSpace.icon}
                onChange={(e) => onNewSpaceChange({ ...newSpace, icon: e.target.value })}
                placeholder="Workspace icon"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newSpace.isDefault}
                onCheckedChange={(checked) => onNewSpaceChange({ ...newSpace, isDefault: checked })}
              />
              <Label>Set as Default Space</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onCreateOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={!newSpace.name || !newSpace.slug}>
              Create Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={onEditOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
            <DialogDescription>
              Update space settings and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedSpace && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Space Name</Label>
                <Input
                  id="edit-name"
                  value={selectedSpace.name}
                  onChange={(e) => onSelectedSpaceChange({ ...selectedSpace, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedSpace.description}
                  onChange={(e) => onSelectedSpaceChange({ ...selectedSpace, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={selectedSpace.slug}
                  onChange={(e) => onSelectedSpaceChange({ ...selectedSpace, slug: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedSpace.isActive}
                  onCheckedChange={(checked) => onSelectedSpaceChange({ ...selectedSpace, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => onEditOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdate} disabled={!selectedSpace?.name || !selectedSpace?.slug}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
