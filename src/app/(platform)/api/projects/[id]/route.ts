import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireProjectSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'

const PROJECT_ROLE_VALUES = new Set([
  'owner',
  'lead',
  'developer',
  'qa',
  'designer',
  'analyst',
  'stakeholder',
  'viewer',
])

const DATA_MODEL_RELATIONSHIP_VALUES = new Set([
  'primary',
  'secondary',
  'reference',
  'deprecated',
])

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

async function normalizeProjectMembers(
  rawMembers: unknown,
  projectId: string,
  options: { strict: boolean }
) {
  const candidates = asArray<Record<string, any>>(rawMembers)
  if (candidates.length === 0) {
    return []
  }

  const userIds = new Set<string>()
  const emails = new Set<string>()

  for (const member of candidates) {
    if (!member || typeof member !== 'object') continue

    const rawUserId = typeof member.userId === 'string'
      ? member.userId.trim()
      : typeof member.user?.id === 'string'
        ? member.user.id.trim()
        : ''
    const rawEmail = typeof member.user?.email === 'string'
      ? member.user.email.trim().toLowerCase()
      : typeof member.email === 'string'
        ? member.email.trim().toLowerCase()
        : ''

    if (rawUserId) userIds.add(rawUserId)
    if (rawEmail) emails.add(rawEmail)
  }

  if (userIds.size === 0 && emails.size === 0) {
    if (options.strict) {
      throw new Error('Each project member must include a valid user ID or email')
    }
    return []
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        ...(userIds.size > 0 ? [{ id: { in: Array.from(userIds) } }] : []),
        ...(emails.size > 0 ? [{ email: { in: Array.from(emails) } }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    }
  })

  const usersById = new Map(users.map((user) => [user.id, user]))
  const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]))
  const normalized = new Map<string, any>()

  for (const member of candidates) {
    if (!member || typeof member !== 'object') continue

    const rawUserId = typeof member.userId === 'string'
      ? member.userId.trim()
      : typeof member.user?.id === 'string'
        ? member.user.id.trim()
        : ''
    const rawEmail = typeof member.user?.email === 'string'
      ? member.user.email.trim().toLowerCase()
      : typeof member.email === 'string'
        ? member.email.trim().toLowerCase()
        : ''

    const user = (rawUserId ? usersById.get(rawUserId) : undefined) || (rawEmail ? usersByEmail.get(rawEmail) : undefined)
    if (!user) {
      if (options.strict) {
        const identifier = rawEmail || rawUserId || 'unknown user'
        throw new Error(`Project member not found: ${identifier}`)
      }
      continue
    }

    const role = typeof member.role === 'string' && PROJECT_ROLE_VALUES.has(member.role)
      ? member.role
      : 'viewer'
    const joinedAt = typeof member.joinedAt === 'string' && member.joinedAt.trim().length > 0
      ? member.joinedAt
      : new Date().toISOString()
    const permissions = Array.isArray(member.permissions)
      ? member.permissions.filter((permission: unknown) => typeof permission === 'string' && permission.trim().length > 0)
      : undefined

    normalized.set(user.id, {
      id: typeof member.id === 'string' && member.id.trim().length > 0 ? member.id : `member-${user.id}`,
      userId: user.id,
      projectId,
      role,
      user: {
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        ...(user.avatar ? { avatar: user.avatar } : {}),
      },
      joinedAt,
      ...(permissions && permissions.length > 0 ? { permissions } : {}),
    })
  }

  return Array.from(normalized.values())
}

