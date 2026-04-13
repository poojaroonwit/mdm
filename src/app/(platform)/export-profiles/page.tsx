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
import { UserCombobox } from '@/components/ui/user-combobox'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  User, 
  Globe,
  Download,
  ArrowLeft,
  Share2
} from 'lucide-react'

interface ExportProfile {
  id: string
  name: string
  description?: string
  data_model: string
  format: string
  columns: string[]
  filters: Array<{ attribute: string; operator: string; value: string }>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  export_profile_sharing: Array<{
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

interface DataModel {
  id: string
  name: string
}

interface Attribute {
  id: string
  name: string
  display_name?: string
  data_type: string
}

const operatorOptions = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' }
]

export default function ExportProfilesPage() {
  const [profiles, setProfiles] = useState<ExportProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<ExportProfile | null>(null)
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [modelAttributes, setModelAttributes] = useState<Attribute[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)
  const [columnSearch, setColumnSearch] = useState('')
  const [exporting, setExporting] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataModel: '',
    format: 'xlsx',
    columns: [] as string[],
    filters: [{ attribute: '', operator: 'equals', value: '' }],
    isPublic: false,
    sharing: [] as SharingConfig[]
  })

  useEffect(() => {
    fetchProfiles()
    fetchDataModels()
  }, [])

  useEffect(() => {
    if (formData.dataModel) {
      fetchModelAttributes(formData.dataModel)
    } else {
      setModelAttributes([])
    }
  }, [formData.dataModel])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/export-profiles')
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
      const response = await fetch('/api/data-models')
      if (response.ok) {
        const data = await response.json()
        setDataModels(data.dataModels || [])
      }
    } catch (error) {
      console.error('Error fetching data models:', error)
    }
  }

  const fetchModelAttributes = async (modelId: string) => {
    setLoadingAttributes(true)
    try {
      const response = await fetch(`/api/data-models/${modelId}/attributes`)
      if (response.ok) {
        const data = await response.json()
        setModelAttributes(data.attributes || [])
      }
    } catch (error) {
      console.error('Error fetching model attributes:', error)
    } finally {
      setLoadingAttributes(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/export-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      const response = await fetch(`/api/export-profiles/${selectedProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      const response = await fetch(`/api/export-profiles/${selectedProfile.id}`, {
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
      format: 'xlsx',
      columns: [],
      filters: [{ attribute: '', operator: 'equals', value: '' }],
      isPublic: false,
      sharing: []
    })
    setColumnSearch('')
  }

  const openEditDialog = (profile: ExportProfile) => {
    setSelectedProfile(profile)
    setFormData({
      name: profile.name,
      description: profile.description || '',
      dataModel: profile.data_model,
      format: profile.format,
      columns: profile.columns,
      filters: profile.filters.length > 0 ? profile.filters : [{ attribute: '', operator: 'equals', value: '' }],
      isPublic: profile.is_public,
      sharing: profile.export_profile_sharing.map(s => ({
        type: s.sharing_type as 'all_users' | 'group' | 'specific_users',
        targetId: s.target_id,
        targetGroup: s.target_group
      }))
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (profile: ExportProfile) => {
    setSelectedProfile(profile)
    setDeleteDialogOpen(true)
  }

  const addFilter = () => {
    setFormData(prev => ({
      ...prev,
      filters: [...prev.filters, { attribute: '', operator: 'equals', value: '' }]
    }))
  }

  const removeFilter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index)
    }))
  }

  const updateFilter = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const toggleColumn = (column: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.includes(column)
        ? prev.columns.filter(c => c !== column)
        : [...prev.columns, column]
    }))
  }

  const toggleSelectAllColumns = (checked: boolean) => {
    if (checked) {
      const allColumnNames = modelAttributes.map(attr => attr.name)
      setFormData(prev => ({ ...prev, columns: allColumnNames }))
    } else {
      setFormData(prev => ({ ...prev, columns: [] }))
    }
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

  const handleExport = async (profileId: string) => {
    setExporting(profileId)
    try {
      const response = await fetch(`/api/export-profiles/${profileId}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export_${new Date().toISOString().split('T')[0]}.xlsx`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
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
            <h1 className="text-3xl font-bold tracking-tight">Export Profiles</h1>
            <p className="text-muted-foreground">
              Manage export profiles and configure sharing permissions
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Export Profile</DialogTitle>
                <DialogDescription>
                  Create a new export profile with custom columns, filters, and sharing settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
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
                    <Label htmlFor="dataModel">Data Model</Label>
                    <Select value={formData.dataModel} onValueChange={(value) => setFormData(prev => ({ ...prev, dataModel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data model" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <RadioGroup value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="xlsx" id="xlsx" />
                        <Label htmlFor="xlsx">Excel (.xlsx)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv">CSV (.csv)</Label>
                      </div>
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

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label>Columns</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Search column..."
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          className="h-8 w-56"
                        />
                        <Checkbox
                          id="selectAllColumns"
                          checked={modelAttributes.length > 0 && formData.columns.length === modelAttributes.length}
                          onCheckedChange={(c) => toggleSelectAllColumns(!!c)}
                        />
                        <Label htmlFor="selectAllColumns" className="text-sm">Select All</Label>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                      {loadingAttributes ? (
                        <div className="text-sm text-muted-foreground">Loading attributes...</div>
                      ) : modelAttributes.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Select a data model to load columns.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {modelAttributes
                            .filter(attr => {
                              const q = columnSearch.trim().toLowerCase()
                              if (!q) return true
                              const name = (attr.display_name || attr.name || '').toLowerCase()
                              return name.includes(q)
                            })
                            .map(attr => (
                              <div key={attr.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={attr.id}
                                  checked={formData.columns.includes(attr.name)}
                                  onCheckedChange={() => toggleColumn(attr.name)}
                                />
                                <Label htmlFor={attr.id} className="text-sm">
                                  {attr.display_name || attr.name}
                                </Label>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Filters</Label>
                    <div className="space-y-2">
                      {formData.filters.map((filter, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <Select
                            value={filter.attribute}
                            onValueChange={(value) => updateFilter(index, 'attribute', value)}
                          >
                            <SelectTrigger className="col-span-4">
                              <SelectValue placeholder="Attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {modelAttributes.map(attr => (
                                <SelectItem key={attr.id} value={attr.name}>
                                  {attr.display_name || attr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={filter.operator}
                            onValueChange={(value) => updateFilter(index, 'operator', value)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operatorOptions.map(op => (
                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="col-span-4"
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFilter(index)}
                            className="col-span-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addFilter}>
                        Add Filter
                      </Button>
                    </div>
                  </div>

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
                            <Input
                              className="col-span-4"
                              placeholder="Group name"
                              value={share.targetGroup || ''}
                              onChange={(e) => updateSharing(index, 'targetGroup', e.target.value)}
                            />
                          )}
                          {share.type === 'specific_users' && (
                            <div className="col-span-4">
                              <UserCombobox
                                value={share.targetId}
                                onValueChange={(val) => updateSharing(index, 'targetId', val)}
                                placeholder="Search user..."
                              />
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSharing(index)}
                            className="col-span-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={addSharing}>
                        Add Sharing Rule
                      </Button>
                    </div>
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold mb-2">No export profiles found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first export profile to get started with automated data exports.
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
                  <TableHead>Format</TableHead>
                  <TableHead>Columns</TableHead>
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
                      <Badge variant="outline">{profile.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{profile.columns.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {profile.export_profile_sharing.map((share, index) => (
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
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(profile.id)}
                          disabled={exporting === profile.id}
                        >
                          {exporting === profile.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {exporting === profile.id ? 'Exporting...' : 'Export'}
                        </Button>
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Export Profile</DialogTitle>
              <DialogDescription>
                Update the export profile settings and sharing configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Profile Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter profile name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataModel">Data Model</Label>
                  <Select value={formData.dataModel} onValueChange={(value) => setFormData(prev => ({ ...prev, dataModel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data model" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter profile description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <RadioGroup value={formData.format} onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="xlsx" id="edit-xlsx" />
                      <Label htmlFor="edit-xlsx">Excel (.xlsx)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csv" id="edit-csv" />
                      <Label htmlFor="edit-csv">CSV (.csv)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
                    />
                    <Label htmlFor="edit-isPublic">Make this profile public</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Columns</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search column..."
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        className="h-8 w-56"
                      />
                      <Checkbox
                        id="edit-selectAllColumns"
                        checked={modelAttributes.length > 0 && formData.columns.length === modelAttributes.length}
                        onCheckedChange={(c) => toggleSelectAllColumns(!!c)}
                      />
                      <Label htmlFor="edit-selectAllColumns" className="text-sm">Select All</Label>
                    </div>
                  </div>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {loadingAttributes ? (
                      <div className="text-sm text-muted-foreground">Loading attributes...</div>
                    ) : modelAttributes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Select a data model to load columns.</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {modelAttributes
                          .filter(attr => {
                            const q = columnSearch.trim().toLowerCase()
                            if (!q) return true
                            const name = (attr.display_name || attr.name || '').toLowerCase()
                            return name.includes(q)
                          })
                          .map(attr => (
                            <div key={attr.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-${attr.id}`}
                                checked={formData.columns.includes(attr.name)}
                                onCheckedChange={() => toggleColumn(attr.name)}
                              />
                              <Label htmlFor={`edit-${attr.id}`} className="text-sm">
                                {attr.display_name || attr.name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Filters</Label>
                  <div className="space-y-2">
                    {formData.filters.map((filter, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2">
                        <Select
                          value={filter.attribute}
                          onValueChange={(value) => updateFilter(index, 'attribute', value)}
                        >
                          <SelectTrigger className="col-span-4">
                            <SelectValue placeholder="Attribute" />
                          </SelectTrigger>
                          <SelectContent>
                            {modelAttributes.map(attr => (
                              <SelectItem key={attr.id} value={attr.name}>
                                {attr.display_name || attr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => updateFilter(index, 'operator', value)}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorOptions.map(op => (
                              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          className="col-span-4"
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(index)}
                          className="col-span-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addFilter}>
                      Add Filter
                    </Button>
                  </div>
                </div>

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
                          <Input
                            className="col-span-4"
                            placeholder="Group name"
                            value={share.targetGroup || ''}
                            onChange={(e) => updateSharing(index, 'targetGroup', e.target.value)}
                          />
                        )}
                        {share.type === 'specific_users' && (
                          <div className="col-span-4">
                            <UserCombobox
                              value={share.targetId}
                              onValueChange={(val) => updateSharing(index, 'targetId', val)}
                              placeholder="Search user..."
                            />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSharing(index)}
                          className="col-span-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addSharing}>
                      Add Sharing Rule
                    </Button>
                  </div>
                </div>
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
              <DialogTitle>Delete Export Profile</DialogTitle>
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
