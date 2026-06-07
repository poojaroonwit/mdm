'use client'

import { ArrowUpDown, Filter, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Attribute, FilterConfig, SortConfig } from './looker-studio-data-source-types'
import { LookerConfigSection } from './LookerConfigSection'

interface LookerFilterSortSectionsProps {
  attributes: Attribute[]
  filters: FilterConfig[]
  sorts: SortConfig[]
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  onAddFilter: () => void
  onUpdateFilter: (index: number, updates: Partial<FilterConfig>) => void
  onRemoveFilter: (index: number) => void
  onAddSort: () => void
  onUpdateSort: (index: number, updates: Partial<SortConfig>) => void
  onRemoveSort: (index: number) => void
}

function AttributeSelectItems({ attributes }: { attributes: Attribute[] }) {
  return (
    <>
      {attributes.map(attr => (
        <SelectItem key={attr.id} value={attr.name}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{attr.display_name || attr.name}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
              {attr.type || 'text'}
            </span>
          </div>
        </SelectItem>
      ))}
    </>
  )
}

export function LookerFilterSortSections({
  attributes,
  filters,
  sorts,
  expandedSections,
  toggleSection,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onAddSort,
  onUpdateSort,
  onRemoveSort,
}: LookerFilterSortSectionsProps) {
  return (
    <>
      <LookerConfigSection
        title="Filters"
        section="filters"
        count={filters.length}
        icon={Filter}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        action={
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onAddFilter}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        }
      >
        <div className="p-2 space-y-2">
          {filters.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4 text-center">No filters applied</div>
          ) : (
            filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <Select value={filter.field} onValueChange={(value) => onUpdateFilter(index, { field: value })}>
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <AttributeSelectItems attributes={attributes} />
                  </SelectContent>
                </Select>
                <Select
                  value={filter.operator}
                  onValueChange={(value) => onUpdateFilter(index, { operator: value as FilterConfig['operator'] })}
                >
                  <SelectTrigger className="h-7 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EQUALS">Equals</SelectItem>
                    <SelectItem value="NOT_EQUALS">Not equals</SelectItem>
                    <SelectItem value="CONTAINS">Contains</SelectItem>
                    <SelectItem value="NOT_CONTAINS">Not contains</SelectItem>
                    <SelectItem value="GREATER_THAN">Greater than</SelectItem>
                    <SelectItem value="LESS_THAN">Less than</SelectItem>
                    <SelectItem value="BETWEEN">Between</SelectItem>
                    <SelectItem value="IN">In</SelectItem>
                    <SelectItem value="NOT_IN">Not in</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={filter.value || ''}
                  onChange={(event) => onUpdateFilter(index, { value: event.target.value })}
                  placeholder="Value"
                  className="h-7 flex-1 text-xs"
                />
                {filter.operator === 'BETWEEN' && (
                  <Input
                    value={filter.value2 || ''}
                    onChange={(event) => onUpdateFilter(index, { value2: event.target.value })}
                    placeholder="Value 2"
                    className="h-7 w-24 text-xs"
                  />
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRemoveFilter(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </LookerConfigSection>

      <LookerConfigSection
        title="Sort"
        section="sorts"
        count={sorts.length}
        icon={ArrowUpDown}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        action={
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onAddSort}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        }
      >
        <div className="p-2 space-y-2">
          {sorts.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4 text-center">No sorting applied</div>
          ) : (
            sorts.map((sort, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                <Select value={sort.field} onValueChange={(value) => onUpdateSort(index, { field: value })}>
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    <AttributeSelectItems attributes={attributes} />
                  </SelectContent>
                </Select>
                <Select
                  value={sort.direction}
                  onValueChange={(value) => onUpdateSort(index, { direction: value as 'ASC' | 'DESC' })}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASC">Ascending</SelectItem>
                    <SelectItem value="DESC">Descending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onRemoveSort(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </LookerConfigSection>
    </>
  )
}
