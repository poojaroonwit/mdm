import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/user-groups/[id]/members - List members of a group
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
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true, isActive: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      members: group.members.map(m => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user
      }))
    })
  } catch (error) {
    console.error('Error loading group members:', error)
    return NextResponse.json(
      { error: 'Failed to load group members' },
      { status: 500 }
    )
  }
}

// POST /api/admin/user-groups/[id]/members - Add member(s) to group
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { id: groupId } = await params
    const body = await request.json()
    const { userId, userIds, role = 'MEMBER' } = body

    // Validate group exists
    const group = await db.userGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Support both single userId and array of userIds
    const idsToAdd: string[] = userIds || (userId ? [userId] : [])

    if (idsToAdd.length === 0) {
      return NextResponse.json(
        { error: 'userId or userIds is required' },
        { status: 400 }
      )
    }

    // Validate users exist
    const users = await db.user.findMany({
      where: { id: { in: idsToAdd } },
      select: { id: true }
    })

    if (users.length !== idsToAdd.length) {
      return NextResponse.json(
        { error: 'One or more users not found' },
        { status: 400 }
      )
    }

    // Add members (skip duplicates)
    const addedMembers = []
    const skippedUsers = []

    for (const uid of idsToAdd) {
      try {
        const member = await db.userGroupMember.create({
          data: {
            groupId,
            userId: uid,
            role
          },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        })
        addedMembers.push({
          id: member.id,
          role: member.role,
          userId: member.user.id,
          userName: member.user.name,
          userEmail: member.user.email
        })
      } catch (err: any) {
        // Unique constraint violation - user already in group
        if (err.code === 'P2002') {
          skippedUsers.push(uid)
        } else {
          throw err
        }
      }
    }

    return NextResponse.json({
      added: addedMembers,
      skipped: skippedUsers,
      message: skippedUsers.length > 0
        ? `Added ${addedMembers.length} member(s), ${skippedUsers.length} already in group`
        : `Added ${addedMembers.length} member(s) to group`
    }, { status: 201 })
  } catch (error) {
    console.error('Error adding group member:', error)
    return NextResponse.json(
      { error: 'Failed to add group member' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/user-groups/[id]/members - Remove member(s) from group
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  try {
    const { id: groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const userIds = searchParams.get('userIds')?.split(',').filter(Boolean)
    const memberId = searchParams.get('memberId')

    // Validate group exists
    const group = await db.userGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Handle deletion by memberId
    if (memberId) {
      const result = await db.userGroupMember.deleteMany({
        where: { id: memberId, groupId }
      })
      if (result.count === 0) {
        return NextResponse.json({ error: 'Member not found in group' }, { status: 404 })
      }
      return NextResponse.json({ success: true, removed: 1 })
    }

    // Handle deletion by userId(s)
    const idsToRemove = userIds || (userId ? [userId] : [])
    if (idsToRemove.length === 0) {
      return NextResponse.json(
        { error: 'userId, userIds, or memberId is required' },
        { status: 400 }
      )
    }

    const result = await db.userGroupMember.deleteMany({
      where: {
        groupId,
        userId: { in: idsToRemove }
      }
    })

    return NextResponse.json({
      success: true,
      removed: result.count
    })
  } catch (error) {
    console.error('Error removing group member:', error)
    return NextResponse.json(
      { error: 'Failed to remove group member' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/user-groups/[id]/members')
export const POST = withErrorHandling(postHandler, 'POST /api/admin/user-groups/[id]/members')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/admin/user-groups/[id]/members')
