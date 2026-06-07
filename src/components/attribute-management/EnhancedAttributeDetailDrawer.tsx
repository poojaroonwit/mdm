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
import {
  Database,
  Type,
  Activity,
  Settings,
  Plus,
  Trash2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import { Attribute } from '@/lib/attribute-management'
import { useSpacePermissions } from '@/hooks/use-space-permissions'
import toast from 'react-hot-toast'
import { AttributeActivityTab } from './AttributeActivityTab'
import { AttributeOptionsTab } from './AttributeOptionsTab'
import { AttributeQualityTab } from './AttributeQualityTab'

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
                <AttributeOptionsTab
                  attributeType={attribute.type}
                  canEdit={permissions.canEdit}
                  newOption={newOption}
                  options={options}
                  showNewOption={showNewOption}
                  handleAddNewOption={handleAddNewOption}
                  handleAddOption={handleAddOption}
                  handleOptionChange={handleOptionChange}
                  handleRemoveOption={handleRemoveOption}
                  setNewOption={setNewOption}
                />
              </TabsContent>
            )}

            <TabsContent value="quality" className="flex-1 overflow-y-auto">
              <AttributeQualityTab loadingQuality={loadingQuality} qualityStats={qualityStats} />
            </TabsContent>

            <TabsContent value="activity" className="flex-1 overflow-y-auto">
              <AttributeActivityTab activityData={activityData} loadingActivity={loadingActivity} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CentralizedDrawer>
  )
}
