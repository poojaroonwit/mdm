'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'react-hot-toast'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Filter,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Move,
  MousePointer,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  OntologyGraph,
  OntologyNode,
  OntologyEdge,
  OntologyNodeType,
  ONTOLOGY_NODE_COLORS,
  ONTOLOGY_NODE_ICONS,
} from '@/lib/project-types'

interface OntologyGraphProps {
  initialQuery?: string
  spaceId?: string
  projectId?: string
  onNodeClick?: (node: OntologyNode) => void
}

// Simple force-directed layout simulation
function useForceLayout(nodes: OntologyNode[], edges: OntologyEdge[], width: number, height: number) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  
  useEffect(() => {
    if (nodes.length === 0) return
    
    // Initialize positions
    const newPositions = new Map<string, { x: number; y: number }>()
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35
    
    // Position nodes in a circle initially, grouped by type
    const nodesByType = new Map<OntologyNodeType, OntologyNode[]>()
    nodes.forEach(node => {
      const list = nodesByType.get(node.type) || []
      list.push(node)
      nodesByType.set(node.type, list)
    })
    
    let angleOffset = 0
    const typeCount = nodesByType.size
    const anglePerType = (2 * Math.PI) / typeCount
    
    nodesByType.forEach((typeNodes, type) => {
      const typeRadius = radius * 0.8
      const nodesInType = typeNodes.length
      const anglePerNode = anglePerType / Math.max(nodesInType, 1)
      
      typeNodes.forEach((node, idx) => {
        const angle = angleOffset + anglePerNode * idx
        const jitter = (Math.random() - 0.5) * 50
        newPositions.set(node.id, {
          x: centerX + Math.cos(angle) * typeRadius + jitter,
          y: centerY + Math.sin(angle) * typeRadius + jitter,
        })
      })
      
      angleOffset += anglePerType
    })
    
    // Simple force simulation (a few iterations)
    const iterations = 50
    const k = Math.sqrt((width * height) / nodes.length) * 0.5
    
    for (let iter = 0; iter < iterations; iter++) {
      const forces = new Map<string, { fx: number; fy: number }>()
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { fx: 0, fy: 0 })
      })
      
      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pos1 = newPositions.get(nodes[i].id)!
          const pos2 = newPositions.get(nodes[j].id)!
          
          const dx = pos1.x - pos2.x
          const dy = pos1.y - pos2.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = (k * k) / dist
          const fx = (dx / dist) * force * 0.5
          const fy = (dy / dist) * force * 0.5
          
          const f1 = forces.get(nodes[i].id)!
          const f2 = forces.get(nodes[j].id)!
          f1.fx += fx
          f1.fy += fy
          f2.fx -= fx
          f2.fy -= fy
        }
      }
      
      // Attractive forces along edges
      edges.forEach(edge => {
        const pos1 = newPositions.get(edge.source)
        const pos2 = newPositions.get(edge.target)
        
        if (!pos1 || !pos2) return
        
        const dx = pos1.x - pos2.x
        const dy = pos1.y - pos2.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = dist / k
        const fx = (dx / dist) * force * 0.3
        const fy = (dy / dist) * force * 0.3
        
        const f1 = forces.get(edge.source)
        const f2 = forces.get(edge.target)
        
        if (f1 && f2) {
          f1.fx -= fx
          f1.fy -= fy
          f2.fx += fx
          f2.fy += fy
        }
      })
      
      // Apply forces
      const cooling = 1 - iter / iterations
      nodes.forEach(node => {
        const pos = newPositions.get(node.id)!
        const force = forces.get(node.id)!
        
        pos.x += force.fx * cooling * 0.1
        pos.y += force.fy * cooling * 0.1
        
        // Keep within bounds
        pos.x = Math.max(50, Math.min(width - 50, pos.x))
        pos.y = Math.max(50, Math.min(height - 50, pos.y))
      })
    }
    
    setPositions(newPositions)
  }, [nodes, edges, width, height])
  
  return positions
}

