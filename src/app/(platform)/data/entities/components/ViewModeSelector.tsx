import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TableIcon, List, Grid3X3 } from 'lucide-react'

interface ViewModeSelectorProps {
  viewMode: string
  onViewModeChange: (mode: string) => void
  onClose?: () => void
  showCloseButton?: boolean
}

export function ViewModeSelector({ 
  viewMode, 
  onViewModeChange, 
  onClose,
  showCloseButton = false 
}: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {showCloseButton && onClose && (
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      )}
      {/* View mode selector and settings */}
      <Select value={viewMode} onValueChange={onViewModeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="table">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Table
            </div>
          </SelectItem>
          <SelectItem value="list">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </div>
          </SelectItem>
          <SelectItem value="grid">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Grid
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
