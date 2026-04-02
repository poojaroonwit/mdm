'use client'

import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollableList } from '@/components/ui/scrollable-list'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Search, Edit, Trash2, Database, Type, Settings, GitBranch, MoreVertical, Folder, FolderOpen, FolderPlus } from 'lucide-react'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'

type DataModel = {
  id: string
  name: string
  display_name: string
  slug?: string
  description?: string | null
  folder_id?: string | null
  created_at: string
  is_active: boolean
  data_model_attributes?: any
}

type Attribute = {
  id: string
  data_model_id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
  options?: any[]
  created_at: string
  updated_at: string
}

export default function DataModelsPage() {
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<DataModel[]>([])
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [editingModel, setEditingModel] = useState<DataModel | null>(null)
  const [form, setForm] = useState({ name: '', display_name: '', description: '', source_type: 'INTERNAL', slug: '', folder_id: '' })
  const [slugEdited, setSlugEdited] = useState(false)
  const [spaces, setSpaces] = useState<any[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [spacesError, setSpacesError] = useState<string | null>(null)
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [showAttributeDialog, setShowAttributeDialog] = useState(false)
  const [attributeForm, setAttributeForm] = useState({
    name: '',
    display_name: '',
    data_type: 'text',
    is_required: false,
    is_unique: false,
    default_value: '',
    options: [],
    order_index: 0
  })
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  
  // Folder management
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [folderForm, setFolderForm] = useState({ name: '', parent_id: '' })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let filteredModels = models.filter(m => m.name.toLowerCase().includes(q) || m.display_name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q))
    
    // Filter by selected folder
    if (selectedFolder) {
      filteredModels = filteredModels.filter(m => (m as any).folder_id === selectedFolder)
    } else {
      // Show only root level models when no folder is selected
      filteredModels = filteredModels.filter(m => !(m as any).folder_id)
    }
    
    return filteredModels
  }, [models, search, selectedFolder])

  async function loadModels() {
    setLoading(true)
    try {
      const res = await fetch(`/api/data-models`)
      const json = await res.json()
      setModels(json.dataModels || [])
      setActiveSpaceId(json.spaceId || null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
    loadSpaces()
  }, [])

  useEffect(() => {
    loadFolders(activeSpaceId)
  }, [activeSpaceId])

  const loadFolders = async (spaceId?: string | null) => {
    try {
      const params = new URLSearchParams({ type: 'data_model' })
      if (spaceId) {
        params.set('space_id', spaceId)
      }
      const res = await fetch(`/api/folders?${params}`)
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
      if (!activeSpaceId && json.spaceId) {
        setActiveSpaceId(json.spaceId)
      }
    } catch (e) {
      setFolders([])
    }
  }

  const createFolder = async () => {
    if (!folderForm.name.trim()) return
    
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderForm.name,
          type: 'data_model',
          space_id: activeSpaceId || undefined,
          parent_id: folderForm.parent_id || null
        })
      })

      if (!res.ok) throw new Error('Failed to create folder')
      const json = await res.json().catch(() => ({}))
      setShowCreateFolderDialog(false)
      setFolderForm({ name: '', parent_id: '' })
      if (json.folder?.id) {
        setSelectedFolder(json.folder.id)
      }
      await loadFolders(activeSpaceId || json.spaceId || null)
    } catch (e) {
      alert('Failed to create folder')
    }
  }

  function openCreate() {
    setEditingModel(null)
    setForm({ name: '', display_name: '', description: '', source_type: 'INTERNAL', slug: '', folder_id: selectedFolder || '' })
    setSlugEdited(false)
    setSelectedSpaceIds([])
    setShowModelDialog(true)
  }

  async function openEdit(model: DataModel) {
    setEditingModel(model)
    setForm({
      name: model.name,
      display_name: model.display_name,
      description: model.description || '',
      source_type: (model as any).source_type || 'INTERNAL',
      slug: (model as any).slug || '',
      folder_id: model.folder_id || '',
    })
    setSlugEdited(true)
    
    // Load attributes for this model BEFORE opening dialog
    await loadAttributes(model.id)

    // Load associated spaces
    try {
      console.log('Loading spaces for model:', model.id)
      const res = await fetch(`/api/data-models/${model.id}/spaces`)
      console.log('Spaces API response:', res.status, res.statusText)
      const json = await res.json()
      console.log('Spaces data:', json)
      const spaceIds = (json.spaces || []).map((s: any) => s.id)
      console.log('Setting selected space IDs:', spaceIds)
      setSelectedSpaceIds(spaceIds)
    } catch (error) {
      console.error('Error loading spaces:', error)
      setSelectedSpaceIds([])
    }
    
    // Open dialog after attributes are loaded
    setShowModelDialog(true)
  }

  async function loadAttributes(modelId: string) {
    setAttributesLoading(true)
    try {
      console.log('Loading attributes for model:', modelId)
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      console.log('Attributes API response status:', res.status)
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const json = await res.json()
      console.log('Attributes API response:', json)
      const attributesData = json.attributes || []
      console.log('Setting attributes:', attributesData)
      setAttributes(attributesData)
    } catch (error) {
      console.error('Error loading attributes:', error)
      setAttributes([])
    } finally {
      setAttributesLoading(false)
    }
  }

  async function loadSpaces() {
    setSpacesLoading(true)
    setSpacesError(null)
    try {
      console.log('Loading spaces...')
      const res = await fetch(`/api/spaces?page=1&limit=1000`)
      console.log('Spaces API response:', res.status, res.statusText)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load spaces')
      }
      const json = await res.json()
      console.log('Spaces loaded:', json.spaces)
      setSpaces(json.spaces || [])
    } catch (e: any) {
      console.error('Error loading spaces:', e)
      setSpacesError(e.message || 'Failed to load spaces')
    } finally {
      setSpacesLoading(false)
    }
  }

  async function saveModel() {
    const method = editingModel ? 'PUT' : 'POST'
    const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
    const payload = editingModel
      ? { ...form, folder_id: form.folder_id || null, folder_space_id: activeSpaceId || undefined }
      : { ...form, folder_id: form.folder_id || null, folder_space_id: activeSpaceId || selectedSpaceIds[0] || null, space_ids: selectedSpaceIds }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      // If editing, update spaces associations separately
      if (editingModel) {
        await fetch(`/api/data-models/${editingModel.id}/spaces`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ space_ids: selectedSpaceIds })
        })
      }
      setShowModelDialog(false)
      await loadModels()
    }
  }

  async function deleteModel(model: DataModel) {
    if (!confirm(`Delete model "${model.display_name}"?`)) return
    const res = await fetch(`/api/data-models/${model.id}`, { method: 'DELETE' })
    if (res.ok) await loadModels()
  }

  function openCreateAttribute() {
    setAttributeForm({
      name: '',
      display_name: '',
      data_type: 'text',
      is_required: false,
      is_unique: false,
      default_value: '',
      options: [],
      order_index: 0
    })
    setShowAttributeDialog(true)
  }

  const openAttributeDrawer = (attribute: Attribute) => {
    console.log('Opening attribute drawer for:', attribute)
    setSelectedAttribute(attribute)
    setShowAttributeDrawer(true)
  }

  const handleAttributeSave = (updatedAttribute: Attribute) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === updatedAttribute.id ? updatedAttribute : attr
    ))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
  }

  const handleAttributeDelete = (attributeId: string) => {
    setAttributes(prev => prev.filter(attr => attr.id !== attributeId))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
  }

  const handleAttributeReorder = (attributeId: string, newOrder: number) => {
    setAttributes(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const currentIndex = sorted.findIndex(attr => attr.id === attributeId)
      const targetIndex = sorted.findIndex(attr => attr.order === newOrder)
      
      if (currentIndex === -1 || targetIndex === -1) return prev
      
      const newSorted = [...sorted]
      const [movedItem] = newSorted.splice(currentIndex, 1)
      newSorted.splice(targetIndex, 0, movedItem)
      
      return newSorted.map((attr, index) => ({
        ...attr,
        order: index
      }))
    })
  }

  async function saveAttribute() {
    if (!editingModel) return
    
    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeForm)
      })
      
      if (res.ok) {
        setShowAttributeDialog(false)
        await loadAttributes(editingModel.id)
      } else {
        const error = await res.json()
        console.error('Error creating attribute:', error)
        alert('Failed to create attribute: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating attribute:', error)
      alert('Failed to create attribute')
    }
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Models</h1>
            <p className="text-muted-foreground">Define dynamic models and attributes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="default" asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/data/models/erd">
                <GitBranch className="mr-2 h-4 w-4" />
                ERD View
              </a>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Model
            </Button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Folders */}
          <div className="lg:col-span-1">
        <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  Folders
                </CardTitle>
                <CardDescription>Organize your data models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(null)}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    All Models
                  </Button>
                  {/* Folder list */}
                  {folders.length > 0 ? (
                    folders.map((folder: any) => (
                      <Button 
                        key={folder.id}
                        variant={selectedFolder === folder.id ? "default" : "outline"}
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setSelectedFolder(folder.id)}
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        {folder.name}
                      </Button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No folders yet</p>
                      <p className="text-xs">Create folders to organize your models</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Data Models */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Models</CardTitle>
                    <CardDescription>
                      {selectedFolder ? `Models in selected folder` : 'All data models'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCreateFolderDialog(true)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      New Folder
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Model
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

                {/* Models Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.display_name}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{m.description}</TableCell>
                    <TableCell>
                      <Badge variant={m.is_active ? 'default' : 'secondary'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{(m as any).data_model_attributes?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                        <Edit className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteModel(m)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No models found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{editingModel ? 'Edit Data Model' : 'New Data Model'}</DialogTitle>
              <DialogDescription>
                {editingModel ? 'Edit model details and manage attributes' : 'Define the model metadata'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="w-full">
            <Tabs defaultValue="model">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="model" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Model Details
                </TabsTrigger>
                <TabsTrigger value="attributes" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Attributes
                </TabsTrigger>
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Attribute Options
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="model" className="space-y-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-xs text-muted-foreground">The internal name used for the data model. This will be used in API calls and database references.</p>
                          <Input 
                            value={form.name} 
                            onChange={(e) => {
                              const name = e.target.value
                              const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
                              setForm({ ...form, name, slug: !slugEdited ? toSlug(name) : form.slug })
                            }} 
                            placeholder="Enter model name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Display Name</label>
                          <p className="text-xs text-muted-foreground">The human-readable name that will be shown in the interface.</p>
                          <Input 
                            value={form.display_name} 
                            onChange={(e) => setForm({ ...form, display_name: e.target.value })} 
                            placeholder="Enter display name"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug</label>
                      <p className="text-xs text-muted-foreground">URL-friendly identifier. Auto-generated from the name but can be customized.</p>
                      <Input
                        value={form.slug}
                        onChange={(e) => { setForm({ ...form, slug: e.target.value.toLowerCase() }); setSlugEdited(true) }}
                        placeholder="auto-generated-from-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-xs text-muted-foreground">Optional description explaining the purpose and usage of this data model.</p>
                      <Textarea 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        placeholder="Enter description"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Source Type</label>
                        <p className="text-xs text-muted-foreground">Choose whether this model uses internal data or connects to an external database.</p>
                        <Select
                          value={form.source_type}
                          onValueChange={(v) => setForm({ ...form, source_type: v as any })}
                        >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INTERNAL">In-app database</SelectItem>
                        <SelectItem value="EXTERNAL">External datasource</SelectItem>
                      </SelectContent>
                    </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Associated Spaces</label>
                        <p className="text-xs text-muted-foreground">Select which spaces this data model will be available in.</p>
                        {spacesLoading ? (
                          <div className="text-sm text-muted-foreground">Loading spaces...</div>
                        ) : spacesError ? (
                          <div className="text-sm text-red-500">{spacesError}</div>
                        ) : (
                          <MultiSelect
                            options={spaces.map(s => ({ value: s.id, label: s.name }))}
                            selected={selectedSpaceIds}
                            onChange={setSelectedSpaceIds}
                            placeholder="Select spaces..."
                            className="w-full"
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Folder</label>
                        <p className="text-xs text-muted-foreground">Organize this model within the currently active space.</p>
                        <Select
                          value={form.folder_id || '__root__'}
                          onValueChange={(value) => setForm({ ...form, folder_id: value === '__root__' ? '' : value })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__root__">No folder</SelectItem>
                            {folders.map((folder: any) => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="attributes" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Model Attributes</h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={openCreateAttribute}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Attribute
                      </Button>
                    </div>
                  </div>
                  
                  {attributesLoading ? (
                    <div className="text-center py-4">Loading attributes...</div>
                  ) : (
                    <div className="h-[500px] overflow-y-auto border border-border rounded-lg bg-background">
                      <div className="space-y-2 p-4">
                        {attributes.length > 0 && attributes.map((attr) => (
                          <div 
                            key={attr.id} 
                            className="group flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors bg-background shadow-sm"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openAttributeDrawer(attr)
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{attr.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {attr.name} • {attr.is_required ? 'Required' : 'Optional'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openAttributeDrawer(attr)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="text-xs">Edit</span>
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 hover:bg-muted"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openAttributeDrawer(attr)
                                    }}
                                    className="text-foreground"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Attribute
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAttributeDelete(attr.id)
                                    }}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Attribute
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                        
                        {attributes.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No attributes found for this model.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="options" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Attribute Options</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage options for select-type attributes. Select an attribute from the Attributes tab to configure its options.
                  </p>
                  
                  {attributes.filter(attr => attr.type === 'SELECT' || attr.type === 'MULTI_SELECT').length > 0 ? (
                    <div className="space-y-4">
                      {attributes
                        .filter(attr => attr.type === 'SELECT' || attr.type === 'MULTI_SELECT')
                        .map((attr) => (
                          <div key={attr.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{attr.display_name}</h4>
                              <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                              </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Type: {attr.type} • Options: {attr.options?.length || 0}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No select-type attributes found. Add SELECT or MULTI_SELECT attributes in the Attributes tab.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModelDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveModel}>
                {editingModel ? 'Update' : 'Create'} Model
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attribute Creation Dialog */}
        <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Attribute</DialogTitle>
              <DialogDescription>
                Create a new attribute for {editingModel?.display_name || 'this model'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={attributeForm.name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, name: e.target.value })}
                    placeholder="e.g., customer_name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={attributeForm.display_name}
                    onChange={(e) => setAttributeForm({ ...attributeForm, display_name: e.target.value })}
                    placeholder="e.g., Customer Name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data Type</label>
                  <select
                    value={attributeForm.data_type}
                    onChange={(e) => setAttributeForm({ ...attributeForm, data_type: e.target.value })}
                    className="w-full p-2 border border-border rounded-md"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="select">Select</option>
                    <option value="multi_select">Multi Select</option>
                    <option value="textarea">Textarea</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Default Value</label>
                  <Input
                    value={attributeForm.default_value}
                    onChange={(e) => setAttributeForm({ ...attributeForm, default_value: e.target.value })}
                    placeholder="Optional default value"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attributeForm.is_required}
                    onChange={(e) => setAttributeForm({ ...attributeForm, is_required: e.target.checked })}
                  />
                  <span className="text-sm">Required</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={attributeForm.is_unique}
                    onChange={(e) => setAttributeForm({ ...attributeForm, is_unique: e.target.checked })}
                  />
                  <span className="text-sm">Unique</span>
                </label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAttributeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={saveAttribute}>
                  Create Attribute
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AttributeDetailDrawer
          open={showAttributeDrawer}
          onOpenChange={setShowAttributeDrawer}
          attribute={selectedAttribute}
          onSave={handleAttributeSave}
          onDelete={handleAttributeDelete}
          onReorder={handleAttributeReorder}
          allAttributes={attributes}
        />

        {/* Create Folder Dialog */}
        <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your data models
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  placeholder="Enter folder name"
                />
              </div>
              <div>
                <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                <Select value={folderForm.parent_id} onValueChange={(value) => setFolderForm({ ...folderForm, parent_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent (Root level)</SelectItem>
                    {folders.map((folder: any) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createFolder}>
                Create Folder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs">
            <div>Drawer Open: {showAttributeDrawer.toString()}</div>
            <div>Selected Attribute: {selectedAttribute?.display_name || 'None'}</div>
            <div>Attributes Count: {attributes.length}</div>
          </div>
        )}
      </div>
    )
}


