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
  const languageCode = searchParams.get('languageCode')
  const languageId = searchParams.get('languageId')
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  const where: any = {}

  if (languageCode) {
    const language = await prisma.language.findUnique({
      where: { code: languageCode },
    })
    if (language) {
      where.languageId = language.id
    }
  } else if (languageId) {
    where.languageId = languageId
  }

  if (entityType) {
    where.entityType = entityType
  }

  if (entityId) {
    where.entityId = entityId
  }

  const localizations = await prisma.localization.findMany({
    where,
    include: {
      language: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(localizations)
}













export const GET = withErrorHandling(getHandler, 'GET /api/admin/assets/localizations')

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { languageCode, languageId, entityType, entityId, field, value } = body

    if (!entityType || !entityId || !field || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let finalLanguageId = languageId
    if (languageCode && !finalLanguageId) {
      const language = await prisma.language.findUnique({
        where: { code: languageCode },
      })
      if (!language) {
        return NextResponse.json(
          { error: 'Language not found' },
          { status: 404 }
        )
      }
      finalLanguageId = language.id
    }

    if (!finalLanguageId) {
      return NextResponse.json(
        { error: 'Missing languageId or languageCode' },
        { status: 400 }
      )
    }

    const localization = await prisma.localization.upsert({
      where: {
        languageId_entityType_entityId_field: {
          languageId: finalLanguageId,
          entityType,
          entityId,
          field,
        },
      },
      update: {
        value,
      },
      create: {
        languageId: finalLanguageId,
        entityType,
        entityId,
        field,
        value,
      },
      include: {
        language: true,
      },
    })

    return NextResponse.json(localization)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create localization' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/assets/localizations')









