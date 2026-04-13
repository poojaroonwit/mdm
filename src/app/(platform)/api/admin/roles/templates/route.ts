import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'
import { GLOBAL_ROLES, SPACE_ROLES } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const forbidden = await requirePermission(request, 'system:manage_roles')
    if (forbidden) return forbidden

    // Return predefined role templates
    const templates = {
      global: GLOBAL_ROLES.map((role) => ({
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: role.permissions.map((p) => p.id),
      })),
      space: SPACE_ROLES.map((role) => ({
        name: role.name,
        description: role.description,
        level: role.level,
        permissions: role.permissions.map((p) => p.id),
      })),
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error getting role templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = await requirePermission(request, 'system:manage_roles')
    if (forbidden) return forbidden

    const body = await request.json()
    const { 
      templateName, 
      template_name,
      level, 
      customName, 
      custom_name,
      customDescription,
      custom_description 
    } = body

    const finalTemplateName = templateName || template_name
    const finalCustomName = customName || custom_name
    const finalCustomDescription = customDescription || custom_description

    if (!finalTemplateName || !level) {
      return NextResponse.json(
        { error: 'templateName and level are required' },
        { status: 400 },
      )
    }

    const templates = level === 'global' ? GLOBAL_ROLES : SPACE_ROLES
    const template = templates.find(
      (t) => t.id === finalTemplateName || t.name === finalTemplateName,
    )

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 },
      )
    }

    // Get permission IDs from database
    const permissionIds: string[] = []
    for (const perm of template.permissions) {
      const { rows } = await query(
        'SELECT id FROM permissions WHERE name = $1 OR (resource = $2 AND action = $3)',
        [perm.id, perm.resource, perm.action],
      )
      if (rows.length > 0) {
        permissionIds.push(rows[0].id)
      }
    }

    // Create role from template
    const roleName = finalCustomName || `${template.name}_custom`
    const roleDescription = finalCustomDescription || template.description

    const { rows: newRole } = await query(
      `INSERT INTO roles (name, description, level, is_system)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, level, is_system`,
      [roleName, roleDescription, level, false],
    )

    // Assign permissions
    for (const permId of permissionIds) {
      await query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [newRole[0].id, permId],
      )
    }

    return NextResponse.json({
      role: {
        ...newRole[0],
        isSystem: newRole[0].is_system || false,
        level: newRole[0].level || 'space',
      },
      permissionsAssigned: permissionIds.length,
    })
  } catch (error: any) {
    if (String(error?.message || '').includes('duplicate')) {
      return NextResponse.json(
        { error: 'Role with this name already exists' },
        { status: 400 },
      )
    }
    console.error('Error creating role from template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
