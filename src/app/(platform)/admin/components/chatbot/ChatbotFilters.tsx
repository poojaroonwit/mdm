'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Filter } from 'lucide-react'

interface ChatbotFiltersProps {
  statusFilter: 'all' | 'published' | 'draft'
  onStatusFilterChange: (status: 'all' | 'published' | 'draft') => void
  deploymentFilter: 'all' | 'popover' | 'fullpage' | 'popup-center'
  onDeploymentFilterChange: (deployment: 'all' | 'popover' | 'fullpage' | 'popup-center') => void
  sortBy: 'name' | 'created' | 'updated' | 'status'
  onSortChange: (sort: 'name' | 'created' | 'updated' | 'status') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export function ChatbotFilters({
  statusFilter,
  onStatusFilterChange,
  deploymentFilter,
  onDeploymentFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
}: ChatbotFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm">Filters:</Label>
      </div>
      
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={statusFilter} onValueChange={(v: any) => onStatusFilterChange(v)}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Deployment</Label>
        <Select value={deploymentFilter} onValueChange={(v: any) => onDeploymentFilterChange(v)}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="popover">Popover</SelectItem>
            <SelectItem value="popup-center">Popup Center</SelectItem>
            <SelectItem value="fullpage">Full Page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <Select value={sortBy} onValueChange={(v: any) => onSortChange(v)}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Order</Label>
        <Select value={sortOrder} onValueChange={(v: any) => onSortOrderChange(v)}>
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}









