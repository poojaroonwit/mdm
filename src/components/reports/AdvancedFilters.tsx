'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Calendar } from 'lucide-react'
import type { ReportSource } from '@/types/reports'

interface AdvancedFiltersProps {
  filters: {
    source: ReportSource | ''
    category: string
    status: string
    showFavorites: boolean
    dateFrom?: string
    dateTo?: string
  }
  categories: Array<{ id: string; name: string }>
  onFiltersChange: (filters: any) => void
  onClear: () => void
}

export function AdvancedFilters({ filters, categories, onFiltersChange, onClear }: AdvancedFiltersProps) {
  const [showDateRange, setShowDateRange] = useState(false)

  const activeFilterCount = [
    filters.source,
    filters.category,
    filters.status,
    filters.showFavorites,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Source Type</Label>
            <Select
              value={filters.source}
              onValueChange={(value) => onFiltersChange({ ...filters, source: value as ReportSource | '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sources</SelectItem>
                <SelectItem value="BUILT_IN">Built-in</SelectItem>
                <SelectItem value="BUILT_IN_VISUALIZE">Built-in Visualize</SelectItem>
                <SelectItem value="CUSTOM_EMBED_LINK">Custom Embed Link</SelectItem>
                <SelectItem value="POWER_BI">Power BI</SelectItem>
                <SelectItem value="GRAFANA">Grafana</SelectItem>
                <SelectItem value="LOOKER_STUDIO">Looker Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => onFiltersChange({ ...filters, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="favorites"
              checked={filters.showFavorites}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showFavorites: checked as boolean })}
            />
            <Label htmlFor="favorites" className="cursor-pointer">Favorites only</Label>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDateRange(!showDateRange)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>

          {showDateRange && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters ({activeFilterCount})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

