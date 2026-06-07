'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { DataDomain } from '../types'

interface DataDomainDialogProps {
  open: boolean
  editingItem: any
  domain: Partial<DataDomain>
  onOpenChange: (open: boolean) => void
  onDomainChange: (domain: Partial<DataDomain>) => void
  onSave: () => void
  onCancel: () => void
}

export function DataDomainDialog({
  open,
  editingItem,
  domain,
  onOpenChange,
  onDomainChange,
  onSave,
  onCancel,
}: DataDomainDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit' : 'Create'} Data Domain</DialogTitle>
          <DialogDescription>
            Organize data assets into logical domains for better governance
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="domain-name">Domain Name</Label>
            <Input
              id="domain-name"
              value={domain.name || ''}
              onChange={(e) => onDomainChange({ ...domain, name: e.target.value })}
              placeholder="e.g., Finance, HR, Sales"
            />
          </div>
          <div>
            <Label htmlFor="domain-description">Description</Label>
            <Textarea
              id="domain-description"
              value={domain.description || ''}
              onChange={(e) => onDomainChange({ ...domain, description: e.target.value })}
              placeholder="Describe the purpose of this domain"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editingItem ? 'Update' : 'Create'} Domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
