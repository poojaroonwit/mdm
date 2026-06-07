'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Database, ChevronRight, ChevronDown, TrendingUp, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { DataModelDialog } from '@/app/admin/features/data/components/DataModelDialog'
import { SqlFieldDialog } from './SqlFieldDialog'
import type { Attribute, DataModel, Space } from './data-model-explorer-types'
import { getAttributeIcon, isNumeric } from './data-model-explorer-utils'

interface DataModelExplorerProps {
  spaceId: string
  selectedDataModelId?: string
  onDataModelSelect?: (modelId: string | null) => void
  className?: string
  onFieldCreated?: () => void
}

export function DataModelExplorer({
  spaceId,
  selectedDataModelId,
  onDataModelSelect,
  className,
  onFieldCreated
}: DataModelExplorerProps) {
  if (!spaceId) return null

  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())
  const [attributesMap, setAttributesMap] = useState<Record<string, Attribute[]>>({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSqlDialog, setShowSqlDialog] = useState(false)

  const [showCreateModelDialog, setShowCreateModelDialog] = useState(false)
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null)

  const loadDataModels = React.useCallback(async () => {
    if (!spaceId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/data-models`)
      if (!res.ok) throw new Error('Failed to load data models')
      const json = await res.json()
      setDataModels(json.dataModels || [])

      // Auto-expand selected model
      if (selectedDataModelId) {
        setExpandedModels(new Set([selectedDataModelId]))
        loadAttributes(selectedDataModelId)
      }
    } catch (error) {
      console.error('Error loading data models:', error)
    } finally {
      setLoading(false)
    }
  }, [spaceId, selectedDataModelId])

  // Load data models for the space
  useEffect(() => {
    loadDataModels()
  }, [loadDataModels])

  // Load current space details
  useEffect(() => {
    const loadSpace = async () => {
      if (!spaceId) return
      try {
        const res = await fetch(`/api/spaces/${spaceId}`)
        if (!res.ok) throw new Error('Failed to load space')
        const json = await res.json()
        setCurrentSpace(json.space)
      } catch (error) {
        console.error('Error loading space:', error)
      }
    }
    loadSpace()
  }, [spaceId])

  // Load attributes for a specific model
  const loadAttributes = async (modelId: string) => {
    if (attributesMap[modelId]) return // Already loaded

    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      if (!res.ok) throw new Error('Failed to load attributes')
      const json = await res.json()
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: json.attributes || []
      }))
    } catch (error) {
      console.error('Error loading attributes:', error)
      setAttributesMap(prev => ({
        ...prev,
        [modelId]: []
      }))
    }
  }

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else {
        next.add(modelId)
        loadAttributes(modelId)
      }
      return next
    })
  }

  const handleAttributeDragStart = (e: React.DragEvent, attribute: Attribute, model: DataModel) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      attribute,
      model,
      type: 'attribute'
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return dataModels

    const query = searchQuery.toLowerCase()
    return dataModels.filter(model =>
      model.name.toLowerCase().includes(query) ||
      model.display_name.toLowerCase().includes(query)
    )
  }, [dataModels, searchQuery])

  const filteredAttributes = (modelId: string): Attribute[] => {
    const attrs = attributesMap[modelId] || []
    if (!searchQuery.trim()) return attrs

    const query = searchQuery.toLowerCase()
    return attrs.filter(attr =>
      attr.name.toLowerCase().includes(query) ||
      attr.display_name.toLowerCase().includes(query)
    )
  }

  return (
    <div className={cn("flex h-full flex-col border-l bg-card text-card-foreground", className)}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Data Models</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowCreateModelDialog(true)}
            title="Add Data Model"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <input
          type="text"
          placeholder="Search models or attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Loading data models...</div>
        ) : filteredModels.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No models found' : 'No data models available'}
          </div>
        ) : (
          <div className="p-2">
            {filteredModels.map((model) => {
              const isExpanded = expandedModels.has(model.id)
              const isSelected = selectedDataModelId === model.id
              const attributes = filteredAttributes(model.id)
              const numericAttributes = attributes.filter(attr => isNumeric(attr.type))
              const dimensionAttributes = attributes.filter(attr => !isNumeric(attr.type))

              return (
                <div key={model.id} className="mb-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted transition-colors",
                      isSelected && "bg-primary/10 border border-primary/30"
                    )}
                    onClick={() => {
                      toggleModel(model.id)
                      onDataModelSelect?.(model.id)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium flex-1">{model.display_name || model.name}</span>
                    {attributes.length > 0 && (
                      <span className="text-xs text-muted-foreground">{attributes.length}</span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-3">
                      {/* Dimensions Section */}
                      {dimensionAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 px-1">
                            Dimensions
                          </div>
                          <div className="space-y-0.5">
                            {dimensionAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-grab active:cursor-grabbing group transition-colors bg-background border border-transparent hover:border-primary/30"
                                title={`Drag to dimensions: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Measures Section */}
                      {numericAttributes.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-muted-foreground mb-1 px-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Measures
                          </div>
                          <div className="space-y-0.5">
                            {numericAttributes.map((attr) => (
                              <div
                                key={attr.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.stopPropagation()
                                  handleAttributeDragStart(e, attr, model)
                                }}
                                onDragEnd={(e) => {
                                  e.stopPropagation()
                                }}
                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 cursor-grab active:cursor-grabbing group transition-colors bg-background border border-transparent hover:border-primary/30"
                                title={`Drag to measures: ${attr.display_name || attr.name} (${attr.type})`}
                              >
                                {getAttributeIcon(attr.type)}
                                <span className="text-xs flex-1 text-foreground">{attr.display_name || attr.name}</span>
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
                                  {attr.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {attributes.length === 0 && (
                        <div className="text-xs text-muted-foreground px-2 py-1">No attributes found</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create SQL Field Button */}
      <div className="p-3 border-t">
        <Button
          onClick={() => {
            if (!selectedDataModelId) {
              alert('Please select a data model first')
              return
            }
            setShowSqlDialog(true)
          }}
          className="w-full text-xs"
          size="sm"
          variant="outline"
        >
          <Plus className="h-3 w-3 mr-2" />
          Create SQL Field
        </Button>
      </div>

      <SqlFieldDialog
        attributesMap={attributesMap}
        open={showSqlDialog}
        selectedDataModelId={selectedDataModelId}
        onFieldCreated={onFieldCreated}
        onOpenChange={setShowSqlDialog}
        reloadAttributes={loadAttributes}
      />

      {/* Create Data Model Dialog */}
      {currentSpace && (
        <DataModelDialog
          open={showCreateModelDialog}
          onOpenChange={setShowCreateModelDialog}
          model={null}
          spaces={[currentSpace]}
          onSuccess={() => {
            loadDataModels()
            setShowCreateModelDialog(false)
          }}
        />
      )}
    </div>
  )
}

