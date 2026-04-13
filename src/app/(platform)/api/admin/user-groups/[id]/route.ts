import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/user-groups/[id] - Get single group with members
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { id } = await params

    const group = await db.userGroup.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          select: { id: true, name: true, description: true, sortOrder: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true }
            }
          }
        },
        _count: { select: { members: true, children: true } }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        parentId: group.parentId,
        parent: group.parent,
        isActive: group.isActive,
        sortOrder: group.sortOrder,
        metadata: group.metadata,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        memberCount: group._count.members,
        childCount: group._count.children,
        children: group.children,
        members: group.members.map(m => ({
          id: m.id,
          role: m.role,
          createdAt: m.createdAt,
          userId: m.user.id,
          userName: m.user.name,
          userEmail: m.user.email,
          userAvatar: m.user.avatar,
          userRole: m.user.role
        }))
      }
    })
  } catch (error) {
    console.error('Error loading user group:', error)
    return NextResponse.json(
      { error: 'Failed to load user group' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/user-groups/[id] - Update group
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, parentId, isActive, sortOrder, metadata } = body

    // Check group exists
    const existingGroup = await db.userGroup.findUnique({ where: { id } })
    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json(
        { error: 'A group cannot be its own parent' },
        { status: 400 }
      )
    }

    // Validate parentId if provided and check for circular reference
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

      // Check for circular reference - ensure the new parent isn't a descendant
      let currentParent = parentGroup
      while (currentParent.parentId) {
        if (currentParent.parentId === id) {
          return NextResponse.json(
            { error: 'Cannot set parent to a descendant group (circular reference)' },
            { status: 400 }
          )
        }
        const nextParent = await db.userGroup.findUnique({
          where: { id: currentParent.parentId }
        })
        if (!nextParent) break
        currentParent = nextParent
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (parentId !== undefined) updateData.parentId = parentId || null
    if (isActive !== undefined) updateData.isActive = isActive
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (metadata !== undefined) updateData.metadata = metadata

    const group = await db.userGroup.update({
      where: { id },
      data: updateData,
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
    })
  } catch (error) {
    console.error('Error updating user group:', error)
    return NextResponse.json(
      { error: 'Failed to update user group' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/user-groups/[id] - Delete group
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { id } = await params

    // Check group exists
    const existingGroup = await db.userGroup.findUnique({
      where: { id },
      include: { _count: { select: { children: true } } }
    })

    if (!existingGroup) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if group has children
    if (existingGroup._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete group with child groups. Delete children first or move them to another parent.' },
        { status: 400 }
      )
    }

    // Delete group (members will be cascade deleted)
    await db.userGroup.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user group:', error)
    return NextResponse.json(
      { error: 'Failed to delete user group' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/user-groups/[id]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/user-groups/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/admin/user-groups/[id]')
