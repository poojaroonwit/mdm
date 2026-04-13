import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const forbidden = await requirePermission(request, 'system:manage_roles')
    if (forbidden) return forbidden

    const { id } = await params

    // Get role
    const { rows: role } = await query(
      'SELECT id, name, description, level, is_system FROM roles WHERE id = $1',
      [id],
    )

    if (role.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 },
      )
    }

    // Get permissions
    const { rows: permissions } = await query(
      `SELECT p.id, p.name, p.description, p.resource, p.action
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [id],
    )

    const exportData = {
      role: {
        name: role[0].name,
        description: role[0].description,
        level: role[0].level,
        isSystem: role[0].is_system,
      },
      permissions: permissions.map((p: any) => ({
        name: p.name,
        resource: p.resource,
        action: p.action,
      })),
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}


