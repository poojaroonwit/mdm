'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PlacedWidget } from './widgets'
import toast from 'react-hot-toast'
import { LookerConfigurationPanel } from './LookerConfigurationPanel'
import { LookerDataSourceEmptyState, LookerDataSourceHeader } from './LookerDataSourceHeader'
import { LookerFieldPicker } from './LookerFieldPicker'
import type { Attribute, DataModel, FieldConfig, FilterConfig, SortConfig } from './looker-studio-data-source-types'

interface LookerStudioDataSourceProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  spaceId?: string
}

export function LookerStudioDataSource({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  spaceId,
}: LookerStudioDataSourceProps) {
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const initialModelId = (widget.properties?.dataModelId 
    || (widget.properties as any)?.data_model_id 
    || (widget as any)?.data_config?.data_model_id 
    || (widget as any)?.data_config?.dataModelId 
    || '') as string
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loadingAttributes, setLoadingAttributes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['fields', 'data']))
  
  // Field configurations
  const dimensions = useMemo(() => {
    const dims = widget.properties?.dimensions || []
    return dims.map((d: string) => ({
      fieldName: d,
      type: 'dimension' as const,
      aggregation: 'NONE' as const,
    }))
  }, [widget.properties?.dimensions])

  const metrics = useMemo(() => {
    const measures = widget.properties?.measures || []
    return measures.map((m: string | FieldConfig) => {
      if (typeof m === 'string') {
        return { fieldName: m, type: 'metric' as const, aggregation: 'SUM' as const }
      }
      return m as FieldConfig
    })
  }, [widget.properties?.measures])

  const filters = useMemo(() => {
    return (widget.properties?.filters || []) as FilterConfig[]
  }, [widget.properties?.filters])

  const sorts = useMemo(() => {
    return (widget.properties?.sorts || []) as SortConfig[]
  }, [widget.properties?.sorts])

  const updateProperty = useCallback((key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }, [selectedWidgetId, setPlacedWidgets])

  // Load data models
  useEffect(() => {
    if (!spaceId) return
    
    const loadDataModels = async () => {
      try {
        const res = await fetch(`/api/spaces/${spaceId}/data-models`)
        if (res.ok) {
          const json = await res.json()
          setDataModels(json.dataModels || [])
        }
      } catch (error) {
        console.error('Error loading data models:', error)
      }
    }
    
    loadDataModels()
  }, [spaceId])

  // Load attributes when model is selected
  useEffect(() => {
    if (!selectedModelId) {
      setAttributes([])
      return
    }
    
    const loadAttributes = async () => {
      setLoadingAttributes(true)
      try {
        const res = await fetch(`/api/data-models/${selectedModelId}/attributes`)
        if (res.ok) {
          const json = await res.json()
          setAttributes(json.attributes || [])
        }
      } catch (error) {
        console.error('Error loading attributes:', error)
      } finally {
        setLoadingAttributes(false)
      }
    }
    
    loadAttributes()
  }, [selectedModelId])

  // Update widget when model changes (mirror snake_case and camelCase)
  useEffect(() => {
    if (selectedModelId && selectedModelId !== (widget.properties?.dataModelId || (widget.properties as any)?.data_model_id)) {
      setPlacedWidgets(prev => prev.map(w => 
        w.id === selectedWidgetId
          ? {
              ...w,
              properties: {
                ...w.properties,
                dataModelId: selectedModelId,
                // @ts-ignore legacy
                data_model_id: selectedModelId,
                dataSource: 'data-model',
                dimensions: [],
                measures: [],
              },
            }
          : w
      ))
    }
  }, [selectedModelId, selectedWidgetId, setPlacedWidgets, widget.properties])

  // Auto-select only model if exactly one
  useEffect(() => {
    if (!selectedModelId && dataModels.length === 1) {
      const only = dataModels[0]
      const modelId = (only as any).id || (only as any)._id || String(only)
      setSelectedModelId(modelId)
      setPlacedWidgets(prev => prev.map(w => 
        w.id === selectedWidgetId
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
  }, [dataModels, selectedModelId, selectedWidgetId, setPlacedWidgets])

  const filteredAttributes = useMemo(() => {
    if (!searchQuery.trim()) return attributes
    const query = searchQuery.toLowerCase()
    return attributes.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.display_name.toLowerCase().includes(query) ||
      attr.type.toLowerCase().includes(query)
    )
  }, [attributes, searchQuery])

  const isNumeric = (type: string) => {
    const lowerType = type.toLowerCase()
    return lowerType.includes('number') ||
           lowerType.includes('integer') ||
           lowerType.includes('decimal') ||
           lowerType.includes('float') ||
           lowerType.includes('money') ||
           lowerType.includes('currency')
  }

  const handleAddDimension = (attribute: Attribute) => {
    const currentDims = widget.properties?.dimensions || []
    if (!currentDims.includes(attribute.name)) {
      updateProperty('dimensions', [...currentDims, attribute.name])
      toast.success(`Added ${attribute.display_name || attribute.name} to dimensions`)
    }
  }

  const handleAddMetric = (attribute: Attribute) => {
    const currentMeasures = widget.properties?.measures || []
    const measureConfig = {
      fieldName: attribute.name,
      type: 'metric' as const,
      aggregation: 'SUM' as const,
    }
    const existing = currentMeasures.find((m: any) => 
      (typeof m === 'string' ? m : m.fieldName) === attribute.name
    )
    if (!existing) {
      updateProperty('measures', [...currentMeasures, measureConfig])
      toast.success(`Added ${attribute.display_name || attribute.name} to metrics`)
    }
  }

  const handleRemoveDimension = (fieldName: string) => {
    const currentDims = widget.properties?.dimensions || []
    updateProperty('dimensions', currentDims.filter((d: string) => d !== fieldName))
  }

  const handleRemoveMetric = (fieldName: string) => {
    const currentMeasures = widget.properties?.measures || []
    updateProperty('measures', currentMeasures.filter((m: any) =>
      (typeof m === 'string' ? m : m.fieldName) !== fieldName
    ))
  }

  const handleUpdateMetricAggregation = (fieldName: string, aggregation: FieldConfig['aggregation']) => {
    const currentMeasures = widget.properties?.measures || []
    updateProperty('measures', currentMeasures.map((m: any) => {
      const name = typeof m === 'string' ? m : m.fieldName
      if (name === fieldName) {
        return { fieldName: name, type: 'metric', aggregation: aggregation || 'SUM' }
      }
      return m
    }))
  }

  const handleAddFilter = () => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', [...currentFilters, {
      field: '',
      operator: 'EQUALS',
      value: '',
    }])
  }

  const handleUpdateFilter = (index: number, updates: Partial<FilterConfig>) => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', currentFilters.map((f: FilterConfig, i: number) =>
      i === index ? { ...f, ...updates } : f
    ))
  }

  const handleRemoveFilter = (index: number) => {
    const currentFilters = widget.properties?.filters || []
    updateProperty('filters', currentFilters.filter((_: any, i: number) => i !== index))
  }

  const handleAddSort = () => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', [...currentSorts, {
      field: '',
      direction: 'ASC',
    }])
  }

  const handleUpdateSort = (index: number, updates: Partial<SortConfig>) => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', currentSorts.map((s: SortConfig, i: number) =>
      i === index ? { ...s, ...updates } : s
    ))
  }

  const handleRemoveSort = (index: number) => {
    const currentSorts = widget.properties?.sorts || []
    updateProperty('sorts', currentSorts.filter((_: any, i: number) => i !== index))
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const selectedModel = dataModels.find(m => m.id === selectedModelId)

  return (
    <div className="flex flex-col h-full">
      <LookerDataSourceHeader
        dataModels={dataModels}
        selectedModel={selectedModel}
        selectedModelId={selectedModelId}
        attributes={attributes}
        onModelChange={setSelectedModelId}
      />

      {!selectedModelId ? (
        <LookerDataSourceEmptyState />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <LookerFieldPicker
            filteredAttributes={filteredAttributes}
            loadingAttributes={loadingAttributes}
            searchQuery={searchQuery}
            selectedModel={selectedModel}
            dimensions={dimensions}
            metrics={metrics}
            onSearchChange={setSearchQuery}
            onAddDimension={handleAddDimension}
            onAddMetric={handleAddMetric}
            isNumeric={isNumeric}
          />
          <LookerConfigurationPanel
            widget={widget}
            attributes={attributes}
            dimensions={dimensions}
            metrics={metrics}
            filters={filters}
            sorts={sorts}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            updateProperty={updateProperty}
            onAddDimension={handleAddDimension}
            onAddMetric={handleAddMetric}
            onRemoveDimension={handleRemoveDimension}
            onRemoveMetric={handleRemoveMetric}
            onUpdateMetricAggregation={handleUpdateMetricAggregation}
            onAddFilter={handleAddFilter}
            onUpdateFilter={handleUpdateFilter}
            onRemoveFilter={handleRemoveFilter}
            onAddSort={handleAddSort}
            onUpdateSort={handleUpdateSort}
            onRemoveSort={handleRemoveSort}
          />
        </div>
      )}
    </div>
  )
}

