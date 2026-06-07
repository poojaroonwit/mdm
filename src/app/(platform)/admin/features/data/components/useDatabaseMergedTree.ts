'use client'

import { useMemo } from 'react'
import type { DataModel, Folder as DataFolder } from '../types'

export function useDatabaseMergedTree(params: {
  folders: DataFolder[]
  models: DataModel[]
  searchValue: string
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { folders, models, searchValue, setExpandedFolders } = params

  // Build tree structure for data models
  const treeStructure = useMemo(() => {
    const folderMap = new Map<string, DataFolder>()
    const rootFolders: DataFolder[] = []

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], models: [] })
    })

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

    const filteredModels = searchValue
      ? models.filter(model =>
        (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
      )
      : models

    filteredModels.forEach(model => {
      if (model.folder_id) {
        const folder = folderMap.get(model.folder_id)
        if (folder) {
          folder.models!.push(model)
        }
      }
    })

    return rootFolders
  }, [folders, models, searchValue])

  const rootModels = useMemo(() => {
    const filtered = searchValue
      ? models.filter(model =>
        (model.name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.display_name || '').toLowerCase().includes(searchValue.toLowerCase()) ||
        (model.description || '').toLowerCase().includes(searchValue.toLowerCase())
      )
      : models
    return filtered.filter(model => !model.folder_id)
  }, [models, searchValue])

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    )
  }



  return { treeStructure, rootModels, toggleFolder }
}
