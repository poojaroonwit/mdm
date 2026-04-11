'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  MarkerType,
  NodeTypes,
  EdgeTypes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  GitBranch, 
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface TicketNode {
  id: string
  title: string
  status: string
  priority: string
  projectId?: string
  milestoneId?: string
  releaseId?: string
}

interface ProjectNode {
  id: string
  name: string
  status: string
}

interface MilestoneNode {
  id: string
  name: string
  status: string
}

interface ReleaseNode {
  id: string
  name: string
  version?: string
  status: string
}

interface Relationship {
  dependencies: Array<{
    id: string
    type: string
    relatedTicket: TicketNode
    createdAt: string
  }>
  dependents: Array<{
    id: string
    type: string
    relatedTicket: TicketNode
    createdAt: string
  }>
  parent: TicketNode | null
  children: TicketNode[]
  project: ProjectNode | null
  milestone: MilestoneNode | null
  release: ReleaseNode | null
}

interface TicketRelationshipGraphProps {
  ticketId: string
  onNodeClick?: (nodeId: string, nodeType: 'ticket' | 'project' | 'milestone' | 'release') => void
  onNodeDoubleClick?: (nodeId: string, nodeType: 'ticket' | 'project' | 'milestone' | 'release') => void
}

// Custom node components
const TicketNodeComponent = ({ data }: { data: any }) => {
  const statusColors: Record<string, string> = {
    'BACKLOG': 'border-gray-400',
    'TODO': 'border-blue-400',
    'IN_PROGRESS': 'border-yellow-400',
    'IN_REVIEW': 'border-purple-400',
    'DONE': 'border-green-400',
    'CANCELLED': 'border-red-400'
  }

  const priorityColors: Record<string, string> = {
    'LOW': 'bg-blue-100 text-blue-800',
    'MEDIUM': 'bg-yellow-100 text-yellow-800',
    'HIGH': 'bg-orange-100 text-orange-800',
    'URGENT': 'bg-red-100 text-red-800'
  }

  return (
    <div className={`px-4 py-2 bg-white rounded-lg border-2 ${statusColors[data.status] || 'border-gray-300'} shadow-md min-w-[200px]`}>
      <div className="font-semibold text-sm mb-1">{data.title}</div>
      <div className="flex gap-2 items-center">
        <Badge variant="outline" className="text-xs">{data.status}</Badge>
        <Badge className={`text-xs ${priorityColors[data.priority] || ''}`}>
          {data.priority}
        </Badge>
      </div>
    </div>
  )
}

const ProjectNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 bg-blue-50 rounded-lg border-2 border-blue-400 shadow-md">
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-blue-600" />
        <div className="font-semibold text-sm">{data.name}</div>
      </div>
      <Badge variant="outline" className="text-xs mt-1">{data.status}</Badge>
    </div>
  )
}

const MilestoneNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 bg-purple-50 rounded-lg border-2 border-purple-400 shadow-md transform rotate-45 w-24 h-24 flex items-center justify-center">
      <div className="transform -rotate-45 text-center">
        <div className="font-semibold text-xs">{data.name}</div>
        <Badge variant="outline" className="text-xs mt-1">{data.status}</Badge>
      </div>
    </div>
  )
}

