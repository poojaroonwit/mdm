'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { AttributeActivityTab } from './AttributeActivityTab'
import { AttributeDetailsTab } from './AttributeDetailsTab'
import { AttributeOptionsTab } from './AttributeOptionsTab'
import { AttributePositionTab } from './AttributePositionTab'
import { AttributeQualityTab } from './AttributeQualityTab'
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

          <AttributeDetailsTab
            attribute={attribute}
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            incrementConfig={incrementConfig}
            setIncrementConfig={setIncrementConfig}
          />

          <AttributePositionTab
            attribute={attribute}
            allAttributes={allAttributes}
            canMoveUp={!!canMoveUp}
            canMoveDown={!!canMoveDown}
            moveAttribute={moveAttribute}
          />
          <AttributeOptionsTab
            attribute={attribute}
            showNewOption={showNewOption}
            newOption={newOption}
            setNewOption={setNewOption}
            editingOption={editingOption}
            editingOptionData={editingOptionData}
            setEditingOptionData={setEditingOptionData}
            handleAddNewOption={handleAddNewOption}
            handleSaveNewOption={handleSaveNewOption}
            handleCancelNewOption={handleCancelNewOption}
            handleEditOption={handleEditOption}
            handleSaveOption={handleSaveOption}
            handleCancelEditOption={handleCancelEditOption}
            handleRemoveOption={handleRemoveOption}
            onSave={onSave}
          />

          <AttributeQualityTab
            loadingQuality={loadingQuality}
            qualityStats={qualityStats}
          />

          <AttributeActivityTab
            activityData={activityData}
            loadingActivity={loadingActivity}
          />
        </Tabs>
      </div>
    </CentralizedDrawer>
  )
}
