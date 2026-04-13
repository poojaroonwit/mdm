import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * PUT /api/admin/menu/items/[id]
 * Update a menu item
 */
async function putHandler(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    try {
        const { id } = await params
        const body = await request.json()
        const { name, icon, href, section, priority, isVisible } = body

        const item = await db.menuItem.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(icon !== undefined && { icon }),
                ...(href !== undefined && { href }),
                ...(section !== undefined && { section }),
                ...(priority !== undefined && { priority }),
                ...(isVisible !== undefined && { isVisible }),
            },
        })

        return NextResponse.json({ item })
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
        }
        console.error('Error updating menu item:', error)
        return NextResponse.json(
            { error: 'Failed to update menu item' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/menu/items/[id]
 * Delete a menu item
 */
async function deleteHandler(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) return authResult.response

    try {
        const { id } = await params

        // Check if it's a built-in item
        const existing = await db.menuItem.findUnique({ where: { id } })
        if (existing?.isBuiltin) {
            return NextResponse.json(
                { error: 'Cannot delete built-in menu items' },
                { status: 403 }
            )
        }

        await db.menuItem.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
        }
        console.error('Error deleting menu item:', error)
        return NextResponse.json(
            { error: 'Failed to delete menu item' },
            { status: 500 }
        )
    }
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/admin/menu/items/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/admin/menu/items/[id]')
