import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const includeAssets = searchParams.get('includeAssets') === 'true'

  const where: any = {
    deletedAt: null,
  }

  if (category) {
    where.category = category
  }

  const assetTypes = await prisma.assetType.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: includeAssets
      ? {
        assets: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      }
      : undefined,
  })

  return NextResponse.json(assetTypes)
}













export const GET = withErrorHandling(getHandler, 'GET /api/admin/assets/types')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, description, category, sortOrder, metadata } = body

    if (!code || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const assetType = await prisma.assetType.create({
      data: {
        code,
        name,
        description,
        category,
        sortOrder: sortOrder || 0,
        metadata: metadata || {},
      },
    })

    return NextResponse.json(assetType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create asset type' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/assets/types')









