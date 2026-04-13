'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

interface NameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: (name: string) => void
}

export function NameDialog({ open, onOpenChange, onContinue }: NameDialogProps) {
  const [name, setName] = useState('')

  const handleContinue = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Please enter a chatbot name')
      return
    }
    onContinue(trimmedName)
    setName('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Chatbot</DialogTitle>
          <DialogDescription>Enter a name to create your chatbot.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Chatbot Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Chatbot"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleContinue()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

