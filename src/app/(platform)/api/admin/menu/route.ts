import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'


/**
 * GET /api/admin/menu
 * Fetch all menu groups with their items
 */
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    try {

        const groups = await db.menuGroup.findMany({
            where: { isVisible: true },
            orderBy: { priority: 'asc' },
            include: {
                items: {
                    where: {
                        isVisible: true,
                        slug: { notIn: ['themes', 'integrations', 'api', 'performance'] }
                    },
                    orderBy: { priority: 'asc' },
                },
            },
        })

        // Transform to match frontend expectations
        const menuConfig = groups.map(group => ({
            id: group.id,
            slug: group.slug,
            name: group.name,
            icon: group.icon,
            priority: group.priority,
            items: group.items.map(item => ({
                id: item.id,
                slug: item.slug,
                name: item.name,
                icon: item.icon,
                href: item.href,
                section: item.section,
                priority: item.priority,
                isBuiltin: item.isBuiltin,
                sourcePluginId: item.sourcePluginId,
                requiredRoles: item.requiredRoles || [],
            })),
        }))

        return NextResponse.json({ menuConfig })
    } catch (error) {
        console.error('Error fetching menu config:', error)
        return NextResponse.json(
            { error: 'Failed to fetch menu configuration' },
            { status: 500 }
        )
    }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/menu')
