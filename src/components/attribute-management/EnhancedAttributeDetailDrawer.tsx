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
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import {
  Database,
  Type,
  Activity,
  Settings,
  GripVertical,
  Plus,
  Trash2,
  X,
  Palette,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Target,
  MoreVertical,
  Eye,
  EyeOff,
  Edit,
  Save
} from 'lucide-react'
import { Attribute, AttributeFormData } from '@/lib/attribute-management'
import { useSpacePermissions } from '@/hooks/use-space-permissions'
import toast from 'react-hot-toast'

interface AttributeOption {
  value: string
  label: string
  color: string
  order: number
}

interface EnhancedAttributeDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute | null
  onSave: (attribute: Attribute) => void
  onDelete: (attributeId: string) => void
  allAttributes: Attribute[]
}

export function EnhancedAttributeDetailDrawer({
  open,
  onOpenChange,
  attribute,
  onSave,
  onDelete,
  allAttributes
}: EnhancedAttributeDetailDrawerProps) {
  const permissions = useSpacePermissions()
  const [activeTab, setActiveTab] = useState('details')
  const [editForm, setEditForm] = useState<Partial<Attribute>>({})
  const [options, setOptions] = useState<AttributeOption[]>([])
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
  const [qualityStats, setQualityStats] = useState<any>(null)
  const [loadingQuality, setLoadingQuality] = useState(false)
  const [editingOption, setEditingOption] = useState<number | null>(null)
  const [editingOptionData, setEditingOptionData] = useState({ value: '', label: '', color: '#1e40af' })

  const colorOptions = [
    '#1e40af', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  useEffect(() => {
    if (attribute) {
      setEditForm(attribute)
      setOptions((attribute.options || []).map(opt => ({
        ...opt,
        color: opt.color || '#1e40af'
      })))
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
      const updatedOptions = [...options, { ...newOption, order: options.length }]
      setOptions(updatedOptions)

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
          onSave({ ...attribute, options: updatedOptions })
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
      const updatedOptions = [...options]
      updatedOptions[index] = { ...editingOptionData, order: options[index]?.order ?? index }
      setOptions(updatedOptions)

      if (!attribute) return
      const response = await fetch(`/api/data-models/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updatedOptions })
      })

      if (response.ok) {
        setEditingOption(null)
        if (onSave) {
          onSave({ ...attribute, options: updatedOptions })
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
      const updatedOptions = options.filter((_, i) => i !== index)
      setOptions(updatedOptions)

      if (!attribute) return
      const response = await fetch(`/api/data-models/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updatedOptions })
      })

      if (response.ok) {
        if (onSave) {
          onSave({ ...attribute, options: updatedOptions })
        }
      }
    } catch (error) {
      console.error('Error removing option:', error)
    }
  }

  const isSelectType = attribute?.type === 'select' || attribute?.type === 'multiselect'

  const handleFormChange = (field: string, value: any) => {
    const newForm = { ...editForm, [field]: value }
    setEditForm(newForm)

    // Auto-save after a short delay
    if (attribute) {
      const updatedAttribute = {
        ...attribute,
        ...newForm,
        options: options.length > 0 ? options : undefined,
        increment_config: JSON.stringify(incrementConfig)
      }
      onSave(updatedAttribute)
    }
  }

  const handleAddOption = () => {
    if (!newOption.value.trim() || !newOption.label.trim()) {
      toast.error('Please fill in both value and label')
      return
    }

    // Validate option value (no special characters)
    if (!/^[a-zA-Z0-9_]+$/.test(newOption.value)) {
      toast.error('Option value can only contain letters, numbers, and underscores')
      return
    }

    const option: AttributeOption = {
      ...newOption,
      order: options.length
    }

    setOptions(prev => [...prev, option])
    setNewOption({ value: '', label: '', color: '#1e40af' })
  }


  const handleOptionDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(options)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order indices
    const reorderedOptions = items.map((item, index) => ({
      ...item,
      order: index
    }))

    setOptions(reorderedOptions)
  }

  const handleOptionChange = (index: number, field: keyof AttributeOption, value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  if (!attribute) return null

  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={attribute.display_name}
      icon={Type}
      badge={<Badge variant="outline">{attribute.type}</Badge>}
    >
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${isSelectType ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Details
              </TabsTrigger>
              {isSelectType && (
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Options
                </TabsTrigger>
              )}
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
                        <Input
                          id="name"
                          value={editForm.name || ''}
                          onChange={(e) => handleFormChange('name', e.target.value)}
                          placeholder="attribute_name"
                          disabled={!permissions.canEdit}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={editForm.display_name || ''}
                          onChange={(e) => handleFormChange('display_name', e.target.value)}
                          placeholder="Display Name"
                          disabled={!permissions.canEdit}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={editForm.type || ''}
                        onValueChange={(value) => handleFormChange('type', value)}
                      >
                        <SelectTrigger disabled={!permissions.canEdit}>
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description || ''}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Describe this attribute..."
                        rows={3}
                        disabled={!permissions.canEdit}
                      />
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
                      <Switch
                        checked={editForm.is_required || false}
                        onCheckedChange={(checked) => handleFormChange('is_required', checked)}
                        disabled={!permissions.canEdit}
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
                        checked={editForm.is_unique || false}
                        onCheckedChange={(checked) => handleFormChange('is_unique', checked)}
                        disabled={!permissions.canEdit}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Primary Key</Label>
                        <p className="text-sm text-muted-foreground">
                          This attribute serves as the primary identifier
                        </p>
                      </div>
                      <Switch
                        checked={editForm.is_primary_key || false}
                        onCheckedChange={(checked) => handleFormChange('is_primary_key', checked)}
                        disabled={!permissions.canEdit}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Foreign Key</Label>
                        <p className="text-sm text-muted-foreground">
                          This attribute references another table
                        </p>
                      </div>
                      <Switch
                        checked={editForm.is_foreign_key || false}
                        onCheckedChange={(checked) => handleFormChange('is_foreign_key', checked)}
                        disabled={!permissions.canEdit}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_value">Default Value</Label>
                      <Input
                        id="default_value"
                        value={editForm.default_value || ''}
                        onChange={(e) => handleFormChange('default_value', e.target.value)}
                        placeholder="Default value (optional)"
                        disabled={!permissions.canEdit}
                      />
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
                        <Switch
                          checked={incrementConfig.enabled}
                          onCheckedChange={(checked) => setIncrementConfig({ ...incrementConfig, enabled: checked })}
                          disabled={!permissions.canEdit}
                        />
                      </div>

                      {incrementConfig.enabled && (
                        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="prefix">Prefix</Label>
                              <Input
                                id="prefix"
                                value={incrementConfig.prefix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, prefix: e.target.value })}
                                placeholder="e.g., ID-"
                                disabled={!permissions.canEdit}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="suffix">Suffix</Label>
                              <Input
                                id="suffix"
                                value={incrementConfig.suffix}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, suffix: e.target.value })}
                                placeholder="e.g., -2024"
                                disabled={!permissions.canEdit}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start_value">Start Value</Label>
                              <Input
                                id="start_value"
                                type="number"
                                value={incrementConfig.startValue}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, startValue: parseInt(e.target.value) || 1 })}
                                min="1"
                                disabled={!permissions.canEdit}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="step">Step</Label>
                              <Input
                                id="step"
                                type="number"
                                value={incrementConfig.step}
                                onChange={(e) => setIncrementConfig({ ...incrementConfig, step: parseInt(e.target.value) || 1 })}
                                min="1"
                                disabled={!permissions.canEdit}
                              />
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

                {/* Danger Zone */}
                {permissions.canDelete && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                      </CardTitle>
                      <CardDescription>
                        Irreversible and destructive actions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div>
                          <h4 className="font-medium text-red-900">Delete Attribute</h4>
                          <p className="text-sm text-red-700 mt-1">
                            Once you delete an attribute, there is no going back. This will remove the attribute from all data records.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => onDelete(attribute.id)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Attribute
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {isSelectType && (
              <TabsContent value="options" className="flex-1 overflow-y-auto">
                <div className="space-y-6">

                  {/* Attribute Options */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Attribute Options
                          </CardTitle>
                          <CardDescription>
                            Manage the available options for this {attribute.type} field. Drag and drop to reorder.
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
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                            {/* Color Swatch */}
                            <div className="flex items-center gap-2">
                              <ColorInput
                                value={option.color || '#1e40af'}
                                onChange={(color) => handleOptionChange(index, 'color', color)}
                                allowImageVideo={false}
                                disabled={!permissions.canEdit}
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
                                disabled={!permissions.canEdit}
                              />
                            </div>

                            {/* Attribute Label */}
                            <div className="flex-1 min-w-0">
                              <Input
                                value={option.label}
                                onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                                placeholder="Option label"
                                className="h-8"
                                disabled={!permissions.canEdit}
                              />
                            </div>

                            {/* Remove Button */}
                            {permissions.canEdit && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveOption(index)}
                                disabled={options.length === 1}
                                className="h-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}

                        {permissions.canEdit && showNewOption && (
                          <div className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-3">
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
                                  value={newOption.value}
                                  onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                                  placeholder="Option value"
                                  className="h-8"
                                />
                              </div>

                              {/* Attribute Label */}
                              <div className="flex-1 min-w-0">
                                <Input
                                  value={newOption.label}
                                  onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                                  placeholder="Option label"
                                  className="h-8"
                                />
                              </div>

                              {/* Add Button */}
                              <Button
                                onClick={handleAddOption}
                                disabled={!newOption.value.trim() || !newOption.label.trim()}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {options.length === 0 && !showNewOption && (
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
            )}

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
      </div>
    </CentralizedDrawer>
  )
}
