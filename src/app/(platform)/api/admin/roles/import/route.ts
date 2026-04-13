import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

export async function POST(request: NextRequest) {
  try {
    const forbidden = await requirePermission(request, 'system:manage_roles')
    if (forbidden) return forbidden

    const body = await request.json()
    const { role, permissions } = body

    if (!role || !role.name || !role.level) {
      return NextResponse.json(
        { error: 'Invalid role data' },
        { status: 400 },
      )
    }

    // Check if role already exists
    const { rows: existing } = await query(
      'SELECT id FROM roles WHERE name = $1 AND level = $2',
      [role.name, role.level],
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 400 },
      )
    }

    // Create role
    const { rows: newRole } = await query(
      `INSERT INTO roles (name, description, level, is_system)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, level, is_system`,
      [role.name, role.description || null, role.level, false],
    )

    // Assign permissions
    let assignedCount = 0
    if (permissions && Array.isArray(permissions)) {
      for (const perm of permissions) {
        const { rows: permRows } = await query(
          `SELECT id FROM permissions 
           WHERE name = $1 OR (resource = $2 AND action = $3)`,
          [perm.name, perm.resource, perm.action],
        )

        if (permRows.length > 0) {
          await query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
            [newRole[0].id, permRows[0].id],
          )
          assignedCount++
        }
      }
    }

    return NextResponse.json({
      role: {
        ...newRole[0],
        isSystem: newRole[0].is_system || false,
        level: newRole[0].level || 'space',
      },
      permissionsAssigned: assignedCount,
    })
  } catch (error: any) {
    console.error('Error importing role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}


