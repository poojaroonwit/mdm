/**
 * Mobile Content API - App Manifest
 * 
 * GET /api/mobile/content/:spaceId/manifest
 * 
 * Returns a lightweight manifest for the mobile app including:
 * - Version information for cache invalidation
 * - Page list with basic metadata (no components)
 * - Theme summary
 * - Feature flags
 * 
 * Mobile apps should check this endpoint first to determine if
 * a full content sync is needed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { MOBILE_SCHEMA_VERSION } from '@/lib/mobile-content-schema'
import { loadBrandingConfig } from '@/lib/branding'
import crypto from 'crypto'

// Cache headers - short TTL for manifest checks
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
  'Vary': 'Accept-Encoding',
}

/**
 * Generate a hash of content for change detection
 */
function generateContentHash(content: any): string {
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(content))
  return hash.digest('hex').substring(0, 16)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const { spaceId } = await params

    // Validate spaceId
    if (!spaceId || spaceId === 'undefined') {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      )
    }

    // Get spaces editor config
    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)

    if (!config) {
      return NextResponse.json(
        { error: 'Space configuration not found' },
        { status: 404 }
      )
    }

    // Get branding for theme info
    let branding = null
    try {
      branding = await loadBrandingConfig()
    } catch (error) {
      // Ignore branding errors
    }

    // Build page index (lightweight)
    const pageIndex = (config.pages || []).map(page => ({
      id: page.id,
      name: page.name,
      displayName: page.displayName,
      path: page.path,
      icon: page.icon,
      isActive: page.isActive !== false,
      updatedAt: page.updatedAt,
      componentCount: page.components?.length || 0,
    }))

    // Calculate content hashes for change detection
    const pagesHash = generateContentHash(config.pages)
    const sidebarHash = generateContentHash(config.sidebarConfig)
    const loginHash = generateContentHash(config.loginPageConfig)

    // Build manifest
    const manifest = {
      // Schema information
      schemaVersion: MOBILE_SCHEMA_VERSION,

      // App identification
      spaceId,
      appVersion: config.version || '1.0.0',

      // Timestamps
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      generatedAt: new Date().toISOString(),

      // Content hashes for change detection
      contentHashes: {
        pages: pagesHash,
        sidebar: sidebarHash,
        login: loginHash,
        combined: generateContentHash({ pagesHash, sidebarHash, loginHash }),
      },

      // Page index (lightweight list)
      pages: {
        total: pageIndex.length,
        active: pageIndex.filter(p => p.isActive).length,
        items: pageIndex,
      },

      // Navigation summary
      navigation: {
        drawerItemCount: config.sidebarConfig?.items?.length || 0,
        hasLoginPage: !!config.loginPageConfig,
        initialPageId: config.postAuthRedirectPageId,
      },

      // Theme summary
      theme: {
        hasBranding: !!branding,
        primaryColor: branding?.primaryColor || '#1e40af',
        mode: 'auto', // Could be derived from branding
      },

      // Feature flags
      features: {
        offlineSupport: false,
        pushNotifications: false,
        analytics: false,
        darkMode: true,
      },

      // API endpoints
      endpoints: {
        content: `/api/mobile/content/${spaceId}`,
        pages: `/api/mobile/content/${spaceId}/pages`,
        manifest: `/api/mobile/content/${spaceId}/manifest`,
        assets: `/api/mobile/content/${spaceId}/assets`,
        data: `/api/data-records`,
        auth: `/api/auth`,
      },

      // Required client version (for forced updates)
      minimumClientVersion: '1.0.0',

      // Feature compatibility
      requiredFeatures: ['components-v1', 'navigation-v1'],
    }

    const contentHash = manifest.contentHashes.combined

    return NextResponse.json(manifest, {
      headers: {
        ...CACHE_HEADERS,
        'ETag': `"${contentHash}"`,
        'Last-Modified': config.updatedAt,
        'X-Content-Hash': contentHash,
      },
    })
  } catch (error) {
    console.error('[Mobile Manifest API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch manifest',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * HEAD request for quick change detection
 * Mobile apps can use this to check if content has changed without downloading the full manifest
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const { spaceId } = await params

    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)

    if (!config) {
      return new NextResponse(null, { status: 404 })
    }

    // Quick hash calculation
    const quickHash = generateContentHash({
      version: config.version,
      updatedAt: config.updatedAt,
      pageCount: config.pages?.length || 0,
    })

    return new NextResponse(null, {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'ETag': `"${quickHash}"`,
        'Last-Modified': config.updatedAt,
        'X-Content-Hash': quickHash,
        'X-Page-Count': String(config.pages?.length || 0),
        'X-Schema-Version': MOBILE_SCHEMA_VERSION,
      },
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
