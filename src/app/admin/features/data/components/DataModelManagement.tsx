'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DataModelTreeView } from '@/components/data-model/DataModelTreeView'
import { Database, Filter } from 'lucide-react'
import { showSuccess, showError, showInfo, ToastMessages } from '@/lib/toast-utils'
import { DataModel, Folder } from '../types'
import { DataModelDialog } from './DataModelDialog'

interface Space {
  id: string
  name: string
  slug?: string
}

export function DataModelManagement() {
  const [models, setModels] = useState<DataModel[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('all')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedModelForSharing, setSelectedModelForSharing] = useState<DataModel | null>(null)
  const [shareForm, setShareForm] = useState({ space_ids: [] as string[] })
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([])
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [showModelDialog, setShowModelDialog] = useState(false)
  const [editingModel, setEditingModel] = useState<DataModel | null>(null)

  // Load spaces for filter
  useEffect(() => {
    const loadSpaces = async () => {
      setSpacesLoading(true)
      try {
        const res = await fetch('/api/spaces?page=1&limit=200')
        const json = await res.json().catch(() => ({}))
        setSpaces(json.spaces || [])
      } catch (e) {
        showError('Failed to load spaces')
      } finally {
        setSpacesLoading(false)
      }
    }
    loadSpaces()
  }, [])

  // Load models based on space filter
  useEffect(() => {
    loadModels()
    loadFolders()
  }, [selectedSpaceId])

  const loadModels = async () => {
    setLoading(true)
    try {
      let url: string
      if (selectedSpaceId && selectedSpaceId !== 'all') {
        // Use regular data-models endpoint for specific space
        url = `/api/data-models?page=1&limit=500&space_id=${selectedSpaceId}`
      } else {
        // Use spaces endpoint with 'all' to get all models across all spaces
        url = '/api/spaces/all/data-models'
      }
      const res = await fetch(url)
      const json = await res.json().catch(() => ({}))
      setModels(json.dataModels || [])
    } catch (e) {
      showError('Failed to load data models')
    } finally {
      setLoading(false)
    }
  }

  const loadFolders = async () => {
    try {
      let url = '/api/folders?type=data_model'
      if (selectedSpaceId && selectedSpaceId !== 'all') {
        url += `&space_id=${selectedSpaceId}`
      }
      const res = await fetch(url)
      if (res.status === 503) {
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const handleCreateModel = () => {
    setEditingModel(null)
    setShowModelDialog(true)
  }

  const handleEditModel = (model: DataModel) => {
    setEditingModel(model)
    setShowModelDialog(true)
  }

  const handleModelDialogSuccess = () => {
    loadModels()
  }

  const handleDeleteModel = async (model: DataModel) => {
    if (!confirm(`Are you sure you want to delete "${model.display_name || model.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/data-models/${model.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete model')
      showSuccess('Data model deleted successfully')
      loadModels()
    } catch (e) {
      showError('Failed to delete data model')
    }
  }

  const loadAvailableSpaces = async () => {
    try {
      const res = await fetch('/api/spaces?page=1&limit=200')
      const json = await res.json().catch(() => ({}))
      setAvailableSpaces(json.spaces || [])
    } catch (e) {
      console.error('Failed to load spaces:', e)
    }
  }

  const handleShareModel = (model: DataModel) => {
    setSelectedModelForSharing(model)
    // Get current shared spaces from model
    const sharedSpaceIds = model.shared_spaces?.map((s: any) => s.id || s) || []
    setShareForm({ space_ids: sharedSpaceIds })
    setShowShareDialog(true)
    loadAvailableSpaces()
  }

  const shareModel = async () => {
    if (!selectedModelForSharing?.id) return
    
    try {
      const res = await fetch(`/api/data-models/${selectedModelForSharing.id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_ids: shareForm.space_ids })
      })
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to share model')
      }
      
      setShowShareDialog(false)
      await loadModels()
      showSuccess('Model sharing updated')
    } catch (e: any) {
      showError(e.message || 'Failed to share model')
    }
  }

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const spaceId = selectedSpaceId && selectedSpaceId !== 'all' ? selectedSpaceId : undefined
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parent_id: parentId || null,
          type: 'data_model',
          space_id: spaceId
        })
      })
      if (!res.ok) throw new Error('Failed to create folder')
      showSuccess('Folder created successfully')
      loadFolders()
    } catch (e) {
      showError('Failed to create folder')
    }
  }

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder)
    setEditFolderName(folder.name)
    setShowEditFolderDialog(true)
  }

  const saveFolderEdit = async () => {
    if (!editingFolder || !editFolderName.trim() || editFolderName === editingFolder.name) {
      setShowEditFolderDialog(false)
      return
    }

    try {
      const res = await fetch(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFolderName.trim(),
          parent_id: editingFolder.parent_id || null
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update folder')
      }
      
      showSuccess('Folder renamed successfully')
      setShowEditFolderDialog(false)
      setEditingFolder(null)
      setEditFolderName('')
      loadFolders()
    } catch (e: any) {
      showError(e.message || 'Failed to rename folder')
    }
  }

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete folder')
      showSuccess('Folder deleted successfully')
      loadFolders()
      loadModels()
    } catch (e) {
      showError('Failed to delete folder')
    }
  }

  const handleMoveModel = async (modelId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      })
      if (!res.ok) throw new Error('Failed to move model')
      showSuccess('Model moved successfully')
      loadModels()
    } catch (e) {
      showError('Failed to move model')
    }
  }

  const handleFolderExpand = (folderId: string) => {
    setExpandedFolders([...expandedFolders, folderId])
  }

  const handleFolderCollapse = (folderId: string) => {
    setExpandedFolders(expandedFolders.filter(id => id !== folderId))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Models</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage data models across all spaces
          </p>
        </div>
      </div>

      {/* Space Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Space:</span>
            </div>
            <Select
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
            >
              <SelectTrigger className="w-[300px]" disabled={spacesLoading}>
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Spaces</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpaceId && selectedSpaceId !== 'all' && (
              <div className="text-sm text-gray-500">
                Showing models for: <strong>{spaces.find(s => s.id === selectedSpaceId)?.name}</strong>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Model Tree View */}
      <DataModelTreeView
        models={models}
        folders={folders}
        loading={loading}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onModelEdit={handleEditModel}
        onModelDelete={handleDeleteModel}
        onModelMove={handleMoveModel}
        onModelShare={handleShareModel}
        onCreateModel={handleCreateModel}
        onCreateFolder={handleCreateFolder}
        onEditFolder={handleEditFolder}
        onDeleteFolder={handleDeleteFolder}
        onFolderExpand={handleFolderExpand}
        onFolderCollapse={handleFolderCollapse}
        expandedFolders={expandedFolders}
      />

      {/* Share Model Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Share Data Model</DialogTitle>
            <DialogDescription>
              Share "{selectedModelForSharing?.display_name || selectedModelForSharing?.name}" with other spaces
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div>
              <Label>Select Spaces to Share With</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Choose which spaces can access this data model
              </div>
              <div className="max-h-[300px] overflow-y-auto border rounded-md p-4 space-y-2">
                {availableSpaces.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No spaces available
                  </div>
                ) : (
                  availableSpaces.map((space) => (
                    <div key={space.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`space-${space.id}`}
                        checked={shareForm.space_ids.includes(space.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setShareForm({
                              space_ids: [...shareForm.space_ids, space.id]
                            })
                          } else {
                            setShareForm({
                              space_ids: shareForm.space_ids.filter(id => id !== space.id)
                            })
                          }
                        }}
                      />
                      <Label
                        htmlFor={`space-${space.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {space.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={shareModel}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={showEditFolderDialog} onOpenChange={setShowEditFolderDialog}>
        <DialogContent className="p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Rename the folder "{editingFolder?.name}"
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div>
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Enter folder name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && editFolderName.trim()) {
                    saveFolderEdit()
                  }
                }}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveFolderEdit} disabled={!editFolderName.trim() || editFolderName === editingFolder?.name}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Model Create/Edit Dialog */}
      <DataModelDialog
        open={showModelDialog}
        onOpenChange={setShowModelDialog}
        model={editingModel}
        spaces={spaces}
        onSuccess={handleModelDialogSuccess}
      />
    </div>
  )
}

