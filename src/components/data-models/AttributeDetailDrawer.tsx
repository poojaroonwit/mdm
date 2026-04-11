'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import {
  Database,
  Type,
  Activity,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Calendar,
  User,
  Edit,
  Trash2,
  Save,
  X,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  MoreVertical,
  Eye,
  EyeOff,
  Palette,
  Settings,
  Plus
} from 'lucide-react'

interface Attribute {
  id: string
  data_model_id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
  description?: string
  default_value?: string
  validation_rules?: any
  created_at: string
  updated_at: string
}

interface AttributeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
  onSave: (attribute: Attribute) => void
  onDelete: (attributeId: string) => void
  onReorder: (attributeId: string, newOrder: number) => void
  allAttributes: Attribute[]
}

export function AttributeDetailDrawer({
  open,
  onOpenChange,
  attribute,
  onSave,
  onDelete,
  onReorder,
  allAttributes
}: AttributeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Attribute>>({})
  const [activityData, setActivityData] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [showNewOption, setShowNewOption] = useState(false)
  const [newOption, setNewOption] = useState({ value: '', label: '', color: '#1e40af' })
  const [incrementConfig, setIncrementConfig] = useState({
    enabled: false,
    prefix: '',
    suffix: '',
    startValue: 1,
    step: 1
  })
  const [editingOption, setEditingOption] = useState<number | null>(null)
  const [editingOptionData, setEditingOptionData] = useState({ value: '', label: '', color: '#1e40af' })
  const [qualityStats, setQualityStats] = useState<any>(null)
  const [loadingQuality, setLoadingQuality] = useState(false)

  React.useEffect(() => {
    if (attribute) {
      setEditForm(attribute)
      loadAttributeActivity()
      loadQualityStats()

      // Load increment configuration
      if ((attribute as any).increment_config) {
        try {
          const config = JSON.parse((attribute as any).increment_config)
          setIncrementConfig(config)
        } catch (error) {
          console.error('Error parsing increment config:', error)
        }
      }
    }
  }, [attribute])

  const loadAttributeActivity = async () => {
    if (!attribute) return

    setLoadingActivity(true)
    try {
      const response = await fetch(`/api/data-models/attributes/${attribute.id}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActivityData(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading attribute activity:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  const loadQualityStats = async () => {
    if (!attribute) return

    setLoadingQuality(true)
    try {
      const response = await fetch(`/api/data-models/attributes/${attribute.id}/quality-stats`)
      if (response.ok) {
        const data = await response.json()
        setQualityStats(data)
      }
    } catch (error) {
      console.error('Error loading quality stats:', error)
    } finally {
      setLoadingQuality(false)
    }
  }

  const handleAddNewOption = () => {
    setShowNewOption(true)
    setNewOption({ value: '', label: '', color: '#1e40af' })
  }

  const handleSaveNewOption = async () => {
    if (!newOption.value || !newOption.label) return

    try {
      const currentOptions = (attribute as any)?.options || []
      const updatedOptions = [...currentOptions, newOption]

      // Update the attribute with new options
      if (!attribute) return
      const response = await fetch(`/api/data-models/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updatedOptions })
      })

      if (response.ok) {
        setShowNewOption(false)
        setNewOption({ value: '', label: '', color: '#1e40af' })
        // Refresh the attribute data
        if (onSave) {
          onSave({ ...attribute, options: updatedOptions } as any)
        }
      }
    } catch (error) {
      console.error('Error saving new option:', error)
    }
  }

  const handleCancelNewOption = () => {
    setShowNewOption(false)
    setNewOption({ value: '', label: '', color: '#1e40af' })
  }

  const handleEditOption = (index: number, option: any) => {
    setEditingOption(index)
    setEditingOptionData({ ...option })
  }

  const handleSaveOption = async (index: number) => {
    if (!editingOptionData.value || !editingOptionData.label) return

    try {
      const currentOptions = (attribute as any)?.options || []
      const updatedOptions = [...currentOptions]
      updatedOptions[index] = editingOptionData

      if (!attribute) return
      const response = await fetch(`/api/data-models/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updatedOptions })
      })

      if (response.ok) {
        setEditingOption(null)
        if (onSave) {
          onSave({ ...attribute, options: updatedOptions } as any)
        }
      }
    } catch (error) {
      console.error('Error saving option:', error)
    }
  }

  const handleCancelEditOption = () => {
    setEditingOption(null)
    setEditingOptionData({ value: '', label: '', color: '#1e40af' })
  }

  const handleRemoveOption = async (index: number) => {
    try {
      const currentOptions = (attribute as any)?.options || []
      const updatedOptions = currentOptions.filter((_: any, i: number) => i !== index)

      if (!attribute) return
      const response = await fetch(`/api/data-models/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updatedOptions })
      })

      if (response.ok) {
        if (onSave) {
          onSave({ ...attribute, options: updatedOptions } as any)
        }
      }
    } catch (error) {
      console.error('Error removing option:', error)
    }
  }

  const handleSave = () => {
    if (attribute && editForm) {
      const updatedAttribute = {
        ...attribute,
        ...editForm,
        increment_config: JSON.stringify(incrementConfig)
      }
      onSave(updatedAttribute)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    if (attribute) {
      setEditForm(attribute)
    }
    setIsEditing(false)
  }

  const moveAttribute = (direction: 'up' | 'down') => {
    if (!attribute) return

    const currentIndex = allAttributes.findIndex(attr => attr.id === attribute.id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= allAttributes.length) return

    const newOrder = allAttributes[newIndex].order
    onReorder(attribute.id, newOrder)
  }

  const canMoveUp = attribute && allAttributes.findIndex(attr => attr.id === attribute.id) > 0
  const canMoveDown = attribute && allAttributes.findIndex(attr => attr.id === attribute.id) < allAttributes.length - 1


  if (!attribute) {
    // Only log in development, not during build
    if (process.env.NODE_ENV === 'development') {
      console.log('AttributeDetailDrawer: No attribute provided')
    }
    return null
  }

  // Only log in development, not during build
  if (process.env.NODE_ENV === 'development') {
    console.log('AttributeDetailDrawer: Rendering with attribute:', attribute)
  }

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={attribute.display_name}
      icon={Type}
      badge={<Badge variant="outline">{attribute.type}</Badge>}
      headerActions={
        isEditing ? (
          <>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(attribute.id)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </>
        )
      }
    >
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="position" className="flex items-center gap-2">
              <GripVertical className="h-4 w-4" />
              Position
            </TabsTrigger>
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Configure the basic properties of this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          placeholder="attribute_name"
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md font-mono text-sm">
                          {attribute.name}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="display_name"
                          value={editForm.display_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                          placeholder="Display Name"
                        />
                      ) : (
                        <div className="p-2 bg-muted rounded-md">
                          {attribute.display_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    {isEditing ? (
                      <Select
                        value={editForm.type || ''}
                        onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="datetime">DateTime</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="multiselect">Multi-Select</SelectItem>
                          <SelectItem value="attachment">Attachment</SelectItem>
                          <SelectItem value="user">User (Single)</SelectItem>
                          <SelectItem value="user_multi">User (Multi-Select)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-2 bg-muted rounded-md">
                        <Badge variant="secondary">{attribute.type}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Describe this attribute..."
                        rows={3}
                      />
                    ) : (
                      <div className="p-2 bg-muted rounded-md min-h-[60px]">
                        {attribute.description || 'No description provided'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Validation Rules</CardTitle>
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
                    {isEditing ? (
                      <Switch
                        checked={editForm.is_required || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_required: checked })}
                      />
                    ) : (
                      <Badge variant={attribute.is_required ? 'default' : 'secondary'}>
                        {attribute.is_required ? 'Required' : 'Optional'}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Unique</Label>
                      <p className="text-sm text-muted-foreground">
                        Values must be unique across all records
                      </p>
                    </div>
                    {isEditing ? (
                      <Switch
                        checked={editForm.is_unique || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_unique: checked })}
                      />
                    ) : (
                      <Badge variant={attribute.is_unique ? 'default' : 'secondary'}>
                        {attribute.is_unique ? 'Unique' : 'Not Unique'}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default_value">Default Value</Label>
                    {isEditing ? (
                      <Input
                        id="default_value"
                        value={editForm.default_value || ''}
                        onChange={(e) => setEditForm({ ...editForm, default_value: e.target.value })}
                        placeholder="Default value (optional)"
                      />
                    ) : (
                      <div className="p-2 bg-muted rounded-md">
                        {attribute.default_value || 'No default value'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {attribute.type === 'number' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Increment Configuration</CardTitle>
                    <CardDescription>
                      Configure automatic number generation for this attribute
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Auto-Increment</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically generate sequential numbers for new records
                        </p>
                      </div>
                      {isEditing ? (
                        <Switch
                          checked={incrementConfig.enabled}
                          onCheckedChange={(checked) => setIncrementConfig({ ...incrementConfig, enabled: checked })}
                        />
                      ) : (
                        <Badge variant={incrementConfig.enabled ? 'default' : 'secondary'}>
                          {incrementConfig.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                    </div>

                    {incrementConfig.enabled && (
                      <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="prefix">Prefix</Label>
                            {isEditing ? (
                              <Input
                                id="prefix"
                                value={incrementConfig.prefix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, prefix: e.target.value })}
                                placeholder="e.g., ID-"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.prefix || 'No prefix'}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="suffix">Suffix</Label>
                            {isEditing ? (
                              <Input
                                id="suffix"
                                value={incrementConfig.suffix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, suffix: e.target.value })}
                                placeholder="e.g., -2024"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.suffix || 'No suffix'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="start_value">Start Value</Label>
                            {isEditing ? (
                              <Input
                                id="start_value"
                                type="number"
                                value={incrementConfig.startValue}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, startValue: parseInt(e.target.value) || 1 })}
                                min="1"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.startValue}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="step">Step</Label>
                            {isEditing ? (
                              <Input
                                id="step"
                                type="number"
                                value={incrementConfig.step}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, step: parseInt(e.target.value) || 1 })}
                                min="1"
                              />
                            ) : (
                              <div className="p-2 bg-background rounded-md">
                                {incrementConfig.step}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-sm font-medium text-blue-800 mb-1">Preview</div>
                          <div className="text-sm text-blue-700">
                            Next value: {incrementConfig.prefix}{incrementConfig.startValue}{incrementConfig.suffix}
                          </div>
                          <div className="text-sm text-blue-700">
                            Following: {incrementConfig.prefix}{incrementConfig.startValue + incrementConfig.step}{incrementConfig.suffix}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="position" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attribute Position</CardTitle>
                  <CardDescription>
                    Reorder attributes to change their display order in forms and tables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-primary/5">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{attribute.display_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Current position: {attribute.order}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveAttribute('up')}
                          disabled={!canMoveUp}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveAttribute('down')}
                          disabled={!canMoveDown}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">All Attributes Order</h4>
                      <ScrollableList maxHeight="MEDIUM">
                        {allAttributes
                          .sort((a, b) => a.order - b.order)
                          .map((attr, index) => (
                            <div
                              key={attr.id}
                              className={`flex items-center gap-3 p-3 border border-border rounded-lg ${attr.id === attribute.id ? 'bg-primary/10 border-primary' : 'bg-muted/50'
                                }`}
                            >
                              <div className="text-sm text-muted-foreground w-8">
                                {index + 1}
                              </div>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{attr.display_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {attr.name} • {attr.type}
                                </div>
                              </div>
                              {attr.id === attribute.id && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                          ))}
                      </ScrollableList>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="options" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Attribute Options</CardTitle>
                      <CardDescription>
                        Available options for this attribute
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAddNewOption}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Attribute Option
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(attribute as any).options && (attribute as any).options.length > 0 && (attribute as any).options.map((option: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        {/* Color Swatch */}
                        <div className="flex items-center gap-2">
                          <ColorInput
                            value={editingOption === index ? editingOptionData.color : option.color || '#1e40af'}
                            onChange={(color) => {
                              if (editingOption === index) {
                                setEditingOptionData({ ...editingOptionData, color })
                              } else {
                                // Update the option directly
                                const updatedOptions = [...((attribute as any).options || [])]
                                updatedOptions[index] = { ...updatedOptions[index], color }
                                onSave({ ...attribute, options: updatedOptions } as any)
                              }
                            }}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1e40af"
                            inputClassName="h-8 text-xs pl-7"
                          />
                        </div>

                        {/* Attribute Code */}
                        <div className="flex-1 min-w-0">
                          {editingOption === index ? (
                            <Input
                              value={editingOptionData.value}
                              onChange={(e) => setEditingOptionData({ ...editingOptionData, value: e.target.value })}
                              placeholder="Option value"
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm font-mono text-muted-foreground">{option.value}</div>
                          )}
                        </div>

                        {/* Attribute Label */}
                        <div className="flex-1 min-w-0">
                          {editingOption === index ? (
                            <Input
                              value={editingOptionData.label}
                              onChange={(e) => setEditingOptionData({ ...editingOptionData, label: e.target.value })}
                              placeholder="Option label"
                              className="h-8"
                            />
                          ) : (
                            <div className="text-sm font-medium">{option.label}</div>
                          )}
                        </div>

                        {/* Edit/Save Button */}
                        <div className="flex items-center gap-1">
                          {editingOption === index ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSaveOption(index)}
                                disabled={!editingOptionData.label || !editingOptionData.value}
                                className="h-8"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditOption}
                                className="h-8"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOption(index, option)}
                              className="h-8"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        {/* 3-dot Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveOption(index)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Attribute Option
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}

                    {showNewOption && (
                      <div className="flex items-center gap-3 p-3 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        {/* Color Swatch */}
                        <div className="flex items-center gap-2">
                          <ColorInput
                            value={newOption.color}
                            onChange={(color) => setNewOption({ ...newOption, color })}
                            allowImageVideo={false}
                            className="relative"
                            placeholder="#1e40af"
                            inputClassName="h-8 text-xs pl-7"
                          />
                        </div>

                        {/* Attribute Code */}
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Option value"
                            value={newOption.value}
                            onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                            className="h-8"
                          />
                        </div>

                        {/* Attribute Label */}
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Option label"
                            value={newOption.label}
                            onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                            className="h-8"
                          />
                        </div>

                        {/* Save/Cancel Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveNewOption}
                            disabled={!newOption.label || !newOption.value}
                            className="h-8"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNewOption}
                            className="h-8"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {(!(attribute as any).options || (attribute as any).options.length === 0) && !showNewOption && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-medium">No options yet</p>
                        <p className="text-sm">Add options for this {attribute.type} field</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quality" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Statistics</CardTitle>
                  <CardDescription>
                    Overview of data quality metrics for this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingQuality ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Loading quality statistics...</div>
                    </div>
                  ) : qualityStats ? (
                    <div className="space-y-4">
                      {/* Statistics Grid - Minimal Style */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 border border-border rounded-lg">
                          <div className="text-2xl font-semibold text-gray-900">
                            {qualityStats.statistics.totalRecords.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Total Records</div>
                        </div>
                        <div className="p-3 border border-border rounded-lg">
                          <div className="text-2xl font-semibold text-gray-900">
                            {qualityStats.statistics.completionRate}%
                          </div>
                          <div className="text-sm text-gray-600">Completion Rate</div>
                        </div>
                        <div className="p-3 border border-border rounded-lg">
                          <div className="text-2xl font-semibold text-gray-900">
                            {qualityStats.statistics.uniqueCount.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">Unique Values</div>
                        </div>
                        <div className="p-3 border border-border rounded-lg">
                          <div className="text-2xl font-semibold text-gray-900">
                            {qualityStats.statistics.recentChanges}
                          </div>
                          <div className="text-sm text-gray-600">Recent Changes</div>
                        </div>
                      </div>

                      {/* Quality Issues - Minimal Style */}
                      {qualityStats.qualityIssues && qualityStats.qualityIssues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900">Quality Issues</h4>
                          <div className="space-y-1">
                            {qualityStats.qualityIssues.map((issue: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border border-border rounded text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${issue.severity === 'error' ? 'bg-red-500' :
                                    issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                  <span className="text-gray-700">{issue.message}</span>
                                </div>
                                <span className="text-gray-500">{issue.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Summary */}
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Non-null values</div>
                            <div className="font-medium">{qualityStats.statistics.nonNullCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Missing values</div>
                            <div className="font-medium">{qualityStats.statistics.missingValues.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Data type</div>
                            <div className="font-medium">{qualityStats.attribute.type}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No quality data available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attribute Activity</CardTitle>
                  <CardDescription>
                    Track changes and usage of this attribute
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Recent Activity</h4>
                      {loadingActivity ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-muted-foreground">Loading activity...</div>
                        </div>
                      ) : activityData.length > 0 ? (
                        <div className="space-y-1">
                          {activityData.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded">
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{activity.action}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.user}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {activity.details}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(activity.timestamp).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-center">
                            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No activity recorded for this attribute</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CentralizedDrawer>
  )
}
