'use client'

import { Button } from '@/components/ui/button'
import { Database, Edit, Folder, Share2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

export interface DataModel {
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

export interface DataModelFolder {
  id: string
  name: string
  description?: string
  parent_id?: string
  children?: DataModelFolder[]
  models?: DataModel[]
  created_at?: string
  updated_at?: string
}

interface DataModelTreeListProps {
  expandedFolders: string[]
  folders: DataModelFolder[]
  rootModels: DataModel[]
  onDeleteFolder: (folder: DataModelFolder) => void
  onEditFolder: (folder: DataModelFolder) => void
  onModelDelete: (model: DataModel) => void
  onModelEdit: (model: DataModel) => void
  onModelShare: (model: DataModel) => void
  onToggleFolder: (folderId: string) => void
}

interface DataModelTreeItemProps {
  model: DataModel
  onModelDelete: (model: DataModel) => void
  onModelEdit: (model: DataModel) => void
  onModelShare: (model: DataModel) => void
}

function DataModelTreeItem({
  model,
  onModelDelete,
  onModelEdit,
  onModelShare,
}: DataModelTreeItemProps) {
  return (
    <div className="ml-6 rounded-md p-2 transition-colors hover:bg-accent">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">
            {model.display_name || model.name}
          </div>
          {model.description ? (
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {model.description}
            </div>
          ) : null}
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
}

interface FolderTreeItemProps extends Omit<DataModelTreeListProps, 'folders' | 'rootModels'> {
  folder: DataModelFolder
  level?: number
}

function FolderTreeItem({
  expandedFolders,
  folder,
  level = 0,
  onDeleteFolder,
  onEditFolder,
  onModelDelete,
  onModelEdit,
  onModelShare,
  onToggleFolder,
}: FolderTreeItemProps) {
  const isExpanded = expandedFolders.includes(folder.id)

  return (
    <div className="select-none">
      <div
        className="flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-accent"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={() => onToggleFolder(folder.id)}
          className="rounded p-1 hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        <Folder className="h-4 w-4 text-blue-500" />
        <span className="flex-1 truncate font-medium">{folder.name}</span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onEditFolder(folder)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => onDeleteFolder(folder)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {isExpanded ? (
        <div>
          {(folder.models || []).map((model) => (
            <DataModelTreeItem
              key={`model:${model.id}`}
              model={model}
              onModelDelete={onModelDelete}
              onModelEdit={onModelEdit}
              onModelShare={onModelShare}
            />
          ))}
          {(folder.children || []).map((childFolder) => (
            <FolderTreeItem
              key={`folder:${childFolder.id}`}
              expandedFolders={expandedFolders}
              folder={childFolder}
              level={level + 1}
              onDeleteFolder={onDeleteFolder}
              onEditFolder={onEditFolder}
              onModelDelete={onModelDelete}
              onModelEdit={onModelEdit}
              onModelShare={onModelShare}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function DataModelTreeList({
  expandedFolders,
  folders,
  rootModels,
  onDeleteFolder,
  onEditFolder,
  onModelDelete,
  onModelEdit,
  onModelShare,
  onToggleFolder,
}: DataModelTreeListProps) {
  return (
    <>
      {rootModels.length > 0 ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm font-medium text-foreground">
            <Database className="h-4 w-4" />
            <span>Root Models ({rootModels.length})</span>
          </div>
          <div className="space-y-1">
            {rootModels.map((model) => (
              <DataModelTreeItem
                key={`model:${model.id}`}
                model={model}
                onModelDelete={onModelDelete}
                onModelEdit={onModelEdit}
                onModelShare={onModelShare}
              />
            ))}
          </div>
        </div>
      ) : null}

      {folders.map((folder) => (
        <FolderTreeItem
          key={`folder:${folder.id}`}
          expandedFolders={expandedFolders}
          folder={folder}
          onDeleteFolder={onDeleteFolder}
          onEditFolder={onEditFolder}
          onModelDelete={onModelDelete}
          onModelEdit={onModelEdit}
          onModelShare={onModelShare}
          onToggleFolder={onToggleFolder}
        />
      ))}
    </>
  )
}
