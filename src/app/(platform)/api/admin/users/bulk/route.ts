import { withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

async function postHandler(request: NextRequest) {
  const forbidden = await requirePermission(request, 'system:manage_users')
  if (forbidden) return forbidden

  const body = await request.json()
  const { userIds, role, spaceId, spaceRole, operation } = body as {
    userIds?: string[]
    role?: string
    spaceId?: string
    spaceRole?: string
    operation?: 'delete' | 'activate' | 'deactivate'
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json(
      { error: 'userIds array is required' },
      { status: 400 }
    )
  }

  const results = {
    success: [] as string[],
    failed: [] as Array<{ userId: string; error: string }>
  }

  if (operation === 'delete') {
    for (const userId of userIds) {
      try {
        await query('DELETE FROM space_members WHERE user_id = $1', [userId])
        await query('DELETE FROM users WHERE id = $1', [userId])
        results.success.push(userId)
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error?.message || 'Delete failed'
        })
      }
    }
  } else if (operation === 'activate' || operation === 'deactivate') {
    const activeStatus = operation === 'activate'
    for (const userId of userIds) {
      try {
        await query(
          'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2',
          [activeStatus, userId]
        )
        results.success.push(userId)
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error?.message || 'Update failed'
        })
      }
    }
  } else if (role) {
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    for (const userId of userIds) {
      try {
        await query(
          'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
          [role, userId]
        )
        results.success.push(userId)
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error?.message || 'Update failed'
        })
      }
    }
  } else if (spaceId && spaceRole) {
    for (const userId of userIds) {
      try {
        await query(
          `INSERT INTO space_members (space_id, user_id, role, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (space_id, user_id) 
           DO UPDATE SET role = $3, updated_at = NOW()`,
          [spaceId, userId, spaceRole]
        )
        if (!results.success.includes(userId)) {
          results.success.push(userId)
        }
      } catch (error: any) {
        results.failed.push({
          userId,
          error: error?.message || 'Space assignment failed'
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    results,
    summary: {
      total: userIds.length,
      succeeded: results.success.length,
      failed: results.failed.length
    }
  })
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/users/bulk'
)

