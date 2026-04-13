import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/user-groups - List all groups with hierarchy
async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { searchParams } = new URL(request.url)
    const includeMembers = searchParams.get('includeMembers') === 'true' || searchParams.get('include_members') === 'true'
    const flat = searchParams.get('flat') === 'true'

    const groups = await db.userGroup.findMany({
      where: { isActive: true },
      include: {
        members: includeMembers ? {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          }
        } : { select: { id: true } },
        _count: { select: { members: true, children: true } }
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    })

    // Transform groups to include member count
    const transformedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      parentId: group.parentId,
      isActive: group.isActive,
      sortOrder: group.sortOrder,
      metadata: group.metadata,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.members,
      childCount: group._count.children,
      members: includeMembers ? (group.members as any[]).map(m => ({
        id: m.id,
        role: m.role,
        userId: m.user.id,
        userName: m.user.name,
        userEmail: m.user.email,
        userAvatar: m.user.avatar
      })) : undefined
    }))

    // If flat mode, return as-is
    if (flat) {
      return NextResponse.json({ groups: transformedGroups })
    }

    // Build tree structure
    const groupMap = new Map(transformedGroups.map(g => [g.id, { ...g, children: [] as any[] }]))
    const rootGroups: any[] = []

    transformedGroups.forEach(group => {
      const groupNode = groupMap.get(group.id)!
      if (group.parentId && groupMap.has(group.parentId)) {
        groupMap.get(group.parentId)!.children.push(groupNode)
      } else {
        rootGroups.push(groupNode)
      }
    })

    return NextResponse.json({ groups: rootGroups })
  } catch (error) {
    console.error('Error loading user groups:', error)
    return NextResponse.json(
      { error: 'Failed to load user groups' },
      { status: 500 }
    )
  }
}

// POST /api/admin/user-groups - Create new group
async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const body = await request.json()
    const { name, description, parentId, parent_id, sortOrder, sort_order, metadata } = body
    const finalParentId = parentId || parent_id
    const finalSortOrder = sortOrder !== undefined ? sortOrder : (sort_order !== undefined ? sort_order : 0)

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Validate parentId if provided
    if (parentId) {
      const parentGroup = await db.userGroup.findUnique({
        where: { id: parentId }
      })
      if (!parentGroup) {
        return NextResponse.json(
          { error: 'Parent group not found' },
          { status: 400 }
        )
      }
    }

    const group = await db.userGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: finalParentId || null,
        sortOrder: finalSortOrder,
        metadata: metadata || {}
      },
      include: {
        _count: { select: { members: true, children: true } }
      }
    })

    return NextResponse.json({
      group: {
        ...group,
        memberCount: group._count.members,
        childCount: group._count.children
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user group:', error)
    return NextResponse.json(
      { error: 'Failed to create user group' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/user-groups')
export const POST = withErrorHandling(postHandler, 'POST /api/admin/user-groups')
