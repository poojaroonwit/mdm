import { Button } from '@/components/ui/button'
import { Checkbox as UICheckbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  MoreVertical,
  Plus,
  Share2,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react'

import type { Report, ReportCategory, ReportFolder } from '@/types/reports'

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

interface ReportsTreeContentProps {
  expandedNodes: Set<string>
  filteredTree: TreeNode[]
  selectedNode: string | null
  selectedReports: Set<string>
  getSourceIcon: (source: string) => React.ReactNode
  handleDeleteCategory: (category: ReportCategory) => void
  handleDeleteFolder: (folder: ReportFolder) => void
  isFavorite: (reportId: string) => boolean
  onCategoryClick?: (category: ReportCategory) => void
  onReportClick: (report: Report) => void
  onReportSelect?: (reportId: string, selected: boolean) => void
  openCategoryDialog: (category?: ReportCategory, parentId?: string) => void
  openFolderDialog: (folder?: ReportFolder, parentId?: string) => void
  setPermReportId: (reportId: string) => void
  setSelectedNode: (nodeId: string) => void
  toggleFavorite: (reportId: string, event: React.MouseEvent) => void
  toggleNode: (nodeId: string) => void
}

export function ReportsTreeContent({
  expandedNodes,
  filteredTree,
  selectedNode,
  selectedReports,
  getSourceIcon,
  handleDeleteCategory,
  handleDeleteFolder,
  isFavorite,
  onCategoryClick,
  onReportClick,
  onReportSelect,
  openCategoryDialog,
  openFolderDialog,
  setPermReportId,
  setSelectedNode,
  toggleFavorite,
  toggleNode
}: ReportsTreeContentProps) {
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
            if (hasChildren) toggleNode(node.id)
          }}
        >
          {hasChildren ? (
            <button
              onClick={(event) => {
                event.stopPropagation()
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
            {node.type === 'report' && node.report && getSourceIcon(node.report.source)}
            {(node.type === 'category' || node.type === 'folder') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {node.type === 'category' && node.category && (
                    <>
                      <DropdownMenuItem onClick={(event) => {
                        event.stopPropagation()
                        if (node.category) openCategoryDialog(node.category, node.category.id)
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subcategory
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(event) => {
                        event.stopPropagation()
                        openFolderDialog(undefined, node.category?.id)
                      }}>
                        <Folder className="h-4 w-4 mr-2" />
                        Add Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(event) => {
                        event.stopPropagation()
                        openCategoryDialog(node.category)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation()
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
                      <DropdownMenuItem onClick={(event) => {
                        event.stopPropagation()
                        openFolderDialog(undefined, node.folder?.id)
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Subfolder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(event) => {
                        event.stopPropagation()
                        openFolderDialog(node.folder)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation()
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
            {node.children.map((child) => renderNode(child, level + 1))}
            {node.reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                onClick={(event) => {
                  if (event.target instanceof HTMLElement && (event.target.closest('button') || event.target.closest('[role=\"checkbox\"]'))) {
                    return
                  }
                  onReportClick(report)
                }}
              >
                <div className="w-6" />
                {onReportSelect && (
                  <UICheckbox
                    checked={selectedReports.has(report.id)}
                    onCheckedChange={(checked) => onReportSelect(report.id, checked as boolean)}
                    onClick={(event) => event.stopPropagation()}
                  />
                )}
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{report.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(event) => toggleFavorite(report.id, event)}
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
                    onClick={(event) => {
                      event.stopPropagation()
                      setPermReportId(report.id)
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Manage Permissions"
                  >
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {report.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {filteredTree.map((node) => renderNode(node))}
    </div>
  )
}
