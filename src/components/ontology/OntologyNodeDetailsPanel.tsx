'use client'

import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { OntologyGraph, OntologyNode } from '@/lib/project-types'
import { ONTOLOGY_NODE_COLORS } from '@/lib/project-types'

interface OntologyNodeDetailsPanelProps {
  graph: OntologyGraph | null
  selectedNode: OntologyNode
  onSelectNode: (node: OntologyNode) => void
  onClose: () => void
}

export function OntologyNodeDetailsPanel({
  graph,
  selectedNode,
  onSelectNode,
  onClose
}: OntologyNodeDetailsPanelProps) {
  return (
    <div className="w-80 border-l bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Node Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: ONTOLOGY_NODE_COLORS[selectedNode.type] + '20' }}
            >
              <div
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: ONTOLOGY_NODE_COLORS[selectedNode.type] }}
              />
            </div>
            <div>
              <p className="font-medium">{selectedNode.name}</p>
              <Badge variant="outline" className="capitalize">
                {selectedNode.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {selectedNode.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{selectedNode.description}</p>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Connections</Label>
            <div className="space-y-2 mt-2">
              {graph?.edges
                .filter(edge => edge.source === selectedNode.id || edge.target === selectedNode.id)
                .map(edge => {
                  const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                  const otherNode = graph.nodes.find(node => node.id === otherId)
                  if (!otherNode) return null

                  return (
                    <div
                      key={edge.id}
                      className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted"
                      onClick={() => onSelectNode(otherNode)}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: ONTOLOGY_NODE_COLORS[otherNode.type] }}
                      />
                      <span className="text-sm flex-1 truncate">{otherNode.name}</span>
                      <span className="text-xs text-muted-foreground">{edge.label || edge.type}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Properties</Label>
              <div className="space-y-1 mt-2">
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace('_', ' ')}</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
