'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ColorPicker } from '@/components/ui/color-picker'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { 
  Plus, 
  Trash2, 
  GripVertical,
  AlertTriangle,
  Info,
  Settings,
  Palette
} from 'lucide-react'
import { AttributeFormData } from '@/lib/attribute-management'

interface AttributeFormProps {
  initialData?: Partial<AttributeFormData>
  onSubmit: (data: AttributeFormData) => void
  onCancel: () => void
  loading?: boolean
}

interface AttributeOption {
  value: string
  label: string
  color: string
  order: number
}

export function AttributeForm({ initialData, onSubmit, onCancel, loading = false }: AttributeFormProps) {
  const [formData, setFormData] = useState<AttributeFormData>({
    name: '',
    display_name: '',
    type: 'text',
    description: '',
    is_required: false,
    is_unique: false,
    default_value: '',
    validation_rules: {},
    options: []
  })

  const [options, setOptions] = useState<AttributeOption[]>([
    { value: '', label: '', color: '#1e40af', order: 0 }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
      if (initialData.options) {
        setOptions(initialData.options.length > 0 ? initialData.options.map(opt => ({
          ...opt,
          color: opt.color || '#1e40af'
        })) : [
          { value: '', label: '', color: '#1e40af', order: 0 }
        ])
      }
    }
  }, [initialData])

  const attributeTypes = [
    { value: 'text', label: 'Text', description: 'Single line text input' },
    { value: 'textarea', label: 'Textarea', description: 'Multi-line text input' },
    { value: 'email', label: 'Email', description: 'Email address with validation' },
    { value: 'url', label: 'URL', description: 'Web URL with validation' },
    { value: 'number', label: 'Number', description: 'Numeric input' },
    { value: 'phone', label: 'Phone', description: 'Phone number' },
    { value: 'date', label: 'Date', description: 'Date picker' },
    { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
    { value: 'boolean', label: 'Boolean', description: 'True/False checkbox' },
    { value: 'select', label: 'Select', description: 'Single choice dropdown' },
    { value: 'multiselect', label: 'Multi-Select', description: 'Multiple choice selection' },
    { value: 'file', label: 'File', description: 'File upload' },
    { value: 'image', label: 'Image', description: 'Image upload' },
    { value: 'json', label: 'JSON', description: 'JSON data' }
  ]

  const colorOptions = [
    '#1e40af', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  const handleInputChange = (field: keyof AttributeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleOptionChange = (index: number, field: keyof AttributeOption, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions(prev => [...prev, { 
      value: '', 
      label: '', 
      color: '#1e40af', 
      order: prev.length 
    }])
  }

  const removeOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'Name must start with a letter and contain only letters, numbers, and underscores'
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required'
    }

    if (!formData.type) {
      newErrors.type = 'Type is required'
    }

    // Validate options for select types
    if ((formData.type === 'select' || formData.type === 'multiselect')) {
      const validOptions = options.filter(opt => opt.value.trim() && opt.label.trim())
      if (validOptions.length === 0) {
        newErrors.options = 'At least one option is required for select/multiselect types'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const validOptions = options.filter(opt => opt.value.trim() && opt.label.trim())
    const submitData: AttributeFormData = {
      ...formData,
      options: validOptions.length > 0 ? validOptions : undefined
    }

    onSubmit(submitData)
  }

  const isSelectType = formData.type === 'select' || formData.type === 'multiselect'

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Configure the basic properties of this attribute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. customer_name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="e.g. Customer Name"
                className={errors.display_name ? 'border-red-500' : ''}
              />
              {errors.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select attribute type" />
              </SelectTrigger>
              <SelectContent>
                {attributeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this attribute"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_value">Default Value</Label>
            <Input
              id="default_value"
              value={formData.default_value}
              onChange={(e) => handleInputChange('default_value', e.target.value)}
              placeholder="Default value (optional)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Validation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Validation Rules
          </CardTitle>
          <CardDescription>
            Configure validation and constraints for this attribute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Required</Label>
              <p className="text-sm text-muted-foreground">
                This attribute must have a value
              </p>
            </div>
            <Switch
              checked={formData.is_required}
              onCheckedChange={(checked) => handleInputChange('is_required', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Unique</Label>
              <p className="text-sm text-muted-foreground">
                Values must be unique across all records
              </p>
            </div>
            <Switch
              checked={formData.is_unique}
              onCheckedChange={(checked) => handleInputChange('is_unique', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Options for Select Types */}
      {isSelectType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Options
            </CardTitle>
            <CardDescription>
              Define the available options for this {formData.type === 'select' ? 'select' : 'multi-select'} field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {/* Color Swatch */}
                  <div className="flex items-center gap-2">
                    <ColorInput
                      value={option.color || '#1e40af'}
                      onChange={(color) => handleOptionChange(index, 'color', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#1e40af"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>
                  
                  {/* Attribute Code */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={option.value}
                      onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                      placeholder="Option value"
                      className="h-8"
                    />
                  </div>
                  
                  {/* Attribute Label */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={option.label}
                      onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                      placeholder="Option label"
                      className="h-8"
                    />
                  </div>
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    disabled={options.length === 1}
                    className="h-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {errors.options && <p className="text-sm text-red-500">{errors.options}</p>}

              <Button type="button" variant="outline" onClick={addOption} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving...' : 'Save Attribute'}
        </Button>
      </div>
    </div>
  )
}
