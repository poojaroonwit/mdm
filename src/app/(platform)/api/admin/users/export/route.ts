import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const active = searchParams.get('active') || ''
  const spaceId = searchParams.get('spaceId') || ''

  const whereConditions: string[] = []
  const queryParams: any[] = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(
      `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`
    )
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (role) {
    whereConditions.push(`u.role = $${paramIndex}`)
    queryParams.push(role)
    paramIndex++
  }

  if (active !== '') {
    whereConditions.push(`u.is_active = $${paramIndex}`)
    queryParams.push(active === 'true')
    paramIndex++
  }

  if (spaceId) {
    whereConditions.push(
      `u.id IN (SELECT user_id FROM space_members WHERE space_id = $${paramIndex}::uuid)`
    )
    queryParams.push(spaceId)
    paramIndex++
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  const usersResult = await query(
    `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'spaceId', sm.space_id,
              'spaceName', sp.name,
              'role', sm.role
            )
          ) FILTER (WHERE sm.space_id IS NOT NULL),
          '[]'::json
        ) as spaces
      FROM users u
      LEFT JOIN space_members sm ON u.id = sm.user_id
      LEFT JOIN spaces sp ON sm.space_id = sp.id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at
      ORDER BY u.created_at DESC
    `,
    queryParams
  )

  const users = usersResult.rows
  const headers = [
    'ID',
    'Name',
    'Email',
    'Role',
    'Status',
    'Created At',
    'Last Login',
    'Default Space',
    'Space Memberships'
  ]
  const csvRows = [headers.join(',')]

  for (const user of users) {
    const spaces = Array.isArray(user.spaces) ? user.spaces : []
    const spaceMemberships = spaces
      .map((s: any) => `${s.spaceName} (${s.role})`)
      .join('; ')

    const row = [
      user.id,
      `"${String(user.name || '').replace(/"/g, '""')}"`,
      `"${String(user.email || '').replace(/"/g, '""')}"`,
      user.role || '',
      user.is_active ? 'Active' : 'Inactive',
      user.created_at ? new Date(user.created_at).toISOString() : '',
      '', // Last Login (not in DB)
      '', // Default Space (not in DB)
      `"${spaceMemberships.replace(/"/g, '""')}"`
    ]
    csvRows.push(row.join(','))
  }

  const csv = csvRows.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="users-export-${
        new Date().toISOString().split('T')[0]
      }.csv"`
    }
  })
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/users/export'
)

