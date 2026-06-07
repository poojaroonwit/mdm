'use client'

import React, { useState, useEffect } from 'react'
import { PlacedWidget } from './widgets'
import { ChartDataSourceConfigProps, Attribute } from './chartDataSourceTypes'
import { CHART_DIMENSIONS, isValueMetricDimension } from './chartDimensions'
import { getEffectiveType } from './chartDataSourceUtils'
import { useDataModels, useAttributes } from './useChartDataSource'
import { ChartDataSourceConfigView } from './ChartDataSourceConfigView'

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
    <ChartDataSourceConfigView
      loadingModels={loadingModels}
      selectedModelId={selectedModelId}
      handleModelChange={handleModelChange}
      dataModels={dataModels}
      spaceId={spaceId}
      widget={widget}
      chartDims={chartDims}
      getDimensionValue={getDimensionValue}
      setDimensionValue={setDimensionValue}
      attributes={attributes}
      loading={loading}
      searchQueries={searchQueries}
      setSearchQueries={setSearchQueries}
      openComboboxes={openComboboxes}
      setOpenComboboxes={setOpenComboboxes}
      dragOverDimensions={dragOverDimensions}
      setDragOverDimensions={setDragOverDimensions}
      draggingBadge={draggingBadge}
      setDraggingBadge={setDraggingBadge}
      dragOverBadge={dragOverBadge}
      setDragOverBadge={setDragOverBadge}
      attributeTypeOverrides={attributeTypeOverrides}
      setAttributeTypeOverrides={setAttributeTypeOverrides}
      attributeTypeSettings={attributeTypeSettings}
      setTypeSetting={setTypeSetting}
      attributeDisplayNames={attributeDisplayNames}
      setDisplayName={setDisplayName}
      attributeAggregations={attributeAggregations}
      setAttributeAggregations={setAttributeAggregations}
      updateProperty={updateProperty}
      recomputeAndPersistEffectiveTypes={recomputeAndPersistEffectiveTypes}
      dimensionStyles={dimensionStyles}
      setDimensionStyle={setDimensionStyle}
      isFilterDialogOpen={isFilterDialogOpen}
      setIsFilterDialogOpen={setIsFilterDialogOpen}
      filters={filters}
      setFilters={setFilters}
      handleAttributeSelect={handleAttributeSelect}
      setTypeOverride={setTypeOverride}
      handleAggregationChange={handleAggregationChange}
      handleBadgeReorder={handleBadgeReorder}
      handleDragOver={handleDragOver}
      handleDragLeave={handleDragLeave}
      handleAttributeDrop={handleAttributeDrop}
    />
  )}
