import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { 
  OntologyNode, 
  OntologyEdge, 
  OntologyGraph,
  OntologyNodeType,
  ONTOLOGY_NODE_COLORS 
} from '@/lib/project-types'

/**
 * Generate ontology graph from database entities
 */
async function generateOntologyGraph(options: {
  query?: string
  nodeTypes?: OntologyNodeType[]
  spaceId?: string
  projectId?: string
  depth?: number
  limit?: number
}): Promise<OntologyGraph> {
  const nodes: OntologyNode[] = []
  const edges: OntologyEdge[] = []
  const nodeMap = new Map<string, boolean>()
  
  const { query, nodeTypes, spaceId, projectId, depth = 2, limit = 100 } = options
  const searchQuery = query?.toLowerCase() || ''
  
  // Helper to add node if not exists
  const addNode = (node: OntologyNode) => {
    if (!nodeMap.has(node.id) && nodes.length < limit) {
      nodeMap.set(node.id, true)
      nodes.push({
        ...node,
        color: ONTOLOGY_NODE_COLORS[node.type] || '#6B7280',
      })
    }
  }
  
  // Helper to add edge
  const addEdge = (edge: Omit<OntologyEdge, 'id'>) => {
    const id = `${edge.source}-${edge.type}-${edge.target}`
    if (!edges.find(e => e.id === id)) {
      edges.push({ ...edge, id })
    }
  }
  
  // Fetch data models
  if (!nodeTypes || nodeTypes.includes('data_model') || nodeTypes.includes('data_table') || nodeTypes.includes('field')) {
    const dataModels = await db.dataModel.findMany({
      where: {
        deletedAt: null,
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        })
      },
      take: 50,
      include: {
        attributes: {
          where: { isActive: true },
          take: 20,
          select: {
            id: true,
            name: true,
            displayName: true,
            type: true,
            description: true,
          }
        },
        spaces: {
          select: {
            spaceId: true,
            space: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })
    
    for (const model of dataModels) {
      addNode({
        id: `datamodel-${model.id}`,
        type: 'data_model',
        name: model.name,
        description: model.description || undefined,
        metadata: { attributeCount: model.attributes.length }
      })
      
      // Add space relationships
      for (const spaceRel of model.spaces) {
        addNode({
          id: `space-${spaceRel.spaceId}`,
          type: 'space',
          name: spaceRel.space.name,
        })
        addEdge({
          source: `datamodel-${model.id}`,
          target: `space-${spaceRel.spaceId}`,
          type: 'belongs_to',
          label: 'belongs to'
        })
      }
      
      // Add fields
      if (depth >= 2 && (!nodeTypes || nodeTypes.includes('field'))) {
        for (const attr of model.attributes) {
          addNode({
            id: `field-${attr.id}`,
            type: 'field',
            name: attr.displayName || attr.name,
            description: attr.description || undefined,
            metadata: { dataType: attr.type }
          })
          addEdge({
            source: `datamodel-${model.id}`,
            target: `field-${attr.id}`,
            type: 'contains',
            label: 'has field'
          })
        }
      }
    }
  }
  
  // Fetch projects
  if (!nodeTypes || nodeTypes.includes('project')) {
    const projects = await db.project.findMany({
      where: {
        deletedAt: null,
        ...(spaceId && { spaceId }),
        ...(projectId && { id: projectId }),
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        })
      },
      take: 30,
      include: {
        space: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true }
        },
        tickets: {
          where: { deletedAt: null },
          take: 10,
          select: { id: true, title: true, status: true }
        },
        milestones: {
          where: { deletedAt: null },
          take: 5,
          select: { id: true, name: true, status: true }
        }
      }
    })
    
    for (const project of projects) {
      addNode({
        id: `project-${project.id}`,
        type: 'project',
        name: project.name,
        description: project.description || undefined,
        metadata: { status: project.status }
      })
      
      // Space relationship
      addNode({
        id: `space-${project.spaceId}`,
        type: 'space',
        name: project.space.name,
      })
      addEdge({
        source: `project-${project.id}`,
        target: `space-${project.spaceId}`,
        type: 'belongs_to',
        label: 'in space'
      })
      
      // Creator relationship
      if (depth >= 2) {
        addNode({
          id: `user-${project.createdBy}`,
          type: 'user',
          name: project.creator.name,
        })
        addEdge({
          source: `project-${project.id}`,
          target: `user-${project.createdBy}`,
          type: 'created_by',
          label: 'created by'
        })
      }
      
      // Tickets
      if (depth >= 2 && (!nodeTypes || nodeTypes.includes('ticket'))) {
        for (const ticket of project.tickets) {
          addNode({
            id: `ticket-${ticket.id}`,
            type: 'ticket',
            name: ticket.title,
            metadata: { status: ticket.status }
          })
          addEdge({
            source: `project-${project.id}`,
            target: `ticket-${ticket.id}`,
            type: 'contains',
            label: 'has ticket'
          })
        }
      }
      
      // Milestones
      if (depth >= 2 && (!nodeTypes || nodeTypes.includes('milestone'))) {
        for (const milestone of project.milestones) {
          addNode({
            id: `milestone-${milestone.id}`,
            type: 'milestone',
            name: milestone.name,
            metadata: { status: milestone.status }
          })
          addEdge({
            source: `project-${project.id}`,
            target: `milestone-${milestone.id}`,
            type: 'contains',
            label: 'has milestone'
          })
        }
      }
      
      // Parse metadata for associated resources
      const metadata = (project.metadata as any) || {}
      
      // Data models from metadata
      if (metadata.dataModels && depth >= 2) {
        for (const dm of metadata.dataModels) {
          addNode({
            id: `datamodel-${dm.dataModelId}`,
            type: 'data_model',
            name: dm.dataModel?.name || dm.name || 'Unknown',
          })
          addEdge({
            source: `project-${project.id}`,
            target: `datamodel-${dm.dataModelId}`,
            type: 'uses',
            label: 'uses'
          })
        }
      }
      
      // Notebooks from metadata
      if (metadata.notebooks && depth >= 2) {
        for (const nb of metadata.notebooks) {
          addNode({
            id: `notebook-${nb.notebookId}`,
            type: 'notebook',
            name: nb.notebook?.name || nb.name || 'Unknown',
          })
          addEdge({
            source: `project-${project.id}`,
            target: `notebook-${nb.notebookId}`,
            type: 'uses',
            label: 'uses'
          })
        }
      }
      
      // AI Agents from metadata
      if (metadata.chatbots && depth >= 2) {
        for (const cb of metadata.chatbots) {
          addNode({
            id: `aiagent-${cb.chatbotId}`,
            type: 'ai_agent',
            name: cb.chatbot?.name || cb.name || 'Unknown',
          })
          addEdge({
            source: `project-${project.id}`,
            target: `aiagent-${cb.chatbotId}`,
            type: 'uses',
            label: 'uses'
          })
        }
      }
      
      // Assets from metadata
      if (metadata.assets && depth >= 2) {
        for (const asset of metadata.assets) {
          const nodeType = asset.assetType === 'vm' ? 'vm' :
                          asset.assetType === 'container' ? 'container' :
                          asset.assetType === 'storage' ? 'storage' : 'service'
          addNode({
            id: `asset-${asset.id}`,
            type: nodeType,
            name: asset.assetName || 'Unknown',
            description: asset.assetDescription,
          })
          addEdge({
            source: `project-${project.id}`,
            target: `asset-${asset.id}`,
            type: 'uses',
            label: 'uses'
          })
        }
      }
    }
  }
  
  // Fetch notebooks
  if (!nodeTypes || nodeTypes.includes('notebook')) {
    const notebooks = await db.notebook.findMany({
      where: {
        deletedAt: null,
        ...(spaceId && { spaceId }),
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        })
      },
      take: 30,
      select: {
        id: true,
        name: true,
        description: true,
        author: true,
        spaceId: true,
        space: {
          select: { id: true, name: true }
        }
      }
    })
    
    for (const notebook of notebooks) {
      addNode({
        id: `notebook-${notebook.id}`,
        type: 'notebook',
        name: notebook.name,
        description: notebook.description || undefined,
        metadata: { author: notebook.author }
      })
      
      if (notebook.space) {
        addNode({
          id: `space-${notebook.spaceId}`,
          type: 'space',
          name: notebook.space.name,
        })
        addEdge({
          source: `notebook-${notebook.id}`,
          target: `space-${notebook.spaceId}`,
          type: 'belongs_to',
          label: 'in space'
        })
      }
    }
  }
  
  // Fetch AI Agents/Chatbots
  if (!nodeTypes || nodeTypes.includes('ai_agent')) {
    const chatbots = await db.chatbot.findMany({
      where: {
        deletedAt: null,
        ...(spaceId && { spaceId }),
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ]
        })
      },
      take: 30,
      select: {
        id: true,
        name: true,
        description: true,
        isPublished: true,
        spaceId: true,
        space: {
          select: { id: true, name: true }
        }
      }
    })
    
    for (const chatbot of chatbots) {
      addNode({
        id: `aiagent-${chatbot.id}`,
        type: 'ai_agent',
        name: chatbot.name,
        description: chatbot.description || undefined,
        metadata: { isPublished: chatbot.isPublished }
      })
      
      if (chatbot.space) {
        addNode({
          id: `space-${chatbot.spaceId}`,
          type: 'space',
          name: chatbot.space.name,
        })
        addEdge({
          source: `aiagent-${chatbot.id}`,
          target: `space-${chatbot.spaceId}`,
          type: 'belongs_to',
          label: 'in space'
        })
      }
    }
  }
  
  // Fetch infrastructure instances
  if (!nodeTypes || nodeTypes.includes('vm') || nodeTypes.includes('container') || nodeTypes.includes('service')) {
    const instances = await db.infrastructureInstance.findMany({
      where: {
        deletedAt: null,
        ...(spaceId && { spaceId }),
        ...(searchQuery && {
          name: { contains: searchQuery, mode: 'insensitive' }
        })
      },
      take: 30,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        spaceId: true,
        space: {
          select: { id: true, name: true }
        }
      }
    })
    
    for (const instance of instances) {
      const nodeType: OntologyNodeType = 
        instance.type === 'vm' ? 'vm' :
        instance.type === 'docker_host' ? 'container' :
        instance.type === 'kubernetes' ? 'container' : 'service'
      
      addNode({
        id: `infra-${instance.id}`,
        type: nodeType,
        name: instance.name,
        metadata: { status: instance.status, type: instance.type }
      })
      
      if (instance.space && instance.spaceId) {
        addNode({
          id: `space-${instance.spaceId}`,
          type: 'space',
          name: instance.space.name,
        })
        addEdge({
          source: `infra-${instance.id}`,
          target: `space-${instance.spaceId}`,
          type: 'belongs_to',
          label: 'in space'
        })
      }
    }
  }
  
  return {
    nodes,
    edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
    }
  }
}

async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || undefined
  const nodeTypesParam = searchParams.get('nodeTypes') || searchParams.get('node_types')
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id') || undefined
  const projectId = searchParams.get('projectId') || searchParams.get('project_id') || undefined
  const depth = parseInt(searchParams.get('depth') || '2')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  const nodeTypes = nodeTypesParam 
    ? nodeTypesParam.split(',') as OntologyNodeType[]
    : undefined

  const graph = await generateOntologyGraph({
    query,
    nodeTypes,
    spaceId,
    projectId,
    depth,
    limit,
  })

  return NextResponse.json({ graph })
}

export const GET = withErrorHandling(getHandler, 'GET /api/ontology')
