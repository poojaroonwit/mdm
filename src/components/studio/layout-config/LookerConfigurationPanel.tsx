'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import type { PlacedWidget } from './widgets'
import type {
  Attribute,
  FieldConfig,
  FilterConfig,
  SortConfig,
  WidgetPropertyUpdater,
} from './looker-studio-data-source-types'
import { LookerDateRefreshSections } from './LookerDateRefreshSections'
import { LookerFieldBuckets } from './LookerFieldBuckets'
import { LookerFilterSortSections } from './LookerFilterSortSections'

interface LookerConfigurationPanelProps {
  widget: PlacedWidget
  attributes: Attribute[]
  dimensions: FieldConfig[]
  metrics: FieldConfig[]
  filters: FilterConfig[]
  sorts: SortConfig[]
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  updateProperty: WidgetPropertyUpdater
  onAddDimension: (attribute: Attribute) => void
  onAddMetric: (attribute: Attribute) => void
  onRemoveDimension: (fieldName: string) => void
  onRemoveMetric: (fieldName: string) => void
  onUpdateMetricAggregation: (fieldName: string, aggregation: FieldConfig['aggregation']) => void
  onAddFilter: () => void
  onUpdateFilter: (index: number, updates: Partial<FilterConfig>) => void
  onRemoveFilter: (index: number) => void
  onAddSort: () => void
  onUpdateSort: (index: number, updates: Partial<SortConfig>) => void
  onRemoveSort: (index: number) => void
}

export function LookerConfigurationPanel({
  widget,
  attributes,
  dimensions,
  metrics,
  filters,
  sorts,
  expandedSections,
  toggleSection,
  updateProperty,
  onAddDimension,
  onAddMetric,
  onRemoveDimension,
  onRemoveMetric,
  onUpdateMetricAggregation,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onAddSort,
  onUpdateSort,
  onRemoveSort,
}: LookerConfigurationPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          <LookerFieldBuckets
            attributes={attributes}
            dimensions={dimensions}
            metrics={metrics}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onAddDimension={onAddDimension}
            onAddMetric={onAddMetric}
            onRemoveDimension={onRemoveDimension}
            onRemoveMetric={onRemoveMetric}
            onUpdateMetricAggregation={onUpdateMetricAggregation}
          />
          <LookerFilterSortSections
            attributes={attributes}
            filters={filters}
            sorts={sorts}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            onAddFilter={onAddFilter}
            onUpdateFilter={onUpdateFilter}
            onRemoveFilter={onRemoveFilter}
            onAddSort={onAddSort}
            onUpdateSort={onUpdateSort}
            onRemoveSort={onRemoveSort}
          />
          <LookerDateRefreshSections
            widget={widget}
            attributes={attributes}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            updateProperty={updateProperty}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
