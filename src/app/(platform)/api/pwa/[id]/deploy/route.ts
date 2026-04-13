import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'

async function postHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  // 1. Get current PWA state
  const pwa = await db.websitePWA.findUnique({
    where: { id }
  })

  if (!pwa) {
    return NextResponse.json({ error: 'PWA not found' }, { status: 404 })
  }

  // 2. Create new version snapshot
  // Generate version number (simple increment or timestamp based)
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
  const newVersion = `v${timestamp}`

  const configSnapshot = {
    name: pwa.name,
    description: pwa.description,
    url: pwa.url,
    iconUrl: pwa.iconUrl,
    themeColor: pwa.themeColor,
    bgColor: pwa.bgColor,
    shortName: pwa.shortName,
    displayMode: pwa.displayMode,
    orientation: pwa.orientation,
    scope: pwa.scope,
    startUrl: pwa.startUrl,
    installMode: pwa.installMode,
    promptDelay: pwa.promptDelay
  }

  const version = await db.websitePWAVersion.create({
    data: {
      pwaId: pwa.id,
      version: newVersion,
      config: configSnapshot,
      isPublished: true,
      publishedAt: new Date(),
      createdBy: session.user.id
    }
  })

  // 3. Update PWA status
  await db.websitePWA.update({
    where: { id: pwa.id },
    data: {
      isPublished: true,
      currentVersion: newVersion
    }
  })

  return NextResponse.json({ success: true, version })
}

export const POST = withErrorHandling(postHandler, 'POST /api/pwa/[id]/deploy')
