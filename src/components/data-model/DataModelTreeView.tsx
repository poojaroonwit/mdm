'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Database, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  FolderPlus,
  Move,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DataModel {
  id: string
  name: string
  display_name?: string
  description?: string
  folder_id?: string
  icon?: string
  primary_color?: string
  tags?: string[]
  shared_spaces?: any[]
  created_at?: string
  updated_at?: string
}

interface Folder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: Folder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

interface DataModelTreeViewProps {
  models: DataModel[]
  folders: Folder[]
  loading?: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  onModelEdit: (model: DataModel) => void
  onModelDelete: (model: DataModel) => void
  onModelMove: (modelId: string, folderId: string | null) => void
  onModelShare: (model: DataModel) => void
  onCreateModel: () => void
  onCreateFolder: (name: string, parentId?: string) => void
  onEditFolder: (folder: Folder) => void
  onDeleteFolder: (folder: Folder) => void
  onFolderExpand?: (folderId: string) => void
  onFolderCollapse?: (folderId: string) => void
  expandedFolders?: string[]
}

export function DataModelTreeView({
  models,
  folders,
  loading = false,
  searchValue,
  onSearchChange,
  onModelEdit,
  onModelDelete,
  onModelMove,
  onModelShare,
  onCreateModel,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onFolderExpand,
  onFolderCollapse,
  expandedFolders = []
}: DataModelTreeViewProps) {
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [selectedParentFolder, setSelectedParentFolder] = useState<string | null>(null)
  // Build tree structure
  const treeStructure = useMemo(() => {
    const folderMap = new Map<string, Folder>()
    const rootFolders: Folder[] = []
    
    // Create folder map
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], models: [] })
    })
    
    // Build hierarchy
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id)
        if (parent) {
          parent.children!.push(folderMap.get(folder.id)!)
        }
      } else {
        rootFolders.push(folderMap.get(folder.id)!)
      }
    })
    
    // Add models to folders
    models.forEach(model => {
      if (model.folder_id) {
        const folder = folderMap.get(model.folder_id)
        if (folder) {
          folder.models!.push(model)
        }
      }
    })
    
    return rootFolders
  }, [folders, models])

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!searchValue) return models
    
    const query = searchValue.toLowerCase()
    return models.filter(model => 
      (model.name || '').toLowerCase().includes(query) ||
      (model.display_name || '').toLowerCase().includes(query) ||
      (model.description || '').toLowerCase().includes(query) ||
      (model.tags || []).some(tag => tag.toLowerCase().includes(query))
    )
  }, [models, searchValue])

  const rootModels = filteredModels.filter(model => !model.folder_id)

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name is required')
      return
    }
    
    onCreateFolder(newFolderName.trim(), selectedParentFolder || undefined)
    setNewFolderName('')
    setNewFolderDescription('')
    setSelectedParentFolder(null)
    setShowCreateFolderDialog(false)
  }

  const renderModelItem = (model: DataModel) => (
    <div key={`model:${model.id}`} className="p-2 ml-6 rounded-md hover:bg-accent transition-colors">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">
            {model.display_name || model.name}
          </div>
          {model.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {model.description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onModelEdit(model)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onModelShare(model)}>
            <Share2 className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-red-600 hover:text-red-700" onClick={() => onModelDelete(model)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderFolderItem = (folder: Folder, level = 0) => {
    const isExpanded = expandedFolders.includes(folder.id)
    
    return (
      <div key={`folder:${folder.id}`} className="select-none">
        <div
          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-1 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="font-medium flex-1 truncate">{folder.name}</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onEditFolder(folder)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onDeleteFolder(folder)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div>
            {(folder.models || []).map(renderModelItem)}
            {(folder.children || []).map(childFolder => renderFolderItem(childFolder, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const toggleFolder = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      onFolderCollapse?.(folderId)
    } else {
      onFolderExpand?.(folderId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span>Data Models</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateFolderDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm" onClick={onCreateModel}>
              <Plus className="h-4 w-4 mr-2" />
              New Model
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Organize your data models in folders and categories
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search models and folders..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tree View */}
        <div className="border rounded-lg p-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Root Models Section */}
              {rootModels.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 p-3 text-sm font-medium text-foreground bg-muted/40 rounded-lg border border-border">
                    <Database className="h-4 w-4" />
                    <span>Root Models ({rootModels.length})</span>
                  </div>
                  <div className="space-y-1">
                    {rootModels.map(renderModelItem)}
                  </div>
                </div>
              )}
              
              {/* Folders */}
              {treeStructure.map(folder => renderFolderItem(folder))}

              {/* Empty State */}
              {models.length === 0 && folders.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No data models yet</p>
                  <p className="text-sm">Create your first data model to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
        <DialogContent className="sm:max-w-md">
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
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                autoFocus
              />
            </div>
            
            <div>
              <Label htmlFor="folder-description">Description (Optional)</Label>
              <Input
                id="folder-description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Enter folder description..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolderDialog(false)
                setNewFolderName('')
                setNewFolderDescription('')
                setSelectedParentFolder(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