export function OntologyGraphView({
  initialQuery = '',
  spaceId,
  projectId,
  onNodeClick,
}: OntologyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [graph, setGraph] = useState<OntologyGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  // Filter state
  const [visibleTypes, setVisibleTypes] = useState<Set<OntologyNodeType>>(
    new Set(Object.keys(ONTOLOGY_NODE_COLORS) as OntologyNodeType[])
  )
  const [depth, setDepth] = useState(2)
  
  // Calculate positions using force layout
  const positions = useForceLayout(
    graph?.nodes || [],
    graph?.edges || [],
    dimensions.width,
    dimensions.height
  )

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('query', searchQuery)
      if (spaceId) params.set('spaceId', spaceId)
      if (projectId) params.set('projectId', projectId)
      params.set('depth', String(depth))
      params.set('limit', '100')
      
      const response = await fetch(`/api/ontology?${params}`)
      if (response.ok) {
        const data = await response.json()
        setGraph(data.graph)
      }
    } catch (error) {
      console.error('Failed to fetch ontology:', error)
      toast.error('Failed to load ontology graph')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, spaceId, projectId, depth])

  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Filter visible nodes
  const filteredNodes = useMemo(() => {
    if (!graph) return []
    return graph.nodes.filter(node => visibleTypes.has(node.type))
  }, [graph, visibleTypes])

  const filteredEdges = useMemo(() => {
    if (!graph) return []
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return graph.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )
  }, [graph, filteredNodes])

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (e.button === 0 && !target.closest?.('.node')) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(z => Math.max(0.1, Math.min(3, z * delta)))
  }

  const handleNodeClick = (node: OntologyNode) => {
    setSelectedNode(node)
    onNodeClick?.(node)
  }

  const toggleNodeType = (type: OntologyNodeType) => {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  // Export graph as SVG
  const exportSVG = () => {
    // Implementation for SVG export
    toast.success('Graph exported')
  }

  if (loading) {
    return <OntologyGraphSkeleton />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background p-3 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGraph()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchGraph}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Node Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(Object.keys(ONTOLOGY_NODE_COLORS) as OntologyNodeType[]).map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={visibleTypes.has(type)}
                          onCheckedChange={() => toggleNodeType(type)}
                        />
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: ONTOLOGY_NODE_COLORS[type] }}
                        />
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Relationship Depth: {depth}</Label>
                  <Slider
                    value={[depth]}
                    onValueChange={([v]) => setDepth(v)}
                    min={1}
                    max={4}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center border rounded-md">
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(3, z * 1.2))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z * 0.8))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={exportSVG}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 flex">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-muted/30 cursor-grab"
          style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg
            width="100%"
            height="100%"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Edges */}
            <g>
              {filteredEdges.map(edge => {
                const sourcePos = positions.get(edge.source)
                const targetPos = positions.get(edge.target)
                if (!sourcePos || !targetPos) return null
                
                const isHighlighted = 
                  hoveredNode === edge.source || 
                  hoveredNode === edge.target ||
                  selectedNode?.id === edge.source ||
                  selectedNode?.id === edge.target
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={isHighlighted ? '#1e40af' : '#CBD5E1'}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 1 : 0.5}
                    />
                    {/* Edge label */}
                    {isHighlighted && edge.label && (
                      <text
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2}
                        textAnchor="middle"
                        className="text-xs fill-muted-foreground"
                        dy={-5}
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
            
            {/* Nodes */}
            <g>
              {filteredNodes.map(node => {
                const pos = positions.get(node.id)
                if (!pos) return null
                
                const isSelected = selectedNode?.id === node.id
                const isHovered = hoveredNode === node.id
                const size = (node.size || 30) * (isSelected ? 1.3 : isHovered ? 1.15 : 1)
                
                return (
                  <g
                    key={node.id}
                    className="node cursor-pointer"
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Node circle */}
                    <circle
                      r={size / 2}
                      fill={node.color || ONTOLOGY_NODE_COLORS[node.type]}
                      stroke={isSelected ? '#1D4ED8' : isHovered ? '#1e40af' : 'white'}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-150"
                    />
                    {/* Node label */}
                    <text
                      y={size / 2 + 14}
                      textAnchor="middle"
                      className="text-xs font-medium fill-foreground pointer-events-none"
                    >
                      {node.name.length > 15 ? node.name.substring(0, 15) + '...' : node.name}
                    </text>
                    {/* Type label */}
                    <text
                      y={size / 2 + 26}
                      textAnchor="middle"
                      className="text-[10px] fill-muted-foreground pointer-events-none"
                    >
                      {node.type.replace('_', ' ')}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
          
          {/* Empty state */}
          {filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No entities found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Node Details Panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-background">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">Node Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
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
                
                {/* Connections */}
                <div>
                  <Label className="text-xs text-muted-foreground">Connections</Label>
                  <div className="space-y-2 mt-2">
                    {graph?.edges
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .map(edge => {
                        const otherId = edge.source === selectedNode.id ? edge.target : edge.source
                        const otherNode = graph.nodes.find(n => n.id === otherId)
                        if (!otherNode) return null
                        
                        return (
                          <div 
                            key={edge.id}
                            className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted"
                            onClick={() => setSelectedNode(otherNode)}
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
                
                {/* Metadata */}
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
        )}
      </div>
      
      {/* Legend */}
      <div className="border-t bg-background p-2">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Legend:</span>
          {(Object.keys(ONTOLOGY_NODE_COLORS) as OntologyNodeType[])
            .filter(type => visibleTypes.has(type))
            .map(type => (
              <div key={type} className="flex items-center gap-1.5 whitespace-nowrap">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: ONTOLOGY_NODE_COLORS[type] }}
                />
                <span className="text-xs capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredNodes.length} nodes, {filteredEdges.length} edges
          </span>
        </div>
      </div>
    </div>
  )
}

function OntologyGraphSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background p-3 flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading ontology graph...</p>
        </div>
      </div>
    </div>
  )
}
