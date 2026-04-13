import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId')

  const where: any = {
    deletedAt: null,
    OR: [
      { createdBy: session.user.id },
      { space: { members: { some: { userId: session.user.id } } } }
    ]
  }

  if (spaceId) {
    where.spaceId = spaceId
  }

  const pwas = await db.websitePWA.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ pwas })
}

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const {
    name,
    description,
    url,
    iconUrl,
    themeColor,
    bgColor,
    shortName,
    displayMode,
    orientation,
    scope,
    startUrl,
    installMode,
    promptDelay,
    spaceId
  } = body

  if (!name || !url) {
    return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
  }

  try {
    const pwa = await db.websitePWA.create({
      data: {
        name,
        description: description || null,
        url,
        iconUrl: iconUrl || null,
        themeColor: themeColor || '#ffffff',
        bgColor: bgColor || '#ffffff',
        shortName: shortName || null,
        displayMode: displayMode || 'standalone',
        orientation: orientation || 'any',
        scope: scope || '/',
        startUrl: startUrl || '/',
        installMode: installMode || 'browser',
        promptDelay: promptDelay || 0,
        isPublished: false,
        createdBy: session.user.id,
        spaceId: spaceId || null,
        versions: {
          create: {
            version: '0.0.1', // Initial draft version
            config: {
              name,
              description,
              url,
              iconUrl,
              themeColor,
              bgColor,
              shortName,
              displayMode,
              orientation,
              scope,
              startUrl,
              installMode,
              promptDelay
            },
            isPublished: false,
            createdBy: session.user.id
          }
        }
      },
      include: {
        versions: true
      }
    })

    return NextResponse.json({ pwa }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating PWA:', error)
    return NextResponse.json(
      { error: 'Failed to create PWA', details: error?.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/pwa')
export const POST = withErrorHandling(postHandler, 'POST /api/pwa')
