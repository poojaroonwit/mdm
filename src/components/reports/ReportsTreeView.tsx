'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Folder, 
  FileText, 
  Eye,
  BarChart3,
  Power,
  Activity,
  Tag,
} from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { validateRequired } from '@/lib/validation-utils'
import { useModal } from '@/hooks/common'
import { ReportsTreeContent } from './ReportsTreeContent'
import { ReportsTreeDialogs } from './ReportsTreeDialogs'
import { ReportsTreeEmptyState, ReportsTreeLoadingState } from './ReportsTreeStates'
import type { Report, ReportCategory, ReportFolder } from '@/types/reports'

interface ReportsTreeViewProps {
  reports: Report[]
  categories: ReportCategory[]
  folders: ReportFolder[]
  loading: boolean
  searchTerm: string
  onReportClick: (report: Report) => void
  onCategoryClick?: (category: ReportCategory) => void
  onRefresh?: () => void
  selectedReports?: Set<string>
  onReportSelect?: (reportId: string, selected: boolean) => void
}

interface TreeNode {
  id: string
  name: string
  type: 'category' | 'folder' | 'report'
  children: TreeNode[]
  reports: Report[]
  category?: ReportCategory
  folder?: ReportFolder
  report?: Report
}

export function ReportsTreeView({
  reports,
  categories,
  folders,
  loading,
  searchTerm,
  onReportClick,
  onCategoryClick,
  onRefresh,
  selectedReports = new Set(),
  onReportSelect
}: ReportsTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const categoryDialog = useModal()
  const folderDialog = useModal()
  const [editingCategory, setEditingCategory] = useState<ReportCategory | null>(null)
  const [editingFolder, setEditingFolder] = useState<ReportFolder | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent_id: '' })
  const [folderForm, setFolderForm] = useState({ name: '', description: '', parent_id: '' })
  const [deleteCategory, setDeleteCategory] = useState<ReportCategory | null>(null)
  const [deleteFolder, setDeleteFolder] = useState<ReportFolder | null>(null)
  const [permReportId, setPermReportId] = useState<string | null>(null)

  const treeStructure = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []

    // Create category nodes
    categories.forEach(category => {
      const node: TreeNode = {
        id: `category-${category.id}`,
        name: category.name,
        type: 'category',
        children: [],
        reports: [],
        category
      }
      nodeMap.set(node.id, node)
    })

    // Create folder nodes
    folders.forEach(folder => {
      const node: TreeNode = {
        id: `folder-${folder.id}`,
        name: folder.name,
        type: 'folder',
        children: [],
        reports: [],
        folder
      }
      nodeMap.set(node.id, node)
    })

    // Build hierarchy
    categories.forEach(category => {
      const node = nodeMap.get(`category-${category.id}`)
      if (category.parent_id) {
        const parent = nodeMap.get(`category-${category.parent_id}`)
        if (parent) {
          parent.children.push(node!)
        }
      } else {
        rootNodes.push(node!)
      }
    })

    folders.forEach(folder => {
      const node = nodeMap.get(`folder-${folder.id}`)
      if (folder.parent_id) {
        const parent = nodeMap.get(`folder-${folder.parent_id}`) || 
                      nodeMap.get(`category-${folder.parent_id}`)
        if (parent) {
          parent.children.push(node!)
        }
      } else if (!categories.find(c => c.id === folder.parent_id)) {
        rootNodes.push(node!)
      }
    })

    // Add reports to nodes
    reports.forEach(report => {
      let targetNode: TreeNode | undefined

      if (report.folder_id) {
        targetNode = nodeMap.get(`folder-${report.folder_id}`)
      } else if (report.category_id) {
        targetNode = nodeMap.get(`category-${report.category_id}`)
      }

      if (targetNode) {
        targetNode.reports.push(report)
      } else {
        // Create root report node
        const reportNode: TreeNode = {
          id: `report-${report.id}`,
          name: report.name,
          type: 'report',
          children: [],
          reports: [report],
          report
        }
        rootNodes.push(reportNode)
      }
    })

    return rootNodes
  }, [reports, categories, folders])

  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeStructure

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.reports.some(r => 
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )

      const filteredChildren = node.children
        .map(filterNode)
        .filter((n): n is TreeNode => n !== null)

      if (matchesSearch || filteredChildren.length > 0 || node.reports.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          reports: node.reports.filter(r =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
      }

      return null
    }

    return treeStructure.map(filterNode).filter((n): n is TreeNode => n !== null)
  }, [treeStructure, searchTerm])

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  const handleCreateCategory = async () => {
    const nameError = validateRequired(categoryForm.name.trim(), 'Category name')
    if (nameError) {
      showError(nameError)
      return
    }

    try {
      const response = await fetch('/api/reports/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          parent_id: categoryForm.parent_id || null
        })
      })

      if (!response.ok) throw new Error('Failed to create category')
      
      showSuccess(ToastMessages.CREATED)
      categoryDialog.close()
      setCategoryForm({ name: '', description: '', parent_id: '' })
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.CREATE_ERROR)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) {
      showError('Category name is required')
      return
    }

    try {
      const response = await fetch('/api/reports/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          ...categoryForm,
          parent_id: categoryForm.parent_id || null
        })
      })

      if (!response.ok) throw new Error('Failed to update category')
      
      showSuccess(ToastMessages.UPDATED)
      categoryDialog.close()
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', parent_id: '' })
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.UPDATE_ERROR)
    }
  }

  const handleDeleteCategory = async (category: ReportCategory) => {
    setDeleteCategory(category)
  }

  const confirmDeleteCategory = async () => {
    if (!deleteCategory) return

    try {
      const response = await fetch(`/api/reports/categories?id=${deleteCategory.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')
      
      showSuccess(ToastMessages.DELETED)
      setDeleteCategory(null)
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.DELETE_ERROR)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) {
      showError('Folder name is required')
      return
    }

    try {
      const response = await fetch('/api/reports/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...folderForm,
          parent_id: folderForm.parent_id || null
        })
      })

      if (!response.ok) throw new Error('Failed to create folder')
      
      showSuccess(ToastMessages.CREATED)
      folderDialog.close()
      setFolderForm({ name: '', description: '', parent_id: '' })
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.CREATE_ERROR)
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !folderForm.name.trim()) {
      showError('Folder name is required')
      return
    }

    try {
      const response = await fetch('/api/reports/folders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFolder.id,
          ...folderForm,
          parent_id: folderForm.parent_id || null
        })
      })

      if (!response.ok) throw new Error('Failed to update folder')
      
      showSuccess(ToastMessages.UPDATED)
      folderDialog.close()
      setEditingFolder(null)
      setFolderForm({ name: '', description: '', parent_id: '' })
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.UPDATE_ERROR)
    }
  }

  const handleDeleteFolder = async (folder: ReportFolder) => {
    setDeleteFolder(folder)
  }

  const confirmDeleteFolder = async () => {
    if (!deleteFolder) return

    try {
      const response = await fetch(`/api/reports/folders?id=${deleteFolder.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete folder')
      
      showSuccess(ToastMessages.DELETED)
      setDeleteFolder(null)
      onRefresh?.()
    } catch (error: any) {
      showError(error.message || ToastMessages.DELETE_ERROR)
    }
  }

  const openCategoryDialog = (category?: ReportCategory, parentId?: string) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || ''
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', parent_id: parentId || '' })
    }
    categoryDialog.open()
  }

  const openFolderDialog = (folder?: ReportFolder, parentId?: string) => {
    if (folder) {
      setEditingFolder(folder)
      setFolderForm({
        name: folder.name,
        description: folder.description || '',
        parent_id: folder.parent_id || ''
      })
    } else {
      setEditingFolder(null)
      setFolderForm({ name: '', description: '', parent_id: parentId || '' })
    }
    folderDialog.open()
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'POWER_BI':
        return <Power className="h-3 w-3 text-orange-500" />
      case 'GRAFANA':
        return <Activity className="h-3 w-3 text-orange-500" />
      case 'LOOKER_STUDIO':
        return <Eye className="h-3 w-3 text-blue-500" />
      default:
        return <BarChart3 className="h-3 w-3 text-blue-500" />
    }
  }

  const isFavorite = (reportId: string) => {
    try {
      const stored = localStorage.getItem('report_favorites')
      const favorites = stored ? JSON.parse(stored) : []
      return favorites.includes(reportId)
    } catch {
      return false
    }
  }

  const toggleFavorite = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const stored = localStorage.getItem('report_favorites')
      const favorites = stored ? JSON.parse(stored) : []
      const newFavorites = favorites.includes(reportId)
        ? favorites.filter((id: string) => id !== reportId)
        : [...favorites, reportId]
      localStorage.setItem('report_favorites', JSON.stringify(newFavorites))
      showSuccess(favorites.includes(reportId) ? 'Removed from favorites' : 'Added to favorites')
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  if (loading) {
    return <ReportsTreeLoadingState />
  }

  if (filteredTree.length === 0) {
    return <ReportsTreeEmptyState searchTerm={searchTerm} />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reports & Dashboards</CardTitle>
              <CardDescription>
                Browse reports organized by categories and folders
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCategoryDialog()}
              >
                <Tag className="h-4 w-4 mr-2" />
                New Category
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openFolderDialog()}
              >
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ReportsTreeContent
            expandedNodes={expandedNodes}
            filteredTree={filteredTree}
            selectedNode={selectedNode}
            selectedReports={selectedReports}
            getSourceIcon={getSourceIcon}
            handleDeleteCategory={handleDeleteCategory}
            handleDeleteFolder={handleDeleteFolder}
            isFavorite={isFavorite}
            onCategoryClick={onCategoryClick}
            onReportClick={onReportClick}
            onReportSelect={onReportSelect}
            openCategoryDialog={openCategoryDialog}
            openFolderDialog={openFolderDialog}
            setPermReportId={setPermReportId}
            setSelectedNode={setSelectedNode}
            toggleFavorite={toggleFavorite}
            toggleNode={toggleNode}
          />
        </CardContent>
      </Card>

      <ReportsTreeDialogs
        categoryDialog={categoryDialog}
        categoryForm={categoryForm}
        deleteCategory={deleteCategory}
        deleteFolder={deleteFolder}
        editingCategory={editingCategory}
        editingFolder={editingFolder}
        folderDialog={folderDialog}
        folderForm={folderForm}
        permReportId={permReportId}
        reports={reports}
        confirmDeleteCategory={confirmDeleteCategory}
        confirmDeleteFolder={confirmDeleteFolder}
        handleCreateCategory={handleCreateCategory}
        handleCreateFolder={handleCreateFolder}
        handleUpdateCategory={handleUpdateCategory}
        handleUpdateFolder={handleUpdateFolder}
        onRefresh={onRefresh}
        setCategoryForm={setCategoryForm}
        setDeleteCategory={setDeleteCategory}
        setDeleteFolder={setDeleteFolder}
        setEditingCategory={setEditingCategory}
        setEditingFolder={setEditingFolder}
        setFolderForm={setFolderForm}
        setPermReportId={setPermReportId}
      />
    </>
  )
}
