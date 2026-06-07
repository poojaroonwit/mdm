'use client'

import { GripVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Attribute, FieldConfig } from './looker-studio-data-source-types'
import { LookerConfigSection } from './LookerConfigSection'

interface LookerFieldBucketsProps {
  attributes: Attribute[]
  dimensions: FieldConfig[]
  metrics: FieldConfig[]
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  onAddDimension: (attribute: Attribute) => void
  onAddMetric: (attribute: Attribute) => void
  onRemoveDimension: (fieldName: string) => void
  onRemoveMetric: (fieldName: string) => void
  onUpdateMetricAggregation: (fieldName: string, aggregation: FieldConfig['aggregation']) => void
}

function readDroppedAttribute(event: React.DragEvent<HTMLDivElement>): Attribute | null {
  event.preventDefault()
  event.stopPropagation()
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) return null
    return JSON.parse(data).attribute || null
  } catch (error) {
    console.error('Error handling drop:', error)
    return null
  }
}

export function LookerFieldBuckets({
  attributes,
  dimensions,
  metrics,
  expandedSections,
  toggleSection,
  onAddDimension,
  onAddMetric,
  onRemoveDimension,
  onRemoveMetric,
  onUpdateMetricAggregation,
}: LookerFieldBucketsProps) {
  return (
    <>
      <LookerConfigSection
        title="Dimensions"
        section="dimensions"
        count={dimensions.length}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div
          className="p-2 space-y-1 min-h-[120px]"
          data-dimension-area
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onDrop={(event) => {
            const attribute = readDroppedAttribute(event)
            if (attribute) onAddDimension(attribute)
          }}
        >
          {dimensions.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4 text-center border-2 border-dashed rounded">
              Drag dimensions here or click fields to add
            </div>
          ) : (
            dimensions.map((dim, index) => {
              const attr = attributes.find(item => item.name === dim.fieldName)
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">{attr?.display_name || dim.fieldName}</div>
                    <div className="text-[10px] text-muted-foreground">{attr?.type || 'unknown'}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveDimension(dim.fieldName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </LookerConfigSection>

      <LookerConfigSection
        title="Metrics"
        section="metrics"
        count={metrics.length}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div
          className="p-2 space-y-2 min-h-[120px]"
          data-measure-area
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
          onDrop={(event) => {
            const attribute = readDroppedAttribute(event)
            if (attribute) onAddMetric(attribute)
          }}
        >
          {metrics.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4 text-center border-2 border-dashed rounded">
              Drag metrics here or click numeric fields to add
            </div>
          ) : (
            metrics.map((metric, index) => {
              const attr = attributes.find(item => item.name === metric.fieldName)
              const aggregation = metric.aggregation || 'SUM'
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded group">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{attr?.display_name || metric.fieldName}</span>
                      <Select
                        value={aggregation}
                        onValueChange={(value) => onUpdateMetricAggregation(metric.fieldName, value as FieldConfig['aggregation'])}
                      >
                        <SelectTrigger className="h-6 w-24 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUM">Sum</SelectItem>
                          <SelectItem value="AVG">Avg</SelectItem>
                          <SelectItem value="COUNT">Count</SelectItem>
                          <SelectItem value="COUNT_DISTINCT">Count Distinct</SelectItem>
                          <SelectItem value="MIN">Min</SelectItem>
                          <SelectItem value="MAX">Max</SelectItem>
                          <SelectItem value="NONE">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{attr?.type || 'unknown'}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveMetric(metric.fieldName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </LookerConfigSection>
    </>
  )
}