async function normalizeProjectDataModels(
  rawDataModels: unknown,
  projectId: string,
  projectSpaceId: string,
  options: { strict: boolean }
) {
  const candidates = asArray<Record<string, any>>(rawDataModels)
  if (candidates.length === 0) {
    return []
  }

  const dataModelIds = Array.from(
    new Set(
      candidates
        .map((item) => {
          if (!item || typeof item !== 'object') return ''
          if (typeof item.dataModelId === 'string') return item.dataModelId.trim()
          if (typeof item.dataModel?.id === 'string') return item.dataModel.id.trim()
          return ''
        })
        .filter(Boolean)
    )
  )

  if (dataModelIds.length === 0) {
    if (options.strict) {
      throw new Error('Each linked data model must include a valid data model ID')
    }
    return []
  }

  const models = await db.dataModel.findMany({
    where: {
      id: { in: dataModelIds },
      deletedAt: null,
      spaces: {
        some: {
          spaceId: projectSpaceId
        }
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          attributes: true
        }
      }
    }
  })

  const modelsById = new Map(models.map((model) => [model.id, model]))
  const normalized = new Map<string, any>()

  for (const item of candidates) {
    if (!item || typeof item !== 'object') continue

    const rawDataModelId = typeof item.dataModelId === 'string'
      ? item.dataModelId.trim()
      : typeof item.dataModel?.id === 'string'
        ? item.dataModel.id.trim()
        : ''
    const model = rawDataModelId ? modelsById.get(rawDataModelId) : undefined

    if (!model) {
      if (options.strict) {
        const identifier = rawDataModelId || 'unknown data model'
        throw new Error(`Data model not found in this project space: ${identifier}`)
      }
      continue
    }

    const relationship = typeof item.relationship === 'string' && DATA_MODEL_RELATIONSHIP_VALUES.has(item.relationship)
      ? item.relationship
      : 'reference'
    const createdAt = typeof item.createdAt === 'string' && item.createdAt.trim().length > 0
      ? item.createdAt
      : new Date().toISOString()

    normalized.set(model.id, {
      id: typeof item.id === 'string' && item.id.trim().length > 0 ? item.id : `project-datamodel-${model.id}`,
      projectId,
      dataModelId: model.id,
      dataModel: {
        id: model.id,
        name: model.name,
        ...(model.description ? { description: model.description } : {}),
        attributeCount: model._count.attributes,
      },
      relationship,
      createdAt,
    })
  }

  return Array.from(normalized.values())
}

async function hydrateProjectMetadata(
  projectId: string,
  projectSpaceId: string,
  metadata: unknown
) {
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata as Record<string, any> : {}

  return {
    members: await normalizeProjectMembers(safeMetadata.members, projectId, { strict: false }),
    links: asArray(safeMetadata.links),
    assets: asArray(safeMetadata.assets),
    dataModels: await normalizeProjectDataModels(safeMetadata.dataModels, projectId, projectSpaceId, { strict: false }),
    notebooks: asArray(safeMetadata.notebooks),
    chatbots: asArray(safeMetadata.chatbots),
    queries: asArray(safeMetadata.queries),
  }
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  
  // Validate ID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
  }

  const accessResult = await requireProjectSpaceAccess(id, session.user.id!)
  if (!accessResult.success) return accessResult.response
  
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

  const hydratedMetadata = await hydrateProjectMetadata(project.id, project.spaceId, project.metadata)
  
  return NextResponse.json({ 
    project: {
      ...project,
      ...hydratedMetadata,
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

  const { session } = authResult
  const { id } = await params
  const accessResult = await requireProjectSpaceAccess(id, session.user.id!)
  if (!accessResult.success) return accessResult.response
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
    select: { metadata: true, spaceId: true }
  })

  if (!existingProject) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  const existingMetadata = (existingProject.metadata as any) || {}
  let normalizedMembers = existingMetadata.members
  let normalizedDataModels = existingMetadata.dataModels

  try {
    if (members !== undefined) {
      normalizedMembers = await normalizeProjectMembers(members, id, { strict: true })
    }

    if (dataModels !== undefined) {
      normalizedDataModels = await normalizeProjectDataModels(dataModels, id, existingProject.spaceId, { strict: true })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid project metadata' },
      { status: 400 }
    )
  }

  const updatedMetadata = {
    ...existingMetadata,
    ...metadata,
    ...(members !== undefined && { members: normalizedMembers }),
    ...(links !== undefined && { links }),
    ...(assets !== undefined && { assets }),
    ...(dataModels !== undefined && { dataModels: normalizedDataModels }),
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

  const { session } = authResult
  const { id } = await params
  const accessResult = await requireProjectSpaceAccess(id, session.user.id!)
  if (!accessResult.success) return accessResult.response

  await db.project.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/projects/[id]')
