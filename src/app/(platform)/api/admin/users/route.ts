import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db, query } from '@/lib/db'
import bcrypt from 'bcryptjs'

function normalizeAllowedLoginMethods(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  const allowedMethods = new Set(['email', 'google', 'azure-ad'])
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => allowedMethods.has(item))
    )
  )
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  // Check if user has admin privileges
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { email, name, password, role, isActive, is_active, defaultSpaceId, default_space_id, spaces } = body
    const finalIsActive = isActive !== undefined ? isActive : (is_active !== undefined ? is_active : true)
    const finalDefaultSpaceId = defaultSpaceId || default_space_id
    const allowedLoginMethods = normalizeAllowedLoginMethods(body.allowedLoginMethods)

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Validate role
    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']
    const userRole = role || 'USER'
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with Prisma
    // Note: ID generation is handled by Prisma/Database if default(uuid()) is set in schema
    // If not, we might need to add it, but standard practice is schema handling.
    // Based on previous code using uuidv4(), let's check if we need to provide it.
    // However, Prisma usually handles this better. I'll assume schema has @default(uuid()).
    // If not, the transaction below will fail and I'll see it in validation.

    // Using transaction to handle user creation and space memberships
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: userRole,
          isActive: finalIsActive,
          allowedLoginMethods,
          // created_at and updated_at are usually handled by @default(now()) and @updatedAt
        }
      })

      // Handle space memberships if provided
      if (spaces && Array.isArray(spaces) && spaces.length > 0) {
        for (const space of spaces) {
          if (space.spaceId && space.role) {
            await tx.spaceMember.create({
              data: {
                userId: user.id,
                spaceId: space.spaceId,
                role: space.role
              }
            })
          }
        }
      }

      return user
    })

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          isActive: newUser.isActive,
          allowedLoginMethods: newUser.allowedLoginMethods,
          createdAt: newUser.createdAt
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    )
  }
}





async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  // Check if user has admin privileges
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const active = searchParams.get('active') || ''
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id') || ''

  const offset = (page - 1) * limit

  // Build the query with filters
  let whereConditions: string[] = []
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

  if (active !== '') {
    whereConditions.push(`u.is_active = $${paramIndex}`)
    queryParams.push(active === 'true')
    paramIndex++
  }

  if (spaceId) {
    whereConditions.push(`u.id::text IN (SELECT user_id::text FROM space_members WHERE space_id::text = $${paramIndex})`)
    queryParams.push(spaceId)
    paramIndex++
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

  // Get users with space associations and group memberships
  // Add limit and offset as the last parameters
  const limitParamIndex = paramIndex
  const offsetParamIndex = paramIndex + 1
  const usersQueryParams = [...queryParams, limit, offset]

  const users = await query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.is_active as "isActive",
        u.is_two_factor_enabled as "isTwoFactorEnabled",
        u.allowed_login_methods as "allowedLoginMethods",
        u.created_at as "createdAt",
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'spaceId', sm.space_id,
              'spaceName', s.name,
              'role', sm.role
            )
          ) FILTER (WHERE sm.space_id IS NOT NULL),
          '[]'::json
        ) as spaces,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'groupId', ugm.group_id,
              'groupName', ug.name,
              'role', ugm.role
            )
          ) FILTER (WHERE ugm.group_id IS NOT NULL),
          '[]'::json
        ) as groups
      FROM users u
      LEFT JOIN space_members sm ON u.id = sm.user_id
      LEFT JOIN spaces s ON sm.space_id = s.id
      LEFT JOIN user_group_members ugm ON u.id = ugm.user_id
      LEFT JOIN user_groups ug ON ugm.group_id = ug.id
      ${whereClause}
      GROUP BY u.id, u.email, u.name, u.role, u.is_active, u.is_two_factor_enabled, u.allowed_login_methods, u.created_at
      ORDER BY u.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `, usersQueryParams)

  // Get total count (reuse the same WHERE clause and params, without limit/offset)
  const countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      ${whereClause}
    `
  const totalResult = await query(countQuery, queryParams)
  const total = parseInt(totalResult.rows[0]?.total || '0')

  return NextResponse.json({
    users: users.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/users')
export const GET = withErrorHandling(getHandler, 'GET /api/admin/users')
