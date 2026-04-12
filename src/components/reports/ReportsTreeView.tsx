'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  BarChart3,
  Power,
  Activity,
  MoreVertical,
  Tag,
  Star,
  StarOff,
  UserCheck,
  Share2,
} from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { validateRequired, validateLength } from '@/lib/validation-utils'
import { useModal } from '@/hooks/common'
import { ReportPermissionsDialog } from './ReportPermissionsDialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox as UICheckbox } from '@/components/ui/checkbox'
import type { Report, ReportCategory, ReportFolder } from '@/app/reports/page'

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
  const [parentId, setParentId] = useState<string | null>(null)
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

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNode === node.id
    const hasChildren = node.children.length > 0 || node.reports.length > 0

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'category' && node.category) {
              onCategoryClick?.(node.category)
            }
            setSelectedNode(node.id)
            if (hasChildren) {
              toggleNode(node.id)
            }
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {node.type === 'category' && (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          )}
          {node.type === 'folder' && (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-500" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-500" />
            )
          )}
          {node.type === 'report' && (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}

          <span className="font-medium flex-1 truncate">{node.name}</span>

          <div className="flex items-center gap-1">
            {node.type === 'report' && node.report && (
              getSourceIcon(node.report.source)
            )}
            {(node.type === 'category' || node.type === 'folder') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {node.type === 'category' && node.category && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        if (node.category) {
                          openCategoryDialog(node.category, node.category.id)
                        }
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subcategory
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openFolderDialog(undefined, node.category?.id)
                      }}>
                        <Folder className="h-4 w-4 mr-2" />
                        Add Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openCategoryDialog(node.category)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (node.category) handleDeleteCategory(node.category)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {node.type === 'folder' && node.folder && (
                    <>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openFolderDialog(undefined, node.folder?.id)
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subfolder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        openFolderDialog(node.folder)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (node.folder) handleDeleteFolder(node.folder)
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isExpanded && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
            {node.reports.map(report => (
              <div
                key={report.id}
                className={`
                  flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-800
                `}
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                onClick={(e) => {
                  if (e.target instanceof HTMLElement && (e.target.closest('button') || e.target.closest('[role="checkbox"]'))) {
                    return
                  }
                  onReportClick(report)
                }}
              >
                <div className="w-6" />
                {onReportSelect && (
                  <UICheckbox
                    checked={selectedReports.has(report.id)}
                    onCheckedChange={(checked) => {
                      onReportSelect(report.id, checked as boolean)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{report.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => toggleFavorite(report.id, e)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {isFavorite(report.id) ? (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                  {getSourceIcon(report.source)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPermReportId(report.id)
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Manage Permissions"
                  >
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {report.link && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredTree.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reports found</h3>
          <p className="text-muted-foreground text-center mb-4">
            {searchTerm 
              ? 'No reports match your search criteria.'
              : 'Get started by creating your first report or connecting an external source.'
            }
          </p>
        </CardContent>
      </Card>
    )
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
          <div className="space-y-1">
            {filteredTree.map(node => renderNode(node))}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.isOpen} onOpenChange={(open) => open ? categoryDialog.open() : categoryDialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category information'
                : 'Create a new category to organize your reports'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Category name"
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              categoryDialog.close()
              setEditingCategory(null)
              setCategoryForm({ name: '', description: '', parent_id: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={folderDialog.isOpen} onOpenChange={(open) => open ? folderDialog.open() : folderDialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Edit Folder' : 'Create Folder'}
            </DialogTitle>
            <DialogDescription>
              {editingFolder 
                ? 'Update the folder information'
                : 'Create a new folder to organize your reports'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Name *</Label>
              <Input
                id="folder-name"
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="Folder name"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">Description</Label>
              <Input
                id="folder-description"
                value={folderForm.description}
                onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                placeholder="Folder description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              folderDialog.close()
              setEditingFolder(null)
              setFolderForm({ name: '', description: '', parent_id: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}>
              {editingFolder ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This action cannot be undone.
              {deleteCategory && reports.filter(r => r.category_id === deleteCategory.id).length > 0 && (
                <span className="block mt-2 text-orange-600">
                  Warning: This category contains {reports.filter(r => r.category_id === deleteCategory.id).length} report(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolder} onOpenChange={(open) => !open && setDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFolder?.name}"? This action cannot be undone.
              {deleteFolder && reports.filter(r => r.folder_id === deleteFolder.id).length > 0 && (
                <span className="block mt-2 text-orange-600">
                  Warning: This folder contains {reports.filter(r => r.folder_id === deleteFolder.id).length} report(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReportPermissionsDialog
        reportId={permReportId || ''}
        open={!!permReportId}
        onOpenChange={(open) => !open && setPermReportId(null)}
        onSuccess={onRefresh}
      />
    </>
  )
}
