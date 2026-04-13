import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - List available storage connections (sanitized)
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    // Return all active connections, but only non-sensitive fields
    const connections = await prisma.storageConnection.findMany({
        where: {
            isActive: true
        },
        select: {
            id: true,
            name: true,
            type: true,
            description: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    return NextResponse.json({ connections })
}

export const GET = withErrorHandling(getHandler, 'GET /api/storage/available')
