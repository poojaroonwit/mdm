import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, isActive, requiresPasswordChange } = body

    // Validation
    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!password || String(password).length < 8) {
        // If no password provided, we could auto-generate, but for now let's require it
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check if user already exists using Prisma
    const existing = await db.user.findUnique({
      where: { email: email }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const roleValue = role || 'USER'
    const isActiveValue = isActive !== undefined ? isActive : true
    const reqPassChangeValue = requiresPasswordChange !== undefined ? requiresPasswordChange : false

    // Create user using Prisma
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: roleValue,
        isActive: isActiveValue,
        requiresPasswordChange: reqPassChangeValue,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        is_active: newUser.isActive,
        created_at: newUser.createdAt,
      }
    })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/users/create'
)
