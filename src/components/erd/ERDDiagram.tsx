'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Database,
  Type,
  Key,
  Link,
  Plus,
  Trash2,
} from 'lucide-react'
import { AttributeForm, RelationshipForm } from './ERDForms'
import type { Attribute, DataModel, DraggedItem, ERDDiagramProps, Relationship } from './erdTypes'

export default function ERDDiagram({
  models,
  relationships: initialRelationships = [],
  onUpdateModel,
  onUpdateAttribute,
  onDeleteAttribute,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship
}: ERDDiagramProps) {
  const [relationships, setRelationships] = useState<Relationship[]>(initialRelationships)
  const [selectedModel, setSelectedModel] = useState<DataModel | null>(null)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null)
  const [showAttributeDialog, setShowAttributeDialog] = useState(false)
  const [showRelationshipDialog, setShowRelationshipDialog] = useState(false)
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null)
  const [isCreatingRelationship, setIsCreatingRelationship] = useState(false)
  const [relationshipStart, setRelationshipStart] = useState<{ modelId: string; attributeId: string } | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const canvasRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Sync relationships when prop changes
  useEffect(() => {
    if (initialRelationships && initialRelationships.length > 0) {
      setRelationships(initialRelationships)
    }
  }, [initialRelationships])

  // Initialize default positions for models
  useEffect(() => {
    models.forEach((model, index) => {
      if (!model.position) {
        const x = 100 + (index % 3) * 300
        const y = 100 + Math.floor(index / 3) * 250
        onUpdateModel({ ...model, position: { x, y } })
      }
    })
  }, [models, onUpdateModel])

  const handleModelDrag = useCallback((modelId: string, event: React.MouseEvent) => {
    const startX = event.clientX
    const startY = event.clientY
    const model = models.find(m => m.id === modelId)
    if (!model?.position) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom
      const deltaY = (e.clientY - startY) / zoom
      const newPosition = {
        x: model.position!.x + deltaX,
        y: model.position!.y + deltaY
      }
      onUpdateModel({ ...model, position: newPosition })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [models, onUpdateModel, zoom])

  const handleAttributeClick = (modelId: string, attribute: Attribute) => {
    setSelectedModel(models.find(m => m.id === modelId) || null)
    setSelectedAttribute(attribute)
    setShowAttributeDialog(true)
  }

  const handleRelationshipStart = (modelId: string, attributeId: string) => {
    setIsCreatingRelationship(true)
    setRelationshipStart({ modelId, attributeId })
  }

  const handleRelationshipEnd = (modelId: string, attributeId: string) => {
    if (isCreatingRelationship && relationshipStart) {
      if (relationshipStart.modelId !== modelId || relationshipStart.attributeId !== attributeId) {
        const newRelationship: Omit<Relationship, 'id'> = {
          fromModel: relationshipStart.modelId,
          toModel: modelId,
          fromAttribute: relationshipStart.attributeId,
          toAttribute: attributeId,
          type: 'one-to-many'
        }
        onCreateRelationship(newRelationship)
      }
    }
    setIsCreatingRelationship(false)
    setRelationshipStart(null)
  }

  const getAttributeIcon = (attribute: Attribute) => {
    if (attribute.is_primary_key) return <Key className="h-3 w-3 text-yellow-500" />
    if (attribute.is_foreign_key) return <Link className="h-3 w-3 text-blue-500" />
    return <Type className="h-3 w-3 text-muted-foreground" />
  }

  const getAttributeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'TEXT': 'bg-blue-100 text-blue-800',
      'NUMBER': 'bg-green-100 text-green-800',
      'BOOLEAN': 'bg-purple-100 text-purple-800',
      'DATE': 'bg-orange-100 text-orange-800',
      'EMAIL': 'bg-pink-100 text-pink-800',
      'SELECT': 'bg-indigo-100 text-indigo-800',
      'JSON': 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const renderRelationshipLine = (relationship: Relationship) => {
    const fromModel = models.find(m => m.id === relationship.fromModel)
    const toModel = models.find(m => m.id === relationship.toModel)

    if (!fromModel?.position || !toModel?.position) return null

    const fromX = fromModel.position.x + 200 // Model width
    const fromY = fromModel.position.y + 50 + (fromModel.attributes.findIndex(a => a.id === relationship.fromAttribute) * 30)
    const toX = toModel.position.x
    const toY = toModel.position.y + 50 + (toModel.attributes.findIndex(a => a.id === relationship.toAttribute) * 30)

    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2

    return (
      <g key={relationship.id}>
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="#6b7280"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="cursor-pointer hover:stroke-blue-500"
          onClick={() => {
            setSelectedRelationship(relationship)
            setShowRelationshipDialog(true)
          }}
        />
        <text
          x={midX}
          y={midY - 5}
          textAnchor="middle"
          className="text-xs fill-gray-600 pointer-events-none"
        >
          {relationship.label || relationship.type}
        </text>
      </g>
    )
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-muted/30">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
        >
          -
        </Button>
        <span className="px-2 py-1 text-sm bg-background rounded border border-border text-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
        >
          +
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative"
        style={{
          transform: `scale(${zoom}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* SVG for relationships */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
          </defs>
          {relationships.map(renderRelationshipLine)}
        </svg>

        {/* Models */}
        {models.map((model) => (
          <Card
            key={model.id}
            className="absolute w-64 shadow-lg border-2 hover:border-blue-300 transition-colors"
            style={{
              left: model.position?.x || 0,
              top: model.position?.y || 0,
              zIndex: 2
            }}
          >
            <CardHeader
              className="pb-2 cursor-move bg-muted/40"
              onMouseDown={(e) => handleModelDrag(model.id, e)}
            >
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                {model.display_name}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {model.attributes.length} attrs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {model.attributes.map((attribute) => (
                  <div
                    key={attribute.id}
                    className="flex items-center gap-2 p-1 rounded hover:bg-accent cursor-pointer group"
                    onClick={() => handleAttributeClick(model.id, attribute)}
                    onMouseDown={(e) => {
                      if (isCreatingRelationship) {
                        e.stopPropagation()
                        handleRelationshipEnd(model.id, attribute.id)
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!isCreatingRelationship) {
                        e.stopPropagation()
                        handleRelationshipStart(model.id, attribute.id)
                      }
                    }}
                  >
                    {getAttributeIcon(attribute)}
                    <span className="text-xs font-medium flex-1 truncate">
                      {attribute.display_name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getAttributeTypeColor(attribute.type)}`}
                    >
                      {attribute.type}
                    </Badge>
                    {attribute.is_required && (
                      <span className="text-red-500 text-xs">*</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteAttribute(model.id, attribute.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-6 text-xs"
                  onClick={() => {
                    setSelectedModel(model)
                    setSelectedAttribute(null)
                    setShowAttributeDialog(true)
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Attribute
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attribute Configuration Dialog */}
      <Dialog open={showAttributeDialog} onOpenChange={setShowAttributeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAttribute ? 'Edit Attribute' : 'Add Attribute'}
            </DialogTitle>
            <DialogDescription>
              {selectedAttribute ? 'Modify the attribute properties and settings.' : 'Add a new attribute to the data model with its properties and constraints.'}
            </DialogDescription>
          </DialogHeader>
          <AttributeForm
            model={selectedModel}
            attribute={selectedAttribute}
            onSave={(attribute) => {
              if (selectedAttribute) {
                onUpdateAttribute(selectedModel!.id, attribute)
              } else {
                // Create new attribute logic would go here
              }
              setShowAttributeDialog(false)
            }}
            onCancel={() => setShowAttributeDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Relationship Configuration Dialog */}
      <Dialog open={showRelationshipDialog} onOpenChange={setShowRelationshipDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Relationship</DialogTitle>
            <DialogDescription>
              Define the relationship between data models including cardinality and constraints.
            </DialogDescription>
          </DialogHeader>
          <RelationshipForm
            relationship={selectedRelationship}
            models={models}
            onSave={(relationship) => {
              if (selectedRelationship) {
                onUpdateRelationship(relationship)
              }
              setShowRelationshipDialog(false)
            }}
            onCancel={() => setShowRelationshipDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

