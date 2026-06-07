'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type FolderForm = {
  name: string
  parent_id: string
}

interface DataModelFolderDialogProps {
  folderForm: FolderForm
  folders: any[]
  open: boolean
  setFolderForm: (form: FolderForm) => void
  onCreateFolder: () => void
  onOpenChange: (open: boolean) => void
}

export function DataModelFolderDialog({
  folderForm,
  folders,
  open,
  setFolderForm,
  onCreateFolder,
  onOpenChange
}: DataModelFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your data models
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderForm.name}
              onChange={(event) => setFolderForm({ ...folderForm, name: event.target.value })}
              placeholder="Enter folder name"
            />
          </div>
          <div>
            <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
            <Select value={folderForm.parent_id} onValueChange={(value) => setFolderForm({ ...folderForm, parent_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No parent (Root level)</SelectItem>
                {folders.map((folder: any) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreateFolder}>
            Create Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
