'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface KongGatewayDialogsProps {
  formData: {
    name: string
    adminUrl: string
    adminApiKey: string
    description: string
    isActive: boolean
  }
  handleCloseDialog: () => void
  handleDelete: () => void
  handleSave: () => void
  isDeleteDialogOpen: boolean
  isDialogOpen: boolean
  selectedInstance: { id: string; name: string } | null
  setFormData: (formData: KongGatewayDialogsProps['formData']) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  setIsDialogOpen: (open: boolean) => void
}

export function KongGatewayDialogs({
  formData,
  handleCloseDialog,
  handleDelete,
  handleSave,
  isDeleteDialogOpen,
  isDialogOpen,
  selectedInstance,
  setFormData,
  setIsDeleteDialogOpen,
  setIsDialogOpen,
}: KongGatewayDialogsProps) {
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInstance ? 'Edit Kong Instance' : 'Add Kong Instance'}
            </DialogTitle>
            <DialogDescription>
              Configure connection to a Kong Gateway Admin API
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Production Kong"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminUrl">Admin API URL *</Label>
              <Input
                id="adminUrl"
                value={formData.adminUrl}
                onChange={(event) => setFormData({ ...formData, adminUrl: event.target.value })}
                placeholder="http://kong-server:8001"
              />
              <p className="text-xs text-muted-foreground">
                The URL of your Kong Admin API endpoint
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminApiKey">Admin API Key (Optional)</Label>
              <Input
                id="adminApiKey"
                type="password"
                value={formData.adminApiKey}
                onChange={(event) => setFormData({ ...formData, adminApiKey: event.target.value })}
                placeholder="Leave empty if no authentication required"
              />
              <p className="text-xs text-muted-foreground">
                API key for Kong Admin API authentication (if enabled)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Production Kong Gateway instance"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this instance
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedInstance ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the Kong instance
              configuration. The Kong Gateway server itself will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