const ReleaseNodeComponent = ({ data }: { data: any }) => {
  return (
    <div className="px-3 py-2 bg-green-50 rounded-full border-2 border-green-400 shadow-md">
      <div className="font-semibold text-xs">{data.name}</div>
      {data.version && (
        <div className="text-xs text-gray-600">v{data.version}</div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  ticket: TicketNodeComponent,
  project: ProjectNodeComponent,
  milestone: MilestoneNodeComponent,
  release: ReleaseNodeComponent
}

export function TicketRelationshipGraph({ 
  ticketId, 
  onNodeClick,
  onNodeDoubleClick 
}: TicketRelationshipGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [filterType, setFilterType] = useState<string>('all')

  // Fetch relationships
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/relationships`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            buildGraph(data.relationships)
          }
        }
      } catch (error) {
        console.error('Failed to fetch relationships:', error)
      }
    }

    fetchRelationships()
  }, [ticketId])

  const buildGraph = (relationships: Relationship) => {
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    let x = 0
    let y = 0
    const nodeSpacing = 250

    // Add main ticket node (center)
    const centerX = 400
    const centerY = 300
    newNodes.push({
      id: ticketId,
      type: 'ticket',
      position: { x: centerX, y: centerY },
      data: {
        id: ticketId,
        title: 'Current Ticket',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM'
      }
    })

    // Add project node
    if (relationships.project) {
      x = centerX
      y = centerY - nodeSpacing
      newNodes.push({
        id: `project-${relationships.project.id}`,
        type: 'project',
        position: { x, y },
        data: relationships.project as unknown as Record<string, unknown>
      })
      newEdges.push({
        id: `edge-project-${ticketId}`,
        source: `project-${relationships.project.id}`,
        target: ticketId,
        type: 'smoothstep',
        style: { stroke: '#1e40af', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#1e40af' }
      })
    }

    // Add milestone node
    if (relationships.milestone) {
      x = centerX - nodeSpacing
      y = centerY
      newNodes.push({
        id: `milestone-${relationships.milestone.id}`,
        type: 'milestone',
        position: { x, y },
        data: relationships.milestone as unknown as Record<string, unknown>
      })
      newEdges.push({
        id: `edge-milestone-${ticketId}`,
        source: `milestone-${relationships.milestone.id}`,
        target: ticketId,
        type: 'smoothstep',
        style: { stroke: '#a855f7', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' }
      })
    }

    // Add release node
    if (relationships.release) {
      x = centerX + nodeSpacing
      y = centerY
      newNodes.push({
        id: `release-${relationships.release.id}`,
        type: 'release',
        position: { x, y },
        data: relationships.release as unknown as Record<string, unknown>
      })
      newEdges.push({
        id: `edge-release-${ticketId}`,
        source: `release-${relationships.release.id}`,
        target: ticketId,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
      })
    }

    // Add parent node
    if (relationships.parent) {
      x = centerX
      y = centerY + nodeSpacing
      newNodes.push({
        id: relationships.parent.id,
        type: 'ticket',
        position: { x, y },
        data: relationships.parent as unknown as Record<string, unknown>
      })
      newEdges.push({
        id: `edge-parent-${ticketId}`,
        source: relationships.parent.id,
        target: ticketId,
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' }
      })
    }

    // Add child nodes (subtasks)
    relationships.children.forEach((child, index) => {
      const angle = (index * 2 * Math.PI) / relationships.children.length
      x = centerX + Math.cos(angle) * nodeSpacing
      y = centerY + Math.sin(angle) * nodeSpacing + nodeSpacing
      newNodes.push({
        id: child.id,
        type: 'ticket',
        position: { x, y },
        data: child as unknown as Record<string, unknown>
      })
      newEdges.push({
        id: `edge-child-${child.id}`,
        source: ticketId,
        target: child.id,
        type: 'smoothstep',
        style: { stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '5,5' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' }
      })
    })

    // Add dependency nodes
    relationships.dependencies.forEach((dep, index) => {
      const angle = (index * 2 * Math.PI) / relationships.dependencies.length
      x = centerX + Math.cos(angle) * nodeSpacing * 1.5
      y = centerY + Math.sin(angle) * nodeSpacing * 1.5
      newNodes.push({
        id: dep.relatedTicket.id,
        type: 'ticket',
        position: { x, y },
        data: dep.relatedTicket as unknown as Record<string, unknown>
      })
      const edgeColor = dep.type === 'BLOCKS' ? '#ef4444' : '#6b7280'
      newEdges.push({
        id: `edge-dep-${dep.id}`,
        source: dep.relatedTicket.id,
        target: ticketId,
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
      })
    })

    // Add dependent nodes
    relationships.dependents.forEach((dep, index) => {
      const angle = (index * 2 * Math.PI) / relationships.dependents.length
      x = centerX + Math.cos(angle) * nodeSpacing * 1.5
      y = centerY + Math.sin(angle) * nodeSpacing * 1.5
      newNodes.push({
        id: dep.relatedTicket.id,
        type: 'ticket',
        position: { x, y },
        data: dep.relatedTicket as unknown as Record<string, unknown>
      })
      const edgeColor = dep.type === 'BLOCKS' ? '#ef4444' : '#6b7280'
      newEdges.push({
        id: `edge-dependent-${dep.id}`,
        source: ticketId,
        target: dep.relatedTicket.id,
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor }
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const filteredEdges = useMemo(() => {
    if (filterType === 'all') return edges
    return edges.filter((edge: Edge) => {
      // Filter logic based on edge type/color
      if (filterType === 'blocking') {
        return (edge.style as any)?.stroke === '#ef4444'
      }
      if (filterType === 'project') {
        return (edge.style as any)?.stroke === '#1e40af'
      }
      if (filterType === 'milestone') {
        return (edge.style as any)?.stroke === '#a855f7'
      }
      if (filterType === 'release') {
        return (edge.style as any)?.stroke === '#10b981'
      }
      return true
    })
  }, [edges, filterType])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      const nodeType = node.type as 'ticket' | 'project' | 'milestone' | 'release'
      onNodeClick(node.id, nodeType)
    }
  }, [onNodeClick])

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeDoubleClick) {
      const nodeType = node.type as 'ticket' | 'project' | 'milestone' | 'release'
      onNodeDoubleClick(node.id, nodeType)
    }
  }, [onNodeDoubleClick])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Relationship Graph</CardTitle>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Relationships</SelectItem>
                <SelectItem value="blocking">Blocking</SelectItem>
                <SelectItem value="project">Project Links</SelectItem>
                <SelectItem value="milestone">Milestone Links</SelectItem>
                <SelectItem value="release">Release Links</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '600px' }}>
          <ReactFlow
            nodes={nodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  )
}

