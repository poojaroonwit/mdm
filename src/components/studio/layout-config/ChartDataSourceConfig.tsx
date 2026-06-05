'use client'

import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Database, Plus, X, Trash2, Paintbrush } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { PlacedWidget } from './widgets'
import { ChartDataSourceConfigProps, Attribute } from './chartDataSourceTypes'
import { CHART_DIMENSIONS, isValueMetricDimension } from './chartDimensions'
import { getEffectiveType } from './chartDataSourceUtils'
import { useDataModels, useAttributes } from './useChartDataSource'
import { AttributeDropZone } from './AttributeDropZone'
import { ColorInput } from './ColorInput'
import { Z_INDEX } from '@/lib/z-index'

// Aggregation types for value/metric dimensions
export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'MEDIAN' | 'STDDEV' | 'VARIANCE' | 'NONE'

// Filter types
export type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' | 'is_null' | 'is_not_null'
export type FilterLogic = 'AND' | 'OR'

export interface FilterCondition {
  id: string
  type: 'condition'
  attribute: string
  operator: FilterOperator
  value: string
}

export interface FilterGroup {
  id: string
  type: 'group'
  logic: FilterLogic
  items: Array<FilterCondition | FilterGroup>
}

export type FilterItem = FilterCondition | FilterGroup

