'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Label } from '@/components/ui/label'
import { Edit, Save, X, Trash2, FileText } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any
  attributes: any[]
  onSave: (recordData: any) => void
  onDelete: (recordId: string) => void
  renderEditField: (attribute: any, value: any) => React.ReactNode
}

export function RecordDetailDrawer({ open, onOpenChange, record, attributes, onSave, onDelete, renderEditField }: Props) {
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
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Record Details"
      description={`ID: ${record?.id}`}
      icon={FileText}
      headerActions={
        !isEditing ? (
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
        )
      }
    >
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
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
      </div>
    </CentralizedDrawer>
  )
}
