'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Save, Share, X } from 'lucide-react'

type Attribute = {
  id: string
  name: string
  display_name: string
}

type AdvancedFilter = {
  id: string
  attribute: string
  operator: string
  value: string
}

type FilterSet = {
  id: string
  name: string
  description?: string
  filters: AdvancedFilter[]
  isPublic: boolean
  createdBy: string
}

interface AdvancedFiltersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  attributes: Attribute[]
  advancedFilters: AdvancedFilter[]

  addAdvancedFilter: () => void
  updateAdvancedFilter: (id: string, key: 'attribute' | 'operator' | 'value', value: string) => void
  removeAdvancedFilter: (id: string) => void

  filterSets: FilterSet[]
  loadFilterSet: (filterSet: FilterSet) => void
  deleteFilterSet: (id: string) => void

  filterSetName: string
  setFilterSetName: (name: string) => void
  filterSetDescription: string
  setFilterSetDescription: (desc: string) => void
  filterSetIsPublic: boolean
  setFilterSetIsPublic: (v: boolean) => void
  saveFilterSet: () => void

  applyAdvancedFilters: () => void
}

export function AdvancedFiltersDialog(props: AdvancedFiltersDialogProps) {
  const {
    open,
    onOpenChange,
    attributes,
    advancedFilters,
    addAdvancedFilter,
    updateAdvancedFilter,
    removeAdvancedFilter,
    filterSets,
    loadFilterSet,
    deleteFilterSet,
    filterSetName,
    setFilterSetName,
    filterSetDescription,
    setFilterSetDescription,
    filterSetIsPublic,
    setFilterSetIsPublic,
    saveFilterSet,
    applyAdvancedFilters,
  } = props

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-sm">
          {/* FilterX icon intentionally omitted here; parent can wrap this trigger if needed */}
          Advanced Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Create complex filter conditions and save them as reusable filter sets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filter Sets Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Saved Filter Sets</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={saveFilterSet}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Current
                </Button>
              </div>
            </div>

            {filterSets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filterSets.map((filterSet) => (
                  <div key={filterSet.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{filterSet.name}</h5>
                        {filterSet.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            <Share className="mr-1 h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => loadFilterSet(filterSet)}>
                          Load
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteFilterSet(filterSet.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                    {filterSet.description && (
                      <p className="text-sm text-muted-foreground mb-2">{filterSet.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {filterSet.filters.length} filter{filterSet.filters.length !== 1 ? 's' : ''} •
                      Created by {filterSet.createdBy}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No saved filter sets yet</div>
            )}
          </div>

          {/* Save Filter Set Form */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Save Current Filters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Filter Set Name</Label>
                <Input
                  value={filterSetName}
                  onChange={(e) => setFilterSetName(e.target.value)}
                  placeholder="Enter filter set name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={filterSetDescription}
                  onChange={(e) => setFilterSetDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={filterSetIsPublic}
                  onChange={(e) => setFilterSetIsPublic(e.target.checked)}
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Make this filter set public (shareable with other users)
                </Label>
              </div>
              <div className="md:col-span-2">
                <Button onClick={saveFilterSet} disabled={!filterSetName.trim() || advancedFilters.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Filter Set
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Conditions */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Filter Conditions</h4>
              <Button size="sm" variant="outline" onClick={addAdvancedFilter}>
                <Plus className="mr-2 h-4 w-4" />
                Add Condition
              </Button>
            </div>

            {advancedFilters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No filter conditions added yet. Click "Add Condition" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {advancedFilters.map((filter, index) => (
                  <div key={filter.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="text-sm font-medium w-8">{index + 1}.</span>
                    <Select
                      value={filter.attribute}
                      onValueChange={(value) => updateAdvancedFilter(filter.id, 'attribute', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select attribute" />
                      </SelectTrigger>
                      <SelectContent>
                        {attributes.map((attr) => (
                          <SelectItem key={attr.id} value={attr.name}>
                            {attr.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filter.operator}
                      onValueChange={(value) => updateAdvancedFilter(filter.id, 'operator', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">equals</SelectItem>
                        <SelectItem value="not_equals">not equals</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="starts_with">starts with</SelectItem>
                        <SelectItem value="ends_with">ends with</SelectItem>
                        <SelectItem value="gt">greater than</SelectItem>
                        <SelectItem value="gte">greater or equal</SelectItem>
                        <SelectItem value="lt">less than</SelectItem>
                        <SelectItem value="lte">less or equal</SelectItem>
                        <SelectItem value="is_empty">is empty</SelectItem>
                        <SelectItem value="is_not_empty">is not empty</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={filter.value}
                      onChange={(e) => updateAdvancedFilter(filter.id, 'value', e.target.value)}
                      placeholder="Enter value"
                      className="flex-1"
                      disabled={['is_empty', 'is_not_empty'].includes(filter.operator)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAdvancedFilter(filter.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={applyAdvancedFilters} disabled={advancedFilters.length === 0}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdvancedFiltersDialog


