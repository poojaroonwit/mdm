import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// GET /api/users/all-with-spaces - get all users with their space associations
export async function GET(request: NextRequest) {
  const forbidden = await requireRole(request, 'MANAGER')
  if (forbidden) return forbidden

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const isActive = searchParams.get('is_active') || ''
    const spaceId = searchParams.get('space_id') || ''

    const offset = (page - 1) * limit

    // Build WHERE conditions
    let whereConditions = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      whereConditions.push(`u.role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (isActive !== '') {
      whereConditions.push(`u.is_active = $${paramIndex}`)
      queryParams.push(isActive === 'true')
      paramIndex++
    }

    if (spaceId) {
      whereConditions.push(`u.id IN (SELECT user_id FROM space_members WHERE space_id = $${paramIndex}::uuid)`)
      queryParams.push(spaceId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `
    const { rows: countRows } = await query(countQuery, queryParams)
    const total = parseInt(countRows[0].total)

    // Get users with their space associations
    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active,
        NULL as avatar,
        u.created_at,
        u.updated_at,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', sm.id,
              'space_id', sm.space_id,
              'role', sm.role,
              'created_at', sm.created_at,
              'space_name', s.name,
              'space_description', s.description,
              'space_is_default', s.is_default,
              'space_is_active', s.is_active
            )
          ) FROM space_members sm
          JOIN spaces s ON sm.space_id = s.id
          WHERE sm.user_id = u.id AND s.deleted_at IS NULL
          ), '[]'::json
        ) as spaces
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)
    const { rows: users } = await query(usersQuery, queryParams)

    // Get all spaces for reference
    const { rows: allSpaces } = await query(`
      SELECT id, name, description, is_default, is_active
      FROM spaces 
      WHERE deleted_at IS NULL 
      ORDER BY is_default DESC, name ASC
    `)

    return NextResponse.json({
      success: true,
      users,
      spaces: allSpaces,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users with spaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users with spaces' },
      { status: 500 }
    )
  }
}
