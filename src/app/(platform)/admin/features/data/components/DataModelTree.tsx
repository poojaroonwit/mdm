'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Database, Folder } from 'lucide-react'
import type { DataModel, Folder as DataFolder } from '../types'

interface DetailItem {
  type: 'model' | 'table'
  id: string
  name: string
  displayName?: string
  description?: string
}

interface DataModelTreeProps {
  bodyText: string
  borderRadius: string
  expandedFolders: string[]
  folders: DataFolder[]
  primaryColor: string
  rootModels: DataModel[]
  onOpenDetail: (item: DetailItem) => void
  onToggleFolder: (folderId: string) => void
}

function ModelTreeItem({
  bodyText,
  borderRadius,
  model,
  primaryColor,
  onOpenDetail,
}: Pick<DataModelTreeProps, 'bodyText' | 'borderRadius' | 'primaryColor' | 'onOpenDetail'> & {
  model: DataModel
}) {
  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 ml-6 rounded-lg transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: 'transparent',
        borderRadius,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent'
      }}
      onClick={() => onOpenDetail({
        type: 'model',
        id: model.id,
        name: model.name,
        displayName: model.display_name,
        description: model.description,
      })}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 10%, transparent)` }}
      >
        <Database className="h-3.5 w-3.5" style={{ color: primaryColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate" style={{ color: bodyText }}>
          {model.display_name || model.name}
        </div>
        {model.description && (
          <div className="text-xs truncate mt-0.5" style={{ color: bodyText, opacity: 0.6 }}>
            {model.description}
          </div>
        )}
      </div>
    </div>
  )
}

function FolderTreeItem({
  bodyText,
  borderRadius,
  expandedFolders,
  folder,
  level,
  primaryColor,
  onOpenDetail,
  onToggleFolder,
}: Pick<DataModelTreeProps, 'bodyText' | 'borderRadius' | 'expandedFolders' | 'primaryColor' | 'onOpenDetail' | 'onToggleFolder'> & {
  folder: DataFolder
  level: number
}) {
  const isExpanded = expandedFolders.includes(folder.id)

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer',
          level === 0 && 'font-medium'
        )}
        style={{
          paddingLeft: `${level * 16 + 12}px`,
          backgroundColor: 'transparent',
          borderRadius,
        }}
        onClick={() => onToggleFolder(folder.id)}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 3%, transparent)`
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <button
          onClick={(event) => {
            event.stopPropagation()
            onToggleFolder(folder.id)
          }}
          className="p-0.5 hover:bg-white/20 dark:hover:bg-white/10 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" style={{ color: bodyText, opacity: 0.6 }} />
          )}
        </button>

        <Folder
          className="h-4 w-4 transition-colors"
          style={{ color: isExpanded ? primaryColor : bodyText, opacity: isExpanded ? 1 : 0.6 }}
        />
        <span className="flex-1 truncate text-sm" style={{ color: bodyText }}>
          {folder.name}
        </span>
        {folder.models && folder.models.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
            {folder.models.length}
          </Badge>
        )}
      </div>

      {isExpanded && (
        <div className="mt-1">
          {(folder.models || []).map((model) => (
            <ModelTreeItem
              key={`model:${model.id}`}
              bodyText={bodyText}
              borderRadius={borderRadius}
              model={model}
              primaryColor={primaryColor}
              onOpenDetail={onOpenDetail}
            />
          ))}
          {(folder.children || []).map((childFolder) => (
            <FolderTreeItem
              key={`folder:${childFolder.id}`}
              bodyText={bodyText}
              borderRadius={borderRadius}
              expandedFolders={expandedFolders}
              folder={childFolder}
              level={level + 1}
              primaryColor={primaryColor}
              onOpenDetail={onOpenDetail}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function DataModelTree({
  bodyText,
  borderRadius,
  expandedFolders,
  folders,
  primaryColor,
  rootModels,
  onOpenDetail,
  onToggleFolder,
}: DataModelTreeProps) {
  return (
    <>
      {rootModels.map((model) => (
        <ModelTreeItem
          key={`model:${model.id}`}
          bodyText={bodyText}
          borderRadius={borderRadius}
          model={model}
          primaryColor={primaryColor}
          onOpenDetail={onOpenDetail}
        />
      ))}
      {folders.map((folder) => (
        <FolderTreeItem
          key={`folder:${folder.id}`}
          bodyText={bodyText}
          borderRadius={borderRadius}
          expandedFolders={expandedFolders}
          folder={folder}
          level={0}
          primaryColor={primaryColor}
          onOpenDetail={onOpenDetail}
          onToggleFolder={onToggleFolder}
        />
      ))}
    </>
  )
}
