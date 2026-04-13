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
  const isActive = searchParams.get('isActive')

  const where: any = {}
  if (isActive !== null) {
    where.isActive = isActive === 'true'
  }

  const languages = await prisma.language.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
  })

  return NextResponse.json(languages)
}













export const GET = withErrorHandling(getHandler, 'GET /api/admin/assets/languages')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, nativeName, flag, isActive, isDefault, sortOrder } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: code and name' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const language = await prisma.language.create({
      data: {
        code,
        name,
        nativeName: nativeName || name,
        flag,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(language)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create language' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/assets/languages')









