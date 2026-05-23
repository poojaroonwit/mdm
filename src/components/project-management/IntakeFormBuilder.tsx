'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  X,
  GripVertical,
  Trash2,
  Edit,
  Save,
  Eye,
  Type,
  FileText,
  List,
  Hash,
  Calendar,
  CheckSquare,
  User,
  Mail,
  Link as LinkIcon,
  Upload,
} from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'

interface FormField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'user' | 'email' | 'url' | 'file'
  required?: boolean
  options?: string[]
  placeholder?: string
  validation?: Record<string, any>
}

interface IntakeFormBuilderProps {
  formId?: string
  spaceId: string
  onSave: (form: any) => void
  onCancel: () => void
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'textarea', label: 'Textarea', icon: FileText },
  { value: 'select', label: 'Select', icon: List },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'user', label: 'User', icon: User },
  { value: 'file', label: 'File', icon: Upload },
]

export function IntakeFormBuilder({ formId, spaceId, onSave, onCancel }: IntakeFormBuilderProps) {
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [fields, setFields] = useState<FormField[]>([])
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (formId) {
      loadForm()
    }
  }, [formId])

  const loadForm = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/intake-forms/${formId}`)
      if (response.ok) {
        const data = await response.json()
        const form = data.form
        setFormName(form.name)
        setFormDescription(form.description || '')
        setIsActive(form.isActive)
        setFields((form.formFields || []) as FormField[])
      }
    } catch (error) {
      console.error('Error loading form:', error)
      showError('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleAddField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
    }
    setEditingField(newField)
    setIsFieldDialogOpen(true)
  }

  const handleEditField = (field: FormField) => {
    setEditingField({ ...field })
    setIsFieldDialogOpen(true)
  }

  const handleSaveField = () => {
    if (!editingField) return

    if (!editingField.name || !editingField.label) {
      showError('Field name and label are required')
      return
    }

    if (editingField.type === 'select' && (!editingField.options || editingField.options.length === 0)) {
      showError('Select fields must have at least one option')
      return
    }

    const existingIndex = fields.findIndex(f => f.id === editingField.id)
    if (existingIndex >= 0) {
      const updated = [...fields]
      updated[existingIndex] = editingField
      setFields(updated)
    } else {
      setFields([...fields, editingField])
    }

    setIsFieldDialogOpen(false)
    setEditingField(null)
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      showError('Form name is required')
      return
    }

    if (fields.length === 0) {
      showError('At least one field is required')
      return
    }

    setLoading(true)
    try {
      const formData = {
        spaceId,
        name: formName,
        description: formDescription,
        formFields: fields,
        isActive,
      }

      const url = formId ? `/api/intake-forms/${formId}` : '/api/intake-forms'
      const method = formId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        showSuccess(`Form ${formId ? 'updated' : 'created'} successfully`)
        onSave(result.form)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save form')
      }
    } catch (error: any) {
      showError(error.message || 'Failed to save form')
    } finally {
      setLoading(false)
    }
  }

  if (loading && formId) {
    return <div className="p-4">Loading form...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{formId ? 'Edit Intake Form' : 'Create Intake Form'}</CardTitle>
          <CardDescription>
            Build a custom form for ticket intake. Add fields and configure them as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="formName">Form Name *</Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Support Request Form"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="formDescription">Description</Label>
            <Textarea
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what this form is for..."
              className="mt-1"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(checked as boolean)}
            />
            <Label htmlFor="isActive" className="font-normal">
              Form is active (users can submit)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>Add and configure fields for your form</CardDescription>
            </div>
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fields added yet. Click "Add Field" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const FieldIcon = fieldTypes.find(t => t.value === field.type)?.icon || Type
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <FieldIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label || field.name}</span>
                        {field.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                      </div>
                      {field.placeholder && (
                        <p className="text-sm text-muted-foreground">{field.placeholder}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditField(field)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteField(field.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Form'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField?.id && fields.find(f => f.id === editingField.id) ? 'Edit Field' : 'Add Field'}</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="fieldType">Field Type *</Label>
                <Select
                  value={editingField.type}
                  onValueChange={(value) => setEditingField({
                    ...editingField,
                    type: value as FormField['type'],
                    options: value === 'select' ? editingField.options || [''] : undefined,
                  })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fieldName">Field Name (internal) *</Label>
                <Input
                  id="fieldName"
                  value={editingField.name}
                  onChange={(e) => setEditingField({ ...editingField, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="e.g., request_title"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used internally. Use lowercase with underscores.
                </p>
              </div>
              <div>
                <Label htmlFor="fieldLabel">Field Label *</Label>
                <Input
                  id="fieldLabel"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  placeholder="e.g., Request Title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                <Input
                  id="fieldPlaceholder"
                  value={editingField.placeholder || ''}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                  placeholder="e.g., Enter your request title..."
                  className="mt-1"
                />
              </div>
              {editingField.type === 'select' && (
                <div>
                  <Label>Options *</Label>
                  <div className="space-y-2 mt-1">
                    {(editingField.options || ['']).map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editingField.options || [])]
                            newOptions[index] = e.target.value
                            setEditingField({ ...editingField, options: newOptions })
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        {(editingField.options || []).length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newOptions = editingField.options?.filter((_, i) => i !== index) || []
                              setEditingField({ ...editingField, options: newOptions.length > 0 ? newOptions : [''] })
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingField({
                          ...editingField,
                          options: [...(editingField.options || []), '']
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fieldRequired"
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked as boolean })}
                />
                <Label htmlFor="fieldRequired" className="font-normal">
                  Required field
                </Label>
              </div>
            </div>
          )}
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveField}>
              {editingField?.id && fields.find(f => f.id === editingField.id) ? 'Update' : 'Add'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
