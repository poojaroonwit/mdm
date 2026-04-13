import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/user-groups - List all active groups for selection
async function getHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response

  try {
    const result = await query(
      `SELECT id, name, description, parent_id as "parentId"
       FROM user_groups
       WHERE is_active = true
       ORDER BY sort_order ASC NULLS LAST, name ASC`
    )

    return NextResponse.json({ groups: result.rows })
  } catch (error) {
    console.error('Error loading user groups:', error)
    return NextResponse.json(
      { error: 'Failed to load user groups' },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/user-groups')
