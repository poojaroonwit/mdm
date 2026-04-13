import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    const where: any = {
      deletedAt: null,
    }

    if (spaceId && spaceId !== 'all') {
      where.spaceId = spaceId
    }

    const notebooks = await db.notebook.findMany({
      where,
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ notebooks })
  } catch (error) {
    console.error('Error fetching notebooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebooks' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/notebooks',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { name, description, spaceId, tags = [], isPublic = false } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Notebook name is required' },
        { status: 400 },
      )
    }

    if (spaceId && spaceId !== 'all') {
      const spaceMember = await db.spaceMember.findFirst({
        where: {
          spaceId: spaceId,
          userId: session.user.id,
        },
      })

      if (!spaceMember) {
        return NextResponse.json(
          { error: 'Access denied to space' },
          { status: 403 },
        )
      }
    }

    const notebook = await db.notebook.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        content: {},
        cells: [],
        tags: tags,
        isPublic: isPublic,
        author: session.user.id,
        spaceId: spaceId && spaceId !== 'all' ? spaceId : null,
      },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ notebook }, { status: 201 })
  } catch (error) {
    console.error('Error creating notebook:', error)
    return NextResponse.json(
      { error: 'Failed to create notebook' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/notebooks',
)
