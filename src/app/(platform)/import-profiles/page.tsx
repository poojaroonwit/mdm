'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserCombobox } from '@/components/ui/user-combobox'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  User, 
  Globe,
  Upload,
  ArrowLeft,
  Share2,
  FileText,
  Database,
  Clock,
  Hash
} from 'lucide-react'

interface ImportProfile {
  id: string
  name: string
  description?: string
  data_model: string
  file_types: string[]
  header_row: number
  data_start_row: number
  chunk_size: number
  max_items?: number
  import_type: 'insert' | 'upsert' | 'delete'
  primary_key_attribute?: string
  date_format: string
  time_format: string
  boolean_format: string
  attribute_mapping: Record<string, string>
  attribute_options: Record<string, string[]>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  import_profile_sharing: Array<{
    id: string
    sharing_type: string
    target_id?: string
    target_group?: string
  }>
}

interface SharingConfig {
  type: 'all_users' | 'group' | 'specific_users'
  targetId?: string
  targetGroup?: string
}

const dataModels = [
  'Customer', 'Company', 'Source', 'Industry', 'Event', 
  'Position', 'Business Profile', 'Title', 'Call Workflow Status'
]

const fileTypes = ['csv', 'xlsx', 'xls']
const importTypes = [
  { value: 'insert', label: 'Insert Only' },
  { value: 'upsert', label: 'Insert or Update' },
  { value: 'delete', label: 'Delete Records' }
]

const dateFormats = [
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY/MM/DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY'
]

const timeFormats = [
  'HH:mm:ss',
  'HH:mm',
  'h:mm:ss A',
  'h:mm A'
]

const booleanFormats = [
  'true/false',
  'yes/no',
  '1/0',
  'Y/N',
  'on/off',
  'enabled/disabled'
]

type DataModel = { id: string; name: string; display_name: string }
type DataModelAttribute = { id: string; name: string; display_name: string; type?: string; data_type?: string }

