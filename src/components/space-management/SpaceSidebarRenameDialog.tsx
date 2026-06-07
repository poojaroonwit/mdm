'use client'

import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { IconPicker } from '@/components/ui/icon-picker'
import { Input } from '@/components/ui/input'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

interface SpaceSidebarRenameDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  pageToRename: SpacesEditorPage | null
  setPageToRename: Dispatch<SetStateAction<SpacesEditorPage | null>>
  renameValue: string
  setRenameValue: Dispatch<SetStateAction<string>>
  selectedIcon: string
  setSelectedIcon: Dispatch<SetStateAction<string>>
  handleRenamePage: () => void
}

export function SpaceSidebarRenameDialog({
  open,
  onOpenChange,
  setPageToRename,
  renameValue,
  setRenameValue,
  selectedIcon,
  setSelectedIcon,
  handleRenamePage
}: SpaceSidebarRenameDialogProps) {
  const handleCancel = () => {
    onOpenChange(false)
    setPageToRename(null)
    setRenameValue('')
    setSelectedIcon('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Page</DialogTitle>
          <DialogDescription>
            Update the name and icon for this page.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Page Name</label>
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Page name"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleRenamePage()
                }
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Icon</label>
            <IconPicker
              value={selectedIcon}
              onChange={setSelectedIcon}
              placeholder="Search icons..."
              grouped={true}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleRenamePage} disabled={!renameValue.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
