'use client'

import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Database, Type, Settings, GitBranch } from 'lucide-react'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'
import { DataModelAttributeCreateDialog } from './components/DataModelAttributeCreateDialog'
import {
  DataModelAttributesTab,
  DataModelDetailsTab,
  DataModelOptionsTab
} from './components/DataModelDialogTabs'
import { DataModelFolderDialog } from './components/DataModelFolderDialog'
import { DataModelsWorkspace } from './components/DataModelsWorkspace'

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

        <DataModelsWorkspace
          folders={folders}
          models={filtered}
          search={search}
          selectedFolder={selectedFolder}
          onCreateFolder={() => setShowCreateFolderDialog(true)}
          onCreateModel={openCreate}
          onDeleteModel={deleteModel}
          onEditModel={openEdit}
          onSearchChange={setSearch}
          onSelectFolder={setSelectedFolder}
        />
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
              
              <DataModelDetailsTab
                folders={folders}
                form={form}
                selectedSpaceIds={selectedSpaceIds}
                spaces={spaces}
                spacesError={spacesError}
                spacesLoading={spacesLoading}
                slugEdited={slugEdited}
                setForm={setForm}
                setSelectedSpaceIds={setSelectedSpaceIds}
                setSlugEdited={setSlugEdited}
              />
              <DataModelAttributesTab
                attributes={attributes}
                attributesLoading={attributesLoading}
                onCreateAttribute={openCreateAttribute}
                onDeleteAttribute={handleAttributeDelete}
                onOpenAttribute={openAttributeDrawer}
              />
              <DataModelOptionsTab attributes={attributes} />            </Tabs>
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

        <DataModelAttributeCreateDialog
          attributeForm={attributeForm}
          modelDisplayName={editingModel?.display_name}
          open={showAttributeDialog}
          setAttributeForm={setAttributeForm}
          onOpenChange={setShowAttributeDialog}
          onSave={saveAttribute}
        />
        <AttributeDetailDrawer
          open={showAttributeDrawer}
          onOpenChange={setShowAttributeDrawer}
          attribute={selectedAttribute}
          onSave={handleAttributeSave}
          onDelete={handleAttributeDelete}
          onReorder={handleAttributeReorder}
          allAttributes={attributes}
        />

        <DataModelFolderDialog
          folderForm={folderForm}
          folders={folders}
          open={showCreateFolderDialog}
          setFolderForm={setFolderForm}
          onCreateFolder={createFolder}
          onOpenChange={setShowCreateFolderDialog}
        />
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


