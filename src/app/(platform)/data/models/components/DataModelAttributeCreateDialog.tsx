'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type AttributeForm = {
  name: string
  display_name: string
  data_type: string
  is_required: boolean
  is_unique: boolean
  default_value: string
  options: never[]
  order_index: number
}

interface DataModelAttributeCreateDialogProps {
  attributeForm: AttributeForm
  modelDisplayName?: string
  open: boolean
  setAttributeForm: (form: AttributeForm) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function DataModelAttributeCreateDialog({
  attributeForm,
  modelDisplayName,
  open,
  setAttributeForm,
  onOpenChange,
  onSave
}: DataModelAttributeCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Attribute</DialogTitle>
          <DialogDescription>
            Create a new attribute for {modelDisplayName || 'this model'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={attributeForm.name}
                onChange={(event) => setAttributeForm({ ...attributeForm, name: event.target.value })}
                placeholder="e.g., customer_name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={attributeForm.display_name}
                onChange={(event) => setAttributeForm({ ...attributeForm, display_name: event.target.value })}
                placeholder="e.g., Customer Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Data Type</label>
              <select
                value={attributeForm.data_type}
                onChange={(event) => setAttributeForm({ ...attributeForm, data_type: event.target.value })}
                className="w-full p-2 border border-border rounded-md"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="url">URL</option>
                <option value="select">Select</option>
                <option value="multi_select">Multi Select</option>
                <option value="textarea">Textarea</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Default Value</label>
              <Input
                value={attributeForm.default_value}
                onChange={(event) => setAttributeForm({ ...attributeForm, default_value: event.target.value })}
                placeholder="Optional default value"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attributeForm.is_required}
                onChange={(event) => setAttributeForm({ ...attributeForm, is_required: event.target.checked })}
              />
              <span className="text-sm">Required</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={attributeForm.is_unique}
                onChange={(event) => setAttributeForm({ ...attributeForm, is_unique: event.target.checked })}
              />
              <span className="text-sm">Unique</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              Create Attribute
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
