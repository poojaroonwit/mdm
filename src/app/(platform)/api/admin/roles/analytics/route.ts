import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requirePermission } from '@/lib/api-permissions'

export async function GET(request: NextRequest) {
  try {
    const forbidden = await requirePermission(request, 'system:view_analytics')
    if (forbidden) return forbidden

    // Get role usage statistics
    const { rows: globalRoleUsage } = await query(`
      SELECT 
        u.role as role_name,
        COUNT(*) as user_count
      FROM users u
      WHERE u.role IS NOT NULL
      GROUP BY u.role
      ORDER BY user_count DESC
    `)

    const { rows: spaceRoleUsage } = await query(`
      SELECT 
        sm.role as role_name,
        COUNT(*) as member_count,
        COUNT(DISTINCT sm.space_id) as space_count
      FROM space_members sm
      WHERE sm.role IS NOT NULL
      GROUP BY sm.role
      ORDER BY member_count DESC
    `)

    // Get custom roles usage
    const { rows: customRoleUsage } = await query(`
      SELECT 
        r.id,
        r.name,
        r.level,
        COUNT(DISTINCT CASE 
          WHEN r.level = 'global' THEN u.id 
          WHEN r.level = 'space' THEN sm.user_id 
        END) as usage_count
      FROM roles r
      LEFT JOIN users u ON r.level = 'global' AND u.role = r.name
      LEFT JOIN space_members sm ON r.level = 'space' AND sm.role = r.name
      WHERE r.is_system = false
      GROUP BY r.id, r.name, r.level
      ORDER BY usage_count DESC
    `)

    // Get permissions distribution
    const { rows: permissionDistribution } = await query(`
      SELECT 
        p.resource,
        COUNT(DISTINCT rp.role_id) as role_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.resource
      ORDER BY role_count DESC
    `)

    return NextResponse.json({
      globalRoles: globalRoleUsage,
      spaceRoles: spaceRoleUsage,
      customRoles: customRoleUsage,
      permissionDistribution
    })
  } catch (error) {
    console.error('Error getting role analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






