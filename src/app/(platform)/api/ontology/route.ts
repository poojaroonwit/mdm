import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { OntologyNodeType } from '@/lib/project-types'
import { generateOntologyGraph } from '@/lib/ontology/graph-generator'
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
