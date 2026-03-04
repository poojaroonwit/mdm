import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'

export const RolePriority: Record<AppRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
}

export function hasRole(userRole: string | undefined | null, required: AppRole): boolean {
  if (!userRole) return false
  const current = RolePriority[userRole as AppRole]
  const needed = RolePriority[required]
  if (current === undefined || needed === undefined) return false
  return current >= needed
}

export async function requireRole(
  request: NextRequest,
  required: AppRole
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions)
    const role = session?.user?.role

    if (!role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!hasRole(role, required)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return null
  } catch (error) {
    console.error('Role check error:', error)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}