export default function ImportProfilesPage() {
  const [profiles, setProfiles] = useState<ImportProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ImportProfile | null>(null)
  const [models, setModels] = useState<DataModel[]>([])
  const [modelAttributes, setModelAttributes] = useState<DataModelAttribute[]>([])
  const [selectedModelId, setSelectedModelId] = useState('')
  const [attributeSearch, setAttributeSearch] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataModel: '',
    fileTypes: ['csv'],
    headerRow: 1,
    dataStartRow: 2,
    chunkSize: 1000,
    maxItems: '',
    importType: 'insert' as 'insert' | 'upsert' | 'delete',
    primaryKeyAttribute: '',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    booleanFormat: 'true/false',
    attributeMapping: {} as Record<string, string>,
    attributeOptions: {} as Record<string, string[]>,
    optionImportMapping: {} as Record<string, Record<string, string>>, // { [attributeName]: { [internalOption]: incomingValue } }
    selectedAttributes: [] as string[],
    isPublic: false,
    sharing: [] as SharingConfig[]
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (createDialogOpen) {
      void fetchDataModels()
    }
  }, [createDialogOpen])

  useEffect(() => {
    if (!selectedModelId) {
      setModelAttributes([])
      return
    }
    const m = models.find(x => x.id === selectedModelId)
    setFormData(prev => ({ ...prev, dataModel: m?.name || m?.display_name || '' }))
    void fetchModelAttributes(selectedModelId)
  }, [selectedModelId])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/import-profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDataModels = async () => {
    try {
      const res = await fetch('/api/data-models?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setModels(data.dataModels || [])
      }
    } catch (e) {
      console.error('Error loading models', e)
    }
  }

  const fetchModelAttributes = async (id: string) => {
    try {
      const res = await fetch(`/api/data-models/${id}/attributes`)
      if (res.ok) {
        const data = await res.json()
        setModelAttributes(data.attributes || [])
      }
    } catch (e) {
      console.error('Error loading attributes', e)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/import-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxItems: formData.maxItems ? parseInt(formData.maxItems) : null
        })
      })

      if (response.ok) {
        setCreateDialogOpen(false)
        resetForm()
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const handleUpdate = async () => {
    if (!selectedProfile) return

    try {
      const response = await fetch(`/api/import-profiles/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          maxItems: formData.maxItems ? parseInt(formData.maxItems) : null
        })
      })

      if (response.ok) {
        setEditDialogOpen(false)
        setSelectedProfile(null)
        resetForm()
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedProfile) return

    try {
      const response = await fetch(`/api/import-profiles/${selectedProfile.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setSelectedProfile(null)
        fetchProfiles()
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dataModel: '',
      fileTypes: ['csv'],
      headerRow: 1,
      dataStartRow: 2,
      chunkSize: 1000,
      maxItems: '',
      importType: 'insert',
      primaryKeyAttribute: '',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      booleanFormat: 'true/false',
      attributeMapping: {},
      attributeOptions: {},
      optionImportMapping: {},
      selectedAttributes: [],
      isPublic: false,
      sharing: []
    })
  }

  const openEditDialog = (profile: ImportProfile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      dataModel: profile.data_model,
      fileTypes: profile.file_types,
      headerRow: profile.header_row,
      dataStartRow: profile.data_start_row,
      chunkSize: profile.chunk_size,
      maxItems: profile.max_items?.toString() || '',
      importType: profile.import_type,
      primaryKeyAttribute: profile.primary_key_attribute || '',
      dateFormat: profile.date_format,
      timeFormat: profile.time_format,
      booleanFormat: profile.boolean_format,
      attributeMapping: profile.attribute_mapping,
      attributeOptions: profile.attribute_options,
      isPublic: profile.is_public,
      sharing: profile.import_profile_sharing.map(s => ({
        type: s.sharing_type as 'all_users' | 'group' | 'specific_users',
        targetId: s.target_id,
        targetGroup: s.target_group
      })),
      optionImportMapping: {},
      selectedAttributes: []
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (profile: ImportProfile) => {
    setSelectedProfile(profile)
    setDeleteDialogOpen(true)
  }

  const toggleFileType = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter(ft => ft !== fileType)
        : [...prev.fileTypes, fileType]
    }))
  }

  const updateAttributeMapping = (attribute: string, fileColumn: string) => {
    setFormData(prev => ({
      ...prev,
      attributeMapping: {
        ...prev.attributeMapping,
        [attribute]: fileColumn
      }
    }))
  }

  const toggleSelectedAttribute = (attribute: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedAttributes.includes(attribute)
      const next = isSelected
        ? prev.selectedAttributes.filter(a => a !== attribute)
        : [...prev.selectedAttributes, attribute]
      return { ...prev, selectedAttributes: next }
    })
  }

  const toggleSelectAllAttributes = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedAttributes: checked ? modelAttributes.map(a => a.name) : []
    }))
  }

  const updateAttributeOptions = (attribute: string, options: string[]) => {
    setFormData(prev => ({
      ...prev,
      attributeOptions: {
        ...prev.attributeOptions,
        [attribute]: options
      }
    }))
  }

  const updateOptionImportMapping = (attribute: string, optionKey: string, mappedValue: string) => {
    setFormData(prev => ({
      ...prev,
      optionImportMapping: {
        ...prev.optionImportMapping,
        [attribute]: {
          ...(prev.optionImportMapping[attribute] || {}),
          [optionKey]: mappedValue
        }
      }
    }))
  }

  const addSharing = () => {
    setFormData(prev => ({
      ...prev,
      sharing: [...prev.sharing, { type: 'all_users' }]
    }))
  }

  const removeSharing = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sharing: prev.sharing.filter((_, i) => i !== index)
    }))
  }

  const updateSharing = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sharing: prev.sharing.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }))
  }

  const getSharingIcon = (type: string) => {
    switch (type) {
      case 'all_users': return <Globe className="h-4 w-4" />
      case 'group': return <Users className="h-4 w-4" />
      case 'specific_users': return <User className="h-4 w-4" />
      default: return <Share2 className="h-4 w-4" />
    }
  }

  const getSharingLabel = (type: string) => {
    switch (type) {
      case 'all_users': return 'All Users'
      case 'group': return 'Group'
      case 'specific_users': return 'Specific Users'
      default: return type
    }
  }

  const getImportTypeColor = (type: string) => {
    switch (type) {
      case 'insert': return 'bg-blue-500'
      case 'upsert': return 'bg-green-500'
      case 'delete': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading profiles...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.history.back()}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Import Profiles</h1>
            <p className="text-muted-foreground">
              Manage import profiles and configure data mapping, formats, and sharing permissions
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Import Profile</DialogTitle>
                <DialogDescription>
                  Create a new import profile with data mapping, format settings, and sharing configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <Tabs defaultValue="profile">
                  <TabsList className="mb-2">
                    <TabsTrigger value="profile">Profile Settings</TabsTrigger>
                    <TabsTrigger value="mapping">Attribute Mapping</TabsTrigger>
                    <TabsTrigger value="options">Attribute Option Mapping</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Profile Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter profile name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Model</Label>
                    <Select value={selectedModelId} onValueChange={(value) => setSelectedModelId(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map(model => (
                          <SelectItem key={model.id} value={model.id}>{model.display_name || model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                    </div>

                    <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter profile description"
                    rows={3}
                  />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>File Types</Label>
                    <div className="space-y-2">
                      {fileTypes.map(fileType => (
                        <div key={fileType} className="flex items-center space-x-2">
                          <Checkbox
                            id={fileType}
                            checked={formData.fileTypes.includes(fileType)}
                            onCheckedChange={() => toggleFileType(fileType)}
                          />
                          <Label htmlFor={fileType} className="text-sm">{fileType.toUpperCase()}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Import Type</Label>
                    <RadioGroup value={formData.importType} onValueChange={(value) => setFormData(prev => ({ ...prev, importType: value as any }))}>
                      {importTypes.map(type => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={type.value} />
                          <Label htmlFor={type.value} className="text-sm">{type.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
                      />
                      <Label htmlFor="isPublic">Make this profile public</Label>
                    </div>
                  </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headerRow">Header Row</Label>
                    <Input
                      id="headerRow"
                      type="number"
                      value={formData.headerRow}
                      onChange={(e) => setFormData(prev => ({ ...prev, headerRow: parseInt(e.target.value) || 1 }))}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataStartRow">Data Start Row</Label>
                    <Input
                      id="dataStartRow"
                      type="number"
                      value={formData.dataStartRow}
                      onChange={(e) => setFormData(prev => ({ ...prev, dataStartRow: parseInt(e.target.value) || 2 }))}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chunkSize">Chunk Size</Label>
                    <Input
                      id="chunkSize"
                      type="number"
                      value={formData.chunkSize}
                      onChange={(e) => setFormData(prev => ({ ...prev, chunkSize: parseInt(e.target.value) || 1000 }))}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxItems">Max Items (optional)</Label>
                    <Input
                      id="maxItems"
                      type="number"
                      value={formData.maxItems}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxItems: e.target.value }))}
                      placeholder="No limit"
                    />
                  </div>
                    </div>

                {formData.importType !== 'insert' && (
                  <div className="space-y-2">
                    <Label htmlFor="primaryKeyAttribute">Primary Key Attribute</Label>
                    <Select value={formData.primaryKeyAttribute} onValueChange={(value) => setFormData(prev => ({ ...prev, primaryKeyAttribute: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary key attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelAttributes.map(attr => (
                          <SelectItem key={attr.id} value={attr.name}>{attr.display_name || attr.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                    <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={formData.dateFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, dateFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormats.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select value={formData.timeFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, timeFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeFormats.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Boolean Format</Label>
                    <Select value={formData.booleanFormat} onValueChange={(value) => setFormData(prev => ({ ...prev, booleanFormat: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {booleanFormats.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                    </div>

                    {/* Sharing can remain in settings */}
                    <div>
                      <Label>Sharing Configuration</Label>
                      <div className="space-y-2">
                        {formData.sharing.map((share, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2">
                            <Select
                              value={share.type}
                              onValueChange={(value) => updateSharing(index, 'type', value)}
                            >
                              <SelectTrigger className="col-span-4">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all_users">All Users</SelectItem>
                                <SelectItem value="group">Group</SelectItem>
                                <SelectItem value="specific_users">Specific Users</SelectItem>
                              </SelectContent>
                            </Select>
                            {share.type === 'group' && (
                              <Input className="col-span-4" placeholder="Group name" value={share.targetGroup || ''} onChange={(e) => updateSharing(index, 'targetGroup', e.target.value)} />
                            )}
                            {share.type === 'specific_users' && (
                              <div className="col-span-4">
                                <UserCombobox value={share.targetId} onValueChange={(val) => updateSharing(index, 'targetId', val)} placeholder="Search user..." />
                              </div>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => removeSharing(index)} className="col-span-1">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addSharing}>Add Sharing Rule</Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="mapping" className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Attribute Mapping</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search attribute..."
                          value={attributeSearch}
                          onChange={(e) => setAttributeSearch(e.target.value)}
                          className="h-8 w-56"
                        />
                        <Checkbox
                          id="selectAllAttributes"
                          checked={modelAttributes.length > 0 && formData.selectedAttributes.length === modelAttributes.length}
                          onCheckedChange={(c) => toggleSelectAllAttributes(!!c)}
                        />
                        <Label htmlFor="selectAllAttributes" className="text-sm">Select All</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {modelAttributes.length === 0 && (
                        <div className="text-sm text-muted-foreground">Select a data model to load attributes.</div>
                      )}
                      {modelAttributes
                        .filter(attr => {
                          const q = attributeSearch.trim().toLowerCase()
                          if (!q) return true
                          const name = (attr.display_name || attr.name || '').toLowerCase()
                          return name.includes(q)
                        })
                        .map(attr => (
                        <div key={attr.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5 flex items-center gap-2">
                            <Checkbox
                              id={`attr-${attr.id}`}
                              checked={formData.selectedAttributes.includes(attr.name)}
                              onCheckedChange={() => toggleSelectedAttribute(attr.name)}
                            />
                            <label htmlFor={`attr-${attr.id}`} className="text-sm font-medium cursor-pointer">
                              {attr.display_name || attr.name}
                            </label>
                          </div>
                          <div className="col-span-7">
                            <Input
                              placeholder="File column name"
                              value={formData.attributeMapping[attr.name] || ''}
                              onChange={(e) => updateAttributeMapping(attr.name, e.target.value)}
                              disabled={!formData.selectedAttributes.includes(attr.name)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="options" className="space-y-4">
                    <Label>Attribute Option Mapping</Label>
                    <div className="space-y-3">
                      {modelAttributes
                        .filter(a => ((a.type || a.data_type || '').toUpperCase() === 'SELECT' || (a.type || a.data_type || '').toUpperCase() === 'MULTI_SELECT'))
                        .map(attr => {
                          // Derive option list from attribute.options (API) or fallback to formData.attributeOptions
                          let optionList: string[] = []
                          const source = (attr as any).options ?? formData.attributeOptions[attr.name]
                          if (Array.isArray(source)) {
                            optionList = source.map((it: any) => typeof it === 'string' ? it : (it?.value ?? it?.label ?? ''))
                              .filter((s: string) => !!s)
                          } else if (typeof source === 'string') {
                            try {
                              const parsed = JSON.parse(source)
                              if (Array.isArray(parsed)) {
                                optionList = parsed.map((it: any) => typeof it === 'string' ? it : (it?.value ?? it?.label ?? ''))
                                  .filter((s: string) => !!s)
                              }
                            } catch {}
                          }
                          return (
                            <div key={attr.id} className="rounded-md border p-3 space-y-3">
                              <div className="text-sm font-medium">
                                {attr.display_name || attr.name}
                              </div>
                              {optionList.length === 0 && (
                                <div className="text-xs text-muted-foreground">No options defined. Add options to map incoming values.</div>
                              )}
                              <div className="space-y-2">
                                {optionList.map((opt) => (
                                  <div key={opt} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-5 text-sm">
                                      {opt}
                                    </div>
                                    <div className="col-span-7">
                                      <Input
                                        placeholder="Incoming value to map"
                                        value={formData.optionImportMapping[attr.name]?.[opt] || ''}
                                        onChange={(e) => updateOptionImportMapping(attr.name, opt, e.target.value)}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      {modelAttributes.length > 0 && modelAttributes.filter(a => ((a.type || a.data_type || '').toUpperCase() === 'SELECT' || (a.type || a.data_type || '').toUpperCase() === 'MULTI_SELECT')).length === 0 && (
                        <div className="text-sm text-muted-foreground">No selectable attributes for this model.</div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name || !formData.dataModel}>
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Profiles List */}
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No import profiles found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first import profile to get started with automated data imports.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Data Model</TableHead>
                  <TableHead>File Types</TableHead>
                  <TableHead>Import Type</TableHead>
                  <TableHead>Chunk Size</TableHead>
                  <TableHead>Sharing</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        {profile.description && (
                          <div className="text-sm text-muted-foreground">{profile.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{profile.data_model}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {profile.file_types.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getImportTypeColor(profile.import_type)} text-white`}>
                        {profile.import_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {profile.chunk_size.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {profile.import_profile_sharing.map((share, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getSharingIcon(share.sharing_type)}
                            <span className="ml-1">{getSharingLabel(share.sharing_type)}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.is_public ? "default" : "secondary"}>
                        {profile.is_public ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(profile)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(profile)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Dialog - Similar structure to create dialog but with pre-filled data */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Import Profile</DialogTitle>
              <DialogDescription>
                Update the import profile settings and sharing configuration
              </DialogDescription>
            </DialogHeader>
            {/* Similar form structure as create dialog but with edit-specific handlers */}
            <div className="space-y-6">
              {/* Form content would be similar to create dialog */}
              <div className="text-center py-8">
                <p className="text-muted-foreground">Edit form content would go here</p>
                <p className="text-sm text-muted-foreground mt-2">This would be the same form structure as the create dialog</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name || !formData.dataModel}>
                Update Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Import Profile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedProfile?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
