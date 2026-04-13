import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

/**
 * GET /api/admin/menu/items
 * Fetch all menu items (flat list, for admin management)
 */
async function getHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    try {
        const { searchParams } = new URL(request.url)
        const groupSlug = searchParams.get('group')

        const where: any = {}
        if (groupSlug) {
            const group = await db.menuGroup.findUnique({ where: { slug: groupSlug } })
            if (group) {
                where.groupId = group.id
            }
        }

        const items = await db.menuItem.findMany({
            where,
            orderBy: [{ groupId: 'asc' }, { priority: 'asc' }],
            include: {
                group: { select: { slug: true, name: true } }
            }
        })

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Error fetching menu items:', error)
        return NextResponse.json(
            { error: 'Failed to fetch menu items' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/menu/items
 * Create a new menu item
 */
async function postHandler(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    try {
        const body = await request.json()
        const { groupSlug, slug, name, icon, href, section, priority } = body

        if (!groupSlug || !slug || !name || !icon || !href) {
            return NextResponse.json(
                { error: 'Missing required fields: groupSlug, slug, name, icon, href' },
                { status: 400 }
            )
        }

        const group = await db.menuGroup.findUnique({ where: { slug: groupSlug } })
        if (!group) {
            return NextResponse.json(
                { error: `Group "${groupSlug}" not found` },
                { status: 404 }
            )
        }

        const item = await db.menuItem.create({
            data: {
                groupId: group.id,
                slug,
                name,
                icon,
                href,
                section: section || null,
                priority: priority || 100,
                isBuiltin: false,
                isVisible: true,
            },
        })

        return NextResponse.json({ item }, { status: 201 })
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json(
                { error: 'Menu item with this slug already exists' },
                { status: 409 }
            )
        }
        console.error('Error creating menu item:', error)
        return NextResponse.json(
            { error: 'Failed to create menu item' },
            { status: 500 }
        )
    }
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/menu/items')
export const POST = withErrorHandling(postHandler, 'POST /api/admin/menu/items')