export function ChartDataSourceConfig({
  widget,
  setPlacedWidgets,
  spaceId,
}: ChartDataSourceConfigProps) {
  const { dataModels, loading: loadingModels } = useDataModels(spaceId)
  
  // Support both camelCase and snake_case for backward compatibility
  const initialModelId = (widget.properties?.dataModelId 
    || (widget.properties as any)?.data_model_id 
    || (widget as any)?.data_config?.data_model_id 
    || (widget as any)?.data_config?.dataModelId 
    || '') as string
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId)
  
  const { attributes, loading } = useAttributes(selectedModelId, spaceId)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [openComboboxes, setOpenComboboxes] = useState<Record<string, boolean>>({})
  const [dragOverDimensions, setDragOverDimensions] = useState<Set<string>>(new Set())
  const [draggingBadge, setDraggingBadge] = useState<{ dimKey: string; index: number } | null>(null)
  const [dragOverBadge, setDragOverBadge] = useState<{ dimKey: string; index: number } | null>(null)
  
  // Per-dimension overrides for how to treat an attribute's type (e.g., as text/number/date)
  const [attributeTypeOverrides, setAttributeTypeOverrides] = useState<Record<string, Record<string, string>>>(
    (widget.properties?.chartDimensionTypeOverrides as Record<string, Record<string, string>>) || {}
  )
  // Per-dimension type settings (granularity, buckets, format, etc.)
  const [attributeTypeSettings, setAttributeTypeSettings] = useState<Record<string, Record<string, any>>>(
    (widget.properties?.chartDimensionTypeSettings as Record<string, Record<string, any>>) || {}
  )
  // Per-dimension display names (aliases) for attributes
  const [attributeDisplayNames, setAttributeDisplayNames] = useState<Record<string, Record<string, string>>>(
    (widget.properties?.chartDimensionDisplayNames as Record<string, Record<string, string>>) || {}
  )
  // Filters (nested groups/conditions)
  const [filters, setFilters] = useState<FilterGroup | null>((widget.properties?.rowFilters as FilterGroup) || null)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState<boolean>(false)
  
  // Per-dimension aggregation overrides for value/metric attributes
  const [attributeAggregations, setAttributeAggregations] = useState<Record<string, Record<string, AggregationType>>>(
    (widget.properties?.chartDimensionAggregations as Record<string, Record<string, AggregationType>>) || {}
  )
  
  // Dimension-level styles (for Row, Column, Value dimensions)
  const [dimensionStyles, setDimensionStyles] = useState<Record<string, any>>(
    (widget.properties?.chartDimensionStyles as Record<string, any>) || {}
  )
  
  // Sync selectedModelId with widget properties - use ref to prevent infinite loops
  const prevModelIdRef = React.useRef<string>('')
  useEffect(() => {
    const modelId = (widget.properties?.dataModelId 
      || (widget.properties as any)?.data_model_id 
      || (widget as any)?.data_config?.data_model_id 
      || (widget as any)?.data_config?.dataModelId 
      || '') as string
    
    // Only update if the model ID actually changed
    if (modelId && modelId !== selectedModelId && modelId !== prevModelIdRef.current) {
      prevModelIdRef.current = modelId
      setSelectedModelId(modelId)
    }
  }, [
    widget.properties?.dataModelId,
    (widget.properties as any)?.data_model_id,
    (widget as any)?.data_config?.data_model_id,
    (widget as any)?.data_config?.dataModelId,
  ]) // Removed selectedModelId from dependencies to prevent loops
  
  // If models load and none selected, auto-select the only model
  useEffect(() => {
    if (!selectedModelId && dataModels.length === 1) {
      const only = dataModels[0]
      const modelId = (only as any).id || (only as any)._id || String(only)
      setSelectedModelId(modelId)
      setPlacedWidgets(prev => prev.map(w => 
        w.id === widget.id 
          ? { 
              ...w, 
              properties: { 
                ...w.properties, 
                dataModelId: modelId, 
                // @ts-ignore legacy
                data_model_id: modelId 
              } 
            }
          : w
      ))
    }
  }, [dataModels, selectedModelId, setPlacedWidgets, widget.id])
  
  // Get chart dimensions configuration
  const chartDims = CHART_DIMENSIONS[widget.type] || [
    { key: 'dimension', label: 'Dimension', required: true },
    { key: 'metric', label: 'Metric', required: true },
  ]
  
  // Update widget property
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widget.id 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }
  
  // Persist a denormalized map of effective types per dimension for visualization layer
  const recomputeAndPersistEffectiveTypes = (nextChartDimensions?: Record<string, any>) => {
    const dims = (nextChartDimensions || widget.properties?.chartDimensions || {}) as Record<string, any>
    const result: Record<string, Record<string, string>> = {}
    Object.keys(dims).forEach((dimKey) => {
      const value = dims[dimKey]
      const values: string[] = Array.isArray(value) ? value : (value ? [value] : [])
      if (values.length > 0) {
        const map: Record<string, string> = {}
        values.forEach((name) => {
          const attr = attributes.find(a => a.name === name)
          const eff = getEffectiveType(dimKey, attr, attributeTypeOverrides)
          map[name] = eff
        })
        result[dimKey] = map
      }
    })
    updateProperty('chartDimensionsEffectiveTypes', result)
  }

  const setDimensionStyle = (dimKey: string, partial: Record<string, any>) => {
    setDimensionStyles(prev => {
      const updated = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          ...partial
        }
      }
      updateProperty('chartDimensionStyles', updated)
      return updated
    })
  }

  const setTypeSetting = (dimKey: string, attrName: string, partial: Record<string, any>) => {
    setAttributeTypeSettings(prev => {
      const updated: Record<string, Record<string, any>> = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: {
            ...(prev[dimKey]?.[attrName] || {}),
            ...partial,
          }
        }
      }
      updateProperty('chartDimensionTypeSettings', updated)
      return updated
    })
  }

  const setDisplayName = (dimKey: string, attrName: string, alias: string) => {
    setAttributeDisplayNames(prev => {
      const updated: Record<string, Record<string, string>> = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: alias,
        }
      }
      updateProperty('chartDimensionDisplayNames', updated)
      return updated
    })
  }
  
  // Get current dimension value
  const getDimensionValue = (dimKey: string): string | string[] => {
    const dims = widget.properties?.chartDimensions || {}
    return dims[dimKey] || (CHART_DIMENSIONS[widget.type]?.find(d => d.key === dimKey)?.multiple ? [] : '')
  }
  
  // Set dimension value
  const setDimensionValue = (dimKey: string, value: string | string[]) => {
    const dims = widget.properties?.chartDimensions || {}
    const next = { ...dims, [dimKey]: value }
    updateProperty('chartDimensions', next)
    recomputeAndPersistEffectiveTypes(next)
  }
  
  // Handle model selection
  const handleModelChange = (modelId: string) => {
    console.log('handleModelChange called with:', modelId)
    if (!modelId || modelId === 'none') return
    
    setSelectedModelId(modelId)
    setPlacedWidgets(prev => prev.map(w => 
      w.id === widget.id 
        ? { 
            ...w, 
            properties: { 
              ...w.properties, 
              dataModelId: modelId, 
              dataSource: 'data-model', // Ensure data source is set to data-model
              // @ts-ignore legacy
              data_model_id: modelId 
            } 
          }
        : w
    ))
    // Clear dimensions when model changes
    updateProperty('chartDimensions', {})
  }
  
  // Handle attribute selection for dimension
  const handleAttributeSelect = (dimKey: string, attributeName: string) => {
    const dim = chartDims.find(d => d.key === dimKey)
    const isValueMetric = isValueMetricDimension(dimKey)
    
    if (dim?.multiple) {
      const current = Array.isArray(getDimensionValue(dimKey)) ? getDimensionValue(dimKey) as string[] : []
      if (current.includes(attributeName)) {
        setDimensionValue(dimKey, current.filter(a => a !== attributeName))
        // Remove aggregation when attribute is removed
        if (isValueMetric) {
          setAttributeAggregations(prev => {
            const updated = { ...prev }
            if (updated[dimKey]) {
              const { [attributeName]: _, ...rest } = updated[dimKey]
              updated[dimKey] = rest
            }
            updateProperty('chartDimensionAggregations', updated)
            return updated
          })
        }
      } else {
        setDimensionValue(dimKey, [...current, attributeName])
        // Force aggregation for value/metric dimensions - default to SUM for numbers, COUNT for others
        if (isValueMetric) {
          const attr = attributes.find(a => a.name === attributeName)
          const isNumeric = attr?.type?.toLowerCase().includes('number') || 
                           attr?.type?.toLowerCase().includes('integer') ||
                           attr?.type?.toLowerCase().includes('decimal') ||
                           attr?.type?.toLowerCase().includes('float')
          const defaultAggregation: AggregationType = isNumeric ? 'SUM' : 'COUNT'
          
          setAttributeAggregations(prev => {
            const updated = {
              ...prev,
              [dimKey]: {
                ...(prev[dimKey] || {}),
                [attributeName]: defaultAggregation
              }
            }
            updateProperty('chartDimensionAggregations', updated)
            return updated
          })
        }
      }
    } else {
      setDimensionValue(dimKey, attributeName)
      // Force aggregation for value/metric dimensions
      if (isValueMetric) {
        const attr = attributes.find(a => a.name === attributeName)
        const isNumeric = attr?.type?.toLowerCase().includes('number') || 
                         attr?.type?.toLowerCase().includes('integer') ||
                         attr?.type?.toLowerCase().includes('decimal') ||
                         attr?.type?.toLowerCase().includes('float')
        const defaultAggregation: AggregationType = isNumeric ? 'SUM' : 'COUNT'
        
        setAttributeAggregations(prev => {
          const updated = {
            ...prev,
            [dimKey]: {
              [attributeName]: defaultAggregation
            }
          }
          updateProperty('chartDimensionAggregations', updated)
          return updated
        })
      }
    }
  }
  
  // Handle aggregation change for value/metric attributes
  const handleAggregationChange = (dimKey: string, attrName: string, aggregation: AggregationType) => {
    setAttributeAggregations(prev => {
      const updated = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: aggregation
        }
      }
      updateProperty('chartDimensionAggregations', updated)
      return updated
    })
  }

  // Handle badge reorder within drop zone
  const handleBadgeReorder = (dimKey: string, fromIndex: number, toIndex: number) => {
    const current = Array.isArray(getDimensionValue(dimKey)) ? getDimensionValue(dimKey) as string[] : []
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) {
      return
    }
    const reordered = Array.from(current)
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    setDimensionValue(dimKey, reordered)
  }

  // Handle drop from data model panel
  const handleAttributeDrop = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDimensions(prev => {
      const next = new Set(prev)
      next.delete(dimKey)
      return next
    })

    try {
      const data = e.dataTransfer.getData('application/json')
      if (!data) {
        console.warn('No data found in drop event')
        return
      }
      
      const parsed = JSON.parse(data)
      console.log('Drop data:', parsed)
      
      const { attribute, model } = parsed
      if (attribute && attribute.name) {
        // If no model is selected, auto-select the model from the dropped attribute
        if (!selectedModelId && model && model.id) {
          handleModelChange(model.id)
        }
        console.log('Setting attribute:', attribute.name, 'for dimension:', dimKey)
        // handleAttributeSelect will automatically set aggregation for value/metric dimensions
        handleAttributeSelect(dimKey, attribute.name)
      } else {
        console.warn('Invalid attribute data:', parsed)
      }
    } catch (error) {
      console.error('Error handling attribute drop:', error, e.dataTransfer.getData('application/json'))
    }
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    const types = Array.from(e.dataTransfer.types)
    console.log('Drag over types:', types)
    if (types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'copy'
      setDragOverDimensions(prev => new Set(prev).add(dimKey))
    }
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent, dimKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverDimensions(prev => {
      const next = new Set(prev)
      next.delete(dimKey)
      return next
    })
  }

  const setTypeOverride = (dimKey: string, attrName: string, nextType: string) => {
    setAttributeTypeOverrides(prev => {
      const updated: Record<string, Record<string, string>> = {
        ...prev,
        [dimKey]: {
          ...(prev[dimKey] || {}),
          [attrName]: nextType,
        }
      }
      updateProperty('chartDimensionTypeOverrides', updated)
      recomputeAndPersistEffectiveTypes()
      return updated
    })
  }
  
  return (
    <div className="space-y-4 p-4 overflow-visible">
      {/* Data Model Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Data Model
          {!spaceId && <span className="text-xs text-destructive">(No space ID)</span>}
        </Label>
        {loadingModels ? (
          <div className="text-xs text-muted-foreground py-2">Loading data models...</div>
        ) : dataModels.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            {!spaceId ? (
              <span className="text-destructive">Space ID is required</span>
            ) : (
              "No data models available"
            )}
          </div>
        ) : (
          <Select 
            value={selectedModelId || ''} 
            onValueChange={(value) => {
              console.log('Model selected:', value)
              handleModelChange(value)
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Select data model" />
            </SelectTrigger>
            <SelectContent 
              position="popper"
              className="max-h-[200px]"
              style={{ zIndex: Z_INDEX.popover }}
            >
              {dataModels.map((model: any) => {
                const modelId = model.id || model._id || String(model)
                const modelName = model.name || model.display_name || String(model)
                return (
                  <SelectItem key={modelId} value={modelId}>
                    {modelName}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        {!spaceId && (
          <div className="text-xs text-destructive mt-1">Space ID is required to load data models</div>
        )}
      </div>

      {/* Data Limit Control */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Data Limit</Label>
          <Input
            type="number"
            value={widget.properties?.dataLimit || ''}
            onChange={(e) => {
              const value = e.target.value
              updateProperty('dataLimit', value ? parseInt(value) || undefined : undefined)
            }}
            placeholder="No limit"
            className="h-8 text-xs w-32"
            min="1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum number of records to fetch (leave empty for no limit)
        </p>
      </div>
      
      {/* Chart Dimensions */}
      {selectedModelId && (
        <>
          <div className="space-y-3 border-t pt-3">
            <Label className="text-xs font-semibold">Chart Dimensions</Label>
            
            {chartDims.map(dim => {
              // Special handling for dateRange dimension
              if (dim.key === 'dateRange') {
                const dateRangeConfig = (widget.properties?.dateRangeConfig as { attribute?: string; startDate?: string; endDate?: string }) || {}
                const dateAttrs = attributes.filter(a => {
                  const type = getEffectiveType(dim.key, a, attributeTypeOverrides)
                  return type === 'date' || type === 'datetime'
                })
                
                return (
                  <div key={dim.key} className="space-y-2">
                    <Label className="text-xs">
                      {dim.label}
                      {dim.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Date attribute</Label>
                        <select
                          className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                          value={dateRangeConfig.attribute || ''}
                          onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, attribute: e.target.value })}
                        >
                          <option value="">Select date attribute</option>
                          {dateAttrs.map(attr => (
                            <option key={attr.name} value={attr.name}>{attr.name}</option>
                          ))}
                        </select>
                      </div>
                      {dateRangeConfig.attribute && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Start date</Label>
                            <input
                              type="date"
                              className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                              value={dateRangeConfig.startDate || ''}
                              onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">End date</Label>
                            <input
                              type="date"
                              className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                              value={dateRangeConfig.endDate || ''}
                              onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              const currentValue = getDimensionValue(dim.key)
              const isMultiple = dim.multiple || false
              const values = isMultiple ? (Array.isArray(currentValue) ? currentValue : []) : []
              const singleValue = isMultiple ? '' : (typeof currentValue === 'string' ? currentValue : '')
              
              // Only show painting icon for Row, Column, and Value dimensions
              const showStyleIcon = dim.key === 'rows' || dim.key === 'columns' || dim.key === 'values'
              const dimensionStyle = dimensionStyles[dim.key] || {}
              
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">
                      {dim.label}
                      {dim.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {showStyleIcon && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-0 bg-transparent border-0 hover:bg-transparent flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none"
                            style={{ backgroundColor: 'transparent', border: 'none' }}
                            title={`${dim.label} style`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Paintbrush className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2 whitespace-nowrap min-w-40" align="end" sideOffset={6} style={{ width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-2 text-[11px]">
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Font size</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={8} max={32} value={Number(dimensionStyle.fontSize ?? 12)} onChange={(e) => setDimensionStyle(dim.key, { fontSize: parseInt(e.target.value) || 12 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Font color</span>
                              <ColorInput
                                value={dimensionStyle.fontColor || '#111827'}
                                onChange={(color) => setDimensionStyle(dim.key, { fontColor: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Background</span>
                              <ColorInput
                                value={dimensionStyle.background || '#ffffff'}
                                onChange={(color) => setDimensionStyle(dim.key, { background: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Padding</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={0} max={32} value={Number(dimensionStyle.padding ?? 4)} onChange={(e) => setDimensionStyle(dim.key, { padding: parseInt(e.target.value) || 4 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Border width</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={0} max={10} value={Number(dimensionStyle.borderWidth ?? 1)} onChange={(e) => setDimensionStyle(dim.key, { borderWidth: parseInt(e.target.value) || 1 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Border color</span>
                              <ColorInput
                                value={dimensionStyle.borderColor || '#e5e7eb'}
                                onChange={(color) => setDimensionStyle(dim.key, { borderColor: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            {dim.key === 'values' && (
                              <>
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="text-muted-foreground">Text align</span>
                                  <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(dimensionStyle.textAlign ?? 'left')} onChange={(e) => setDimensionStyle(dim.key, { textAlign: e.target.value })}>
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="text-muted-foreground">Number format</span>
                                  <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(dimensionStyle.numberFormat ?? 'auto')} onChange={(e) => setDimensionStyle(dim.key, { numberFormat: e.target.value })}>
                                    <option value="auto">Auto</option>
                                    <option value="number">Number</option>
                                    <option value="percent">Percent</option>
                                    <option value="currency">Currency</option>
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  <AttributeDropZone
                    dimKey={dim.key}
                    dimLabel={dim.label}
                    required={dim.required}
                    isMultiple={isMultiple}
                    values={values}
                    singleValue={singleValue}
                    attributes={attributes}
                    selectedModelId={selectedModelId}
                    loading={loading}
                    searchQuery={searchQueries[dim.key] || ''}
                    onSearchChange={(query) => {
                      setSearchQueries(prev => ({ ...prev, [dim.key]: query }))
                    }}
                    onAttributeSelect={handleAttributeSelect}
                    onDimensionValueChange={(dimKey, value) => setDimensionValue(dimKey, value)}
                    attributeTypeOverrides={attributeTypeOverrides}
                    onTypeOverride={setTypeOverride}
                    attributeTypeSettings={attributeTypeSettings[dim.key] || {}}
                    onTypeSettingChange={setTypeSetting}
                    attributeDisplayNames={attributeDisplayNames[dim.key] || {}}
                    onDisplayNameChange={setDisplayName}
                    isValueMetric={isValueMetricDimension(dim.key)}
                    attributeAggregations={attributeAggregations[dim.key] || {}}
                    onAggregationChange={handleAggregationChange}
                    dragOverDimensions={dragOverDimensions}
                    draggingBadge={draggingBadge}
                    dragOverBadge={dragOverBadge}
                    onDragStart={(dimKey, index) => setDraggingBadge({ dimKey, index })}
                    onDragOver={(dimKey, index) => setDragOverBadge({ dimKey, index })}
                    onDragLeave={() => setDragOverBadge(null)}
                    onDrop={handleBadgeReorder}
                    onDragEnd={() => {
                      setDraggingBadge(null)
                      setDragOverBadge(null)
                    }}
                    onDragOverZone={handleDragOver}
                    onDragLeaveZone={handleDragLeave}
                    onDropZone={handleAttributeDrop}
                    openCombobox={openComboboxes[dim.key] || false}
                    onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))}
                  />
                </div>
              )
            })}
          </div>

  {/* Sorting */}
  <div className="space-y-3 border-t pt-3 mt-2">
    <Label className="text-xs font-semibold">Sorting</Label>
    {(() => {
      // Show ALL attributes from the selected data source (clearer UX)
      const allowedAttrs = attributes
      return (
        <div className="space-y-3">
          {/* Row sort - full row dropzone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Row sort</Label>
              <select
                className="rounded-[2px] px-2 py-1 text-[11px] bg-transparent border-0 focus:outline-none focus:ring-0 focus:border-0"
                value={String(widget.properties?.rowSortOrder || 'ASC')}
                onChange={(e) => updateProperty('rowSortOrder', e.target.value)}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
            <AttributeDropZone
              dimKey={'rowSort'}
              dimLabel={'Row sort'}
              required={false}
              isMultiple={false}
              values={[]}
              singleValue={String((widget.properties?.chartDimensions as Record<string, any>)?.rowSort || '')}
              attributes={allowedAttrs}
              selectedModelId={selectedModelId}
              loading={loading}
              searchQuery={searchQueries['rowSort'] || ''}
              onSearchChange={(query) => setSearchQueries(prev => ({ ...prev, ['rowSort']: query }))}
              onAttributeSelect={(k, name) => setDimensionValue('rowSort', name)}
              onDimensionValueChange={(k, value) => setDimensionValue('rowSort', value)}
              attributeTypeOverrides={{}}
              onTypeOverride={() => {}}
              attributeTypeSettings={{}}
              onTypeSettingChange={() => {}}
              isValueMetric={false}
              attributeAggregations={{}}
              onAggregationChange={() => {}}
              dragOverDimensions={dragOverDimensions}
              draggingBadge={draggingBadge}
              dragOverBadge={dragOverBadge}
              onDragStart={(k,i)=>{}}
              onDragOver={(k,i)=>{}}
              onDragLeave={()=>{}}
              onDrop={()=>{}}
              onDragEnd={()=>{}}
              onDragOverZone={()=>{}}
              onDragLeaveZone={()=>{}}
              onDropZone={()=>{}}
              openCombobox={openComboboxes['rowSort'] || false}
              onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, ['rowSort']: open }))}
            />
          </div>
          {/* Column sort - full row dropzone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Column sort</Label>
              <select
                className="rounded-[2px] px-2 py-1 text-[11px] bg-transparent border-0 focus:outline-none focus:ring-0 focus:border-0"
                value={String(widget.properties?.columnSortOrder || 'ASC')}
                onChange={(e) => updateProperty('columnSortOrder', e.target.value)}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
            <AttributeDropZone
              dimKey={'columnSort'}
              dimLabel={'Column sort'}
              required={false}
              isMultiple={false}
              values={[]}
              singleValue={String((widget.properties?.chartDimensions as Record<string, any>)?.columnSort || '')}
              attributes={allowedAttrs}
              selectedModelId={selectedModelId}
              loading={loading}
              searchQuery={searchQueries['columnSort'] || ''}
              onSearchChange={(query) => setSearchQueries(prev => ({ ...prev, ['columnSort']: query }))}
              onAttributeSelect={(k, name) => setDimensionValue('columnSort', name)}
              onDimensionValueChange={(k, value) => setDimensionValue('columnSort', value)}
              attributeTypeOverrides={{}}
              onTypeOverride={() => {}}
              attributeTypeSettings={{}}
              onTypeSettingChange={() => {}}
              isValueMetric={false}
              attributeAggregations={{}}
              onAggregationChange={() => {}}
              dragOverDimensions={dragOverDimensions}
              draggingBadge={draggingBadge}
              dragOverBadge={dragOverBadge}
              onDragStart={(k,i)=>{}}
              onDragOver={(k,i)=>{}}
              onDragLeave={()=>{}}
              onDrop={()=>{}}
              onDragEnd={()=>{}}
              onDragOverZone={()=>{}}
              onDragLeaveZone={()=>{}}
              onDropZone={()=>{}}
              openCombobox={openComboboxes['columnSort'] || false}
              onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, ['columnSort']: open }))}
            />
          </div>
        </div>
      )
    })()}
  </div>

  {/* Filters section removed */}

  {/* Totals & Subtotals Configuration */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-sm">Configure Filters</DialogTitle>
        </DialogHeader>
        {(() => {
      const dimsObj = (widget.properties?.chartDimensions || {}) as Record<string, any>
      const selectedSet = new Set<string>([
        ...([] as string[]).concat(
          Array.isArray(dimsObj.rows) ? dimsObj.rows : (dimsObj.rows ? [dimsObj.rows] : []),
          Array.isArray(dimsObj.columns) ? dimsObj.columns : (dimsObj.columns ? [dimsObj.columns] : []),
          Array.isArray(dimsObj.values) ? dimsObj.values : (dimsObj.values ? [dimsObj.values] : [])
        )
      ].filter(Boolean))
      const allowedAttrs = attributes.filter(a => selectedSet.has(a.name))

      // Use top-level filters state

      const generateId = () => `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const addCondition = (groupId: string, parentGroup: FilterGroup): FilterGroup => {
        if (parentGroup.id === groupId) {
          return {
            ...parentGroup,
            items: [...parentGroup.items, {
              id: generateId(),
              type: 'condition',
              attribute: allowedAttrs[0]?.name || '',
              operator: 'equals',
              value: ''
            }]
          }
        }
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => 
            item.type === 'group' ? addCondition(groupId, item) : item
          )
        }
      }

      const addGroup = (groupId: string, parentGroup: FilterGroup): FilterGroup => {
        if (parentGroup.id === groupId) {
          return {
            ...parentGroup,
            items: [...parentGroup.items, {
              id: generateId(),
              type: 'group',
              logic: 'AND',
              items: []
            }]
          }
        }
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => 
            item.type === 'group' ? addGroup(groupId, item) : item
          )
        }
      }

      const removeItem = (itemId: string, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.filter(item => item.id !== itemId).map(item =>
            item.type === 'group' ? {
              ...item,
              items: item.items // Keep nested items, just remove direct children
            } : item
          )
        }
      }

      const updateItem = (itemId: string, updates: Partial<FilterCondition | FilterGroup>, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.map((item: FilterItem) => {
            if (item.id === itemId) {
              return { ...item, ...updates } as FilterItem
            }
            return item.type === 'group' ? updateItem(itemId, updates, item) : item
          })
        }
      }

      const updateCondition = (itemId: string, field: keyof FilterCondition, value: any, parentGroup: FilterGroup): FilterGroup => {
        return {
          ...parentGroup,
          items: parentGroup.items.map(item => {
            if (item.id === itemId && item.type === 'condition') {
              return { ...item, [field]: value }
            }
            return item.type === 'group' ? updateCondition(itemId, field, value, item) : item
          })
        }
      }

      const saveFilters = (newFilters: FilterGroup | null) => {
        setFilters(newFilters)
        updateProperty('rowFilters', newFilters)
      }

      const FilterItemComponent: React.FC<{ item: FilterItem; parentGroup: FilterGroup; depth?: number }> = ({ item, parentGroup, depth = 0 }) => {
        const isCondition = item.type === 'condition'
        const indent = depth * 16

        if (isCondition) {
          const cond = item as FilterCondition
          return (
            <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${indent}px` }}>
              <div className="flex items-center gap-2 flex-1 border rounded-[6px] p-2 bg-muted">
                <select
                  className="min-w-[160px] rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                  value={cond.attribute}
                  onChange={(e) => saveFilters(updateCondition(cond.id, 'attribute', e.target.value, parentGroup))}
                >
                  {allowedAttrs.map(attr => (
                    <option key={attr.name} value={attr.name}>{attr.name}</option>
                  ))}
                </select>
                <select
                  className="w-36 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                  value={cond.operator}
                  onChange={(e) => saveFilters(updateCondition(cond.id, 'operator', e.target.value, parentGroup))}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not equals</option>
                  <option value="contains">Contains</option>
                  <option value="not_contains">Not contains</option>
                  <option value="starts_with">Starts with</option>
                  <option value="ends_with">Ends with</option>
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                  <option value="greater_or_equal">Greater or equal</option>
                  <option value="less_or_equal">Less or equal</option>
                  <option value="is_null">Is null</option>
                  <option value="is_not_null">Is not null</option>
                </select>
                {!['is_null', 'is_not_null'].includes(cond.operator) && (
                  <input
                    type="text"
                    className="min-w-[160px] rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                    value={cond.value}
                    onChange={(e) => saveFilters(updateCondition(cond.id, 'value', e.target.value, parentGroup))}
                    placeholder="Value"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => saveFilters(removeItem(cond.id, parentGroup))}
                className="p-1 hover:bg-destructive/10 rounded text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
        } else {
          const group = item as FilterGroup
          return (
            <div className="space-y-1" style={{ paddingLeft: `${indent}px` }}>
              <div className="flex items-center gap-2 border rounded-[6px] p-2 bg-primary/10">
                <select
                  className="w-24 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0 font-semibold"
                  value={group.logic}
                  onChange={(e) => saveFilters(updateItem(group.id, { logic: e.target.value as FilterLogic }, parentGroup))}
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
                <span className="text-[10px] text-muted-foreground">Group</span>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => saveFilters(addCondition(group.id, parentGroup))}
                  className="p-1 hover:bg-primary/10 rounded text-primary"
                  title="Add condition"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => saveFilters(addGroup(group.id, parentGroup))}
                  className="p-1 hover:bg-primary/10 rounded text-primary"
                  title="Add group"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => saveFilters(removeItem(group.id, parentGroup))}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-1 pl-4">
                {group.items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => saveFilters(addCondition(group.id, parentGroup))}
                    className="flex items-center gap-2 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Add condition
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground pl-[16px]">
                      <span className="min-w-[160px]">Attribute</span>
                      <span className="w-36">Operator</span>
                      <span className="min-w-[160px]">Value</span>
                    </div>
                    {group.items.map((childItem) => (
                      <FilterItemComponent key={childItem.id} item={childItem} parentGroup={group} depth={depth + 1} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )
        }
      }

      if (!filters) {
        return (
          <button
            type="button"
            onClick={() => {
              const newGroup: FilterGroup = {
                id: generateId(),
                type: 'group',
                logic: 'AND',
                items: []
              }
              saveFilters(newGroup)
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs border rounded hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
            Add filter group
          </button>
        )
      }

      return (
        <div className="space-y-2">
          <FilterItemComponent item={filters} parentGroup={filters} depth={0} />
        </div>
      )
    })()}
        <DialogFooter>
          <button
            type="button"
            className="px-3 py-1.5 text-[12px] rounded-[2px] bg-input hover:bg-muted"
            onClick={() => setIsFilterDialogOpen(false)}
          >
            Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  {/* Totals & Subtotals Configuration */}
  <div className="space-y-3 border-t pt-3 mt-2">
    <Label className="text-xs font-semibold">Totals & Subtotals</Label>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show row totals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showRowTotals !== false}
          onChange={(e) => updateProperty('showRowTotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show row subtotals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showRowSubtotals !== false}
          onChange={(e) => updateProperty('showRowSubtotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show column totals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showColumnTotals !== false}
          onChange={(e) => updateProperty('showColumnTotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show column subtotals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showColumnSubtotals !== false}
          onChange={(e) => updateProperty('showColumnSubtotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
    </div>
  </div>
        </>
      )}
      
      {!selectedModelId && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Select a data model to configure chart dimensions
        </div>
      )}
    </div>
  )
}
