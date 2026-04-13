import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pwa = await db.websitePWA.findUnique({
      where: { id },
    })

    if (!pwa) {
      return NextResponse.json({ error: 'PWA not found' }, { status: 404 })
    }

    const icons = pwa.iconUrl ? [
        {
            src: pwa.iconUrl,
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
        },
        {
            src: pwa.iconUrl,
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
        }
    ] : []

    const manifest = {
      name: pwa.name,
      short_name: pwa.shortName || pwa.name,
      description: pwa.description,
      start_url: pwa.startUrl || '/',
      scope: pwa.scope || '/',
      display: pwa.displayMode || 'standalone',
      orientation: pwa.orientation || 'any',
      theme_color: pwa.themeColor || '#ffffff',
      background_color: pwa.bgColor || '#ffffff',
      icons: icons,
      screenshots: pwa.screenshots ? pwa.screenshots.map(src => ({
          src,
          sizes: "1080x1920", // Approximate, browser usually ignores unless strictly enforced
          type: "image/jpeg", // Assuming generic
          form_factor: "wide"
      })) : [],
      categories: pwa.categories || [],
      ...((pwa.manifestParams as any) || {}),
      // Add shortcuts if present
      shortcuts: Array.isArray(pwa.shortcuts) ? pwa.shortcuts : []
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*' // Allow fetching from any domain
      },
    })
  } catch (error) {
    console.error('Error generating PWA manifest:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
