import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  const { id } = await params
  
  // Validate ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }
  
  const project = await db.project.findUnique({
    where: { id, deletedAt: null },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      milestones: {
        where: { deletedAt: null },
        orderBy: { position: 'asc' },
        include: {
          _count: {
            select: { tickets: true }
          }
        }
      },
      tickets: {
        where: { deletedAt: null },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true
        }
      },
      modules: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          description: true,
          status: true
        }
      },
      _count: {
        select: {
          tickets: true,
          milestones: true,
          modules: true
        }
      }
    }
  })

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  // Parse metadata to include members, links, assets, etc.
  const metadata = (project.metadata as any) || {}
  
  return NextResponse.json({ 
    project: {
      ...project,
      members: metadata.members || [],
      links: metadata.links || [],
      assets: metadata.assets || [],
      dataModels: metadata.dataModels || [],
      notebooks: metadata.notebooks || [],
      chatbots: metadata.chatbots || [],
      queries: metadata.queries || [],
    }
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/projects/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response

  const { id } = await params
  const body = await request.json()
  
  const { 
    name, 
    description, 
    status, 
    startDate, 
    endDate, 
    metadata,
    members,
    links,
    assets,
    dataModels,
    notebooks,
    chatbots,
    queries
  } = body

  // Build updated metadata
  const existingProject = await db.project.findUnique({
    where: { id },
    select: { metadata: true }
  })

  if (!existingProject) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  const existingMetadata = (existingProject.metadata as any) || {}
  const updatedMetadata = {
    ...existingMetadata,
    ...metadata,
    ...(members !== undefined && { members }),
    ...(links !== undefined && { links }),
    ...(assets !== undefined && { assets }),
    ...(dataModels !== undefined && { dataModels }),
    ...(notebooks !== undefined && { notebooks }),
    ...(chatbots !== undefined && { chatbots }),
    ...(queries !== undefined && { queries }),
  }

  const project = await db.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      metadata: updatedMetadata,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      _count: {
        select: {
          tickets: true,
          milestones: true
        }
      }
    }
  })

  return NextResponse.json({ 
    project: {
      ...project,
      members: updatedMetadata.members || [],
      links: updatedMetadata.links || [],
      assets: updatedMetadata.assets || [],
      dataModels: updatedMetadata.dataModels || [],
      notebooks: updatedMetadata.notebooks || [],
      chatbots: updatedMetadata.chatbots || [],
      queries: updatedMetadata.queries || [],
    }
  })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/projects/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response

  const { id } = await params

  await db.project.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/projects/[id]')
