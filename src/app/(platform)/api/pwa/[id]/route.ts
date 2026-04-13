import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Public route for embedding
  const { id } = await params

  const pwa = await db.websitePWA.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  if (!pwa) {
    return NextResponse.json({ error: 'PWA not found' }, { status: 404 })
  }

  // Add CORS headers manually if needed, or rely on middleware
  return NextResponse.json({ pwa }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60'
    }
  })
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response

  const { id } = await params
  const body = await request.json()

  try {
    const pwa = await db.websitePWA.update({
      where: { id },
      data: {
        ...body,
        // Ensure sensitive fields or immutable ones aren't overwritten blindly if needed
        updatedAt: new Date()
      }
    })
    return NextResponse.json({ pwa })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update PWA' }, { status: 500 })
  }
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response

  const { id } = await params

  try {
    await db.websitePWA.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
    // Or hard delete: await db.websitePWA.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete PWA' }, { status: 500 })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/pwa/[id]')
export const PATCH = withErrorHandling(patchHandler, 'PATCH /api/pwa/[id]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/pwa/[id]')
