import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const forbidden = await requirePermission(request, 'system:manage_roles')
    if (forbidden) return forbidden

    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 },
      )
    }

    // Get original role
    const { rows: originalRole } = await query(
      'SELECT name, description, level, is_system FROM roles WHERE id = $1',
      [id],
    )

    if (originalRole.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 },
      )
    }

    const role = originalRole[0]

    // Create new role
    const { rows: newRole } = await query(
      `INSERT INTO roles (name, description, level, is_system)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, level, is_system`,
      [name, description || role.description, role.level, false],
    )

    // Copy permissions
    const { rows: permissions } = await query(
      'SELECT permission_id FROM role_permissions WHERE role_id = $1',
      [id],
    )

    for (const perm of permissions) {
      await query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [newRole[0].id, perm.permission_id],
      )
    }

    return NextResponse.json({
      role: {
        ...newRole[0],
        isSystem: newRole[0].is_system || false,
        level: newRole[0].level || 'space',
      },
      permissionsCopied: permissions.length,
    })
  } catch (error: any) {
    if (String(error?.message || '').includes('duplicate')) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 },
      )
    }
    console.error('Error cloning role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}


