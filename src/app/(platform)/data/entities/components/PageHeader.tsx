import React from 'react'
import { DataModel } from '../types'
import { ViewModeSelector } from './ViewModeSelector'

interface PageHeaderProps {
  dataModel: DataModel | null
  viewMode: string
  onViewModeChange: (mode: string) => void
  onClose?: () => void
  showCloseButton?: boolean
  recordDetailOpen?: boolean
  displayMode?: string
}

export function PageHeader({ 
  dataModel, 
  viewMode, 
  onViewModeChange, 
  onClose,
  showCloseButton = false,
  recordDetailOpen = false,
  displayMode = 'page'
}: PageHeaderProps) {
  // Don't show header if in page mode with record detail open
  if (displayMode === 'page' && recordDetailOpen) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {dataModel?.display_name || 'Data Records'}
        </h1>
        <p className="text-muted-foreground">
          {dataModel?.description || 'View and manage data records'}
        </p>
      </div>
      <ViewModeSelector
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        onClose={onClose}
        showCloseButton={showCloseButton}
      />
    </div>
  )
}
