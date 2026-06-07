'use client'

import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface ChatbotFolderDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  mode: 'create' | 'rename'
  folderName: string
  setFolderName: Dispatch<SetStateAction<string>>
  handleSaveFolder: () => Promise<void>
}

export function ChatbotFolderDialog({
  open,
  onOpenChange,
  mode,
  folderName,
  setFolderName,
  handleSaveFolder
}: ChatbotFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Folder' : 'Rename Folder'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a folder to organize chatbot configurations.'
              : 'Update the folder name for this chatbot group.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Input
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Folder name"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void handleSaveFolder()
              }
            }}
            autoFocus
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSaveFolder()}>
            {mode === 'create' ? 'Create Folder' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
