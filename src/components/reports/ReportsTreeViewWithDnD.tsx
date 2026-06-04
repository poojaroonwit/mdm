'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { ReportsTreeView } from './ReportsTreeView'
import { FileText } from 'lucide-react'
import type { Report, ReportCategory, ReportFolder } from '@/types/reports'

interface ReportsTreeViewWithDnDProps {
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
  onMoveReport?: (reportId: string, categoryId?: string, folderId?: string) => Promise<void>
}

export function ReportsTreeViewWithDnD(props: ReportsTreeViewWithDnDProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<{ type: string; item: any } | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    // Find the dragged item
    const report = props.reports.find(r => r.id === event.active.id)
    if (report) {
      setDraggedItem({ type: 'report', item: report })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedItem(null)

    if (!over || !props.onMoveReport) return

    const reportId = active.id as string
    const targetId = over.id as string

    // Find target category or folder
    const targetCategory = props.categories.find(c => c.id === targetId)
    const targetFolder = props.folders.find(f => f.id === targetId)

    if (targetCategory) {
      await props.onMoveReport(reportId, targetCategory.id, undefined)
    } else if (targetFolder) {
      await props.onMoveReport(reportId, undefined, targetFolder.id)
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ReportsTreeView {...props} />
      <DragOverlay>
        {draggedItem && (
          <div className="bg-background p-2 rounded shadow-lg border">
            {draggedItem.type === 'report' && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>{draggedItem.item.name}</span>
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

