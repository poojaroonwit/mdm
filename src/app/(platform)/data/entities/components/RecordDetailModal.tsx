'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Edit, Save, X, Trash2 } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any
  attributes: any[]
  onSave: (recordData: any) => void
  onDelete: (recordId: string) => void
  renderEditField: (attribute: any, value: any) => React.ReactNode
}

export function RecordDetailModal({ open, onOpenChange, record, attributes, onSave, onDelete, renderEditField }: Props) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, any>>(record?.values || {})

  React.useEffect(() => {
    setFormData(record?.values || {})
    setIsEditing(false)
  }, [record])

  const handleSave = () => {
    onSave(formData)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (record?.id && confirm('Are you sure you want to delete this record?')) {
      onDelete(record.id)
    }
  }

  const handleFieldChange = (attributeName: string, value: any) => {
    setFormData(prev => ({ ...prev, [attributeName]: value }))
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Record Details</DialogTitle>
              <DialogDescription>ID: {record?.id}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="space-y-2">
              <Label className="text-sm font-medium">
                {attribute.display_name}
                {attribute.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {isEditing ? (
                renderEditField(attribute, formData[attribute.name])
              ) : (
                <div className="text-sm">
                  {formData[attribute.name] || <span className="text-muted-foreground">—</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
