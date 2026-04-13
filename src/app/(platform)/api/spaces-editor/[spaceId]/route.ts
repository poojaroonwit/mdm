import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1::uuid AND sm.user_id = $2::uuid
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1::uuid AND s.created_by = $2::uuid`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const userRole = accessCheck.rows[0].role
    const isOwnerOrAdmin = ['OWNER', 'ADMIN'].includes(userRole)

    // Get user groups for permission filtering
    const userGroups = await query(
      `SELECT ugm.group_id 
       FROM user_group_members ugm
       JOIN user_groups ug ON ug.id = ugm.group_id
       WHERE ugm.user_id = $1::uuid AND ug.is_active = true`,
      [session.user.id]
    )
    const userGroupIds = userGroups.rows.map(r => r.group_id)

    // Get spaces editor config from system_settings
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        
        // Filter pages based on permissions
        if (config.pages && !isOwnerOrAdmin) {
          const filteredPages = config.pages.filter(page => {
            const perms = page.permissions
            if (!perms) return true // Visible to everyone if no permissions set
            
            const hasRole = perms.roles?.includes(userRole)
            const hasUser = perms.userIds?.includes(session.user.id)
            const hasGroup = perms.groupIds?.some(gid => userGroupIds.includes(gid))
            
            // If any permission is set, user must match at least one
            const somePermSet = (perms.roles?.length || 0) > 0 || (perms.userIds?.length || 0) > 0 || (perms.groupIds?.length || 0) > 0
            if (!somePermSet) return true
            
            return hasRole || hasUser || hasGroup
          })

          const allowedPageIds = new Set(filteredPages.map(p => p.id))
          config.pages = filteredPages

          // Also filter sidebar items
          if (config.sidebarConfig?.items) {
            const filterSidebarItems = (items: any[]) => {
              return items.filter(item => {
                if (item.type === 'page' && item.pageId && !allowedPageIds.has(item.pageId)) {
                  return false
                }
                if (item.children) {
                  item.children = filterSidebarItems(item.children)
                  // If it's a group and has no children left, we might want to hide it too?
                  // For now let's keep it or if it becomes empty and it's a group, hide it.
                  if (item.type === 'group' && item.children.length === 0) return false
                }
                return true
              })
            }
            config.sidebarConfig.items = filterSidebarItems(config.sidebarConfig.items)
          }
        }

        return NextResponse.json({ config })
      } catch (e) {
        console.error('Error parsing config:', e)
        return NextResponse.json({ config: null })
      }
    }

    return NextResponse.json({ config: null })
  } catch (error: any) {
    console.error('Error fetching spaces editor config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch config', details: error.message },
      { status: 500 }
    )
  }
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spaceId } = await params

    // Check if user has access to this space
    const accessCheck = await query(
      `SELECT sm.role 
       FROM space_members sm 
       WHERE sm.space_id = $1::uuid AND sm.user_id = $2::uuid
       UNION
       SELECT 'OWNER' as role
       FROM spaces s
       WHERE s.id = $1::uuid AND s.created_by = $2::uuid`,
      [spaceId, session.user.id]
    )

    if (accessCheck.rows.length === 0 || !['OWNER', 'ADMIN'].includes(accessCheck.rows[0].role.toUpperCase())) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const config: SpacesEditorConfig = body

    if (!config || config.spaceId !== spaceId) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
    }

    // Save config to system_settings
    const configKey = `spaces_editor_config_${spaceId}`
    const configValue = JSON.stringify(config)

    await query(
      `INSERT INTO system_settings (id, key, value, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [configKey, configValue]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving spaces editor config:', error)
    return NextResponse.json(
      { error: 'Failed to save config', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces-editor/[spaceId]')
export const POST = withErrorHandling(postHandler, 'POST /api/spaces-editor/[spaceId]')
