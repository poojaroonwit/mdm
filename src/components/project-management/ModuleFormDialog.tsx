'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { Module, ModuleFormData } from './ModuleList'

interface ModuleFormDialogProps {
  open: boolean
  editingModule: Module | null
  formData: ModuleFormData
  users: Array<{ id: string; name: string | null; email: string; avatar?: string | null }>
  onOpenChange: (open: boolean) => void
  onFormDataChange: (data: ModuleFormData) => void
  onReset: () => void
  onCreate: () => void
  onUpdate: () => void
  onClearEditingModule: () => void
}

export function ModuleFormDialog({
  open,
  editingModule,
  formData,
  users,
  onOpenChange,
  onFormDataChange,
  onReset,
  onCreate,
  onUpdate,
  onClearEditingModule,
}: ModuleFormDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
    onClearEditingModule()
    onReset()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        handleClose()
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingModule ? 'Edit Module' : 'Create New Module'}
          </DialogTitle>
          <DialogDescription>
            {editingModule
              ? 'Update module details and settings'
              : 'Create a new module to organize your project work'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                placeholder="Module name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                placeholder="Module description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => onFormDataChange({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadId">Module Lead</Label>
                <Select
                  value={formData.leadId}
                  onValueChange={(value) => onFormDataChange({ ...formData, leadId: value })}
                >
                  <SelectTrigger id="leadId">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => onFormDataChange({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="datetime-local"
                  value={formData.targetDate}
                  onChange={(e) => onFormDataChange({ ...formData, targetDate: e.target.value })}
                />
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={editingModule ? onUpdate : onCreate}>
            {editingModule ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
