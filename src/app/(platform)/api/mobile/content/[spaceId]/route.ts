/**
 * Mobile Content API - Get Complete App Schema
 * 
 * GET /api/mobile/content/:spaceId
 * 
 * Returns the complete mobile app schema including:
 * - All pages with components
 * - Navigation configuration
 * - Theme configuration
 * - Data bindings
 * - API configuration
 * 
 * This endpoint follows AEM-like content delivery patterns for mobile apps.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { convertToMobileApp } from '@/lib/mobile-content-converter'
import { MOBILE_SCHEMA_VERSION } from '@/lib/mobile-content-schema'
import { loadBrandingConfig } from '@/lib/branding'

// Cache control headers for mobile content
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  'Vary': 'Accept-Encoding',
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const version = searchParams.get('version') // For content versioning
    const platform = searchParams.get('platform') // ios, android, web
    const includeAssets = searchParams.get('includeAssets') === 'true'
    
    // Get spaces editor config
    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Space configuration not found' },
        { status: 404 }
      )
    }

    // Get branding config for theme
    let branding = null
    try {
      branding = await loadBrandingConfig()
    } catch (error) {
      console.warn('[Mobile Content] Could not load branding config:', error)
    }

    // Build base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Convert to mobile app schema
    const mobileApp = convertToMobileApp(config, branding || undefined, {
      appId: `app-${spaceId}`,
      appName: config.sidebarConfig?.items?.[0]?.name || 'Mobile App',
      appVersion: config.version || '1.0.0',
      baseUrl,
      organizationId: undefined, // Could be extracted from session if needed
    })

    // Add platform-specific configurations
    if (platform === 'ios') {
      mobileApp.features = {
        ...mobileApp.features,
        hapticFeedback: true,
        faceId: true,
      }
    } else if (platform === 'android') {
      mobileApp.features = {
        ...mobileApp.features,
        materialDesign: true,
        fingerprint: true,
      }
    }

    // Prepare response with metadata
    const response = {
      success: true,
      schemaVersion: MOBILE_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      spaceId,
      platform: platform || 'all',
      app: mobileApp,
      _links: {
        self: `/api/mobile/content/${spaceId}`,
        pages: `/api/mobile/content/${spaceId}/pages`,
        manifest: `/api/mobile/content/${spaceId}/manifest`,
        assets: `/api/mobile/content/${spaceId}/assets`,
      },
    }

    return NextResponse.json(response, {
      headers: CACHE_HEADERS,
    })
  } catch (error) {
    console.error('[Mobile Content API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch mobile content',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * HEAD request for cache validation
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

    // Return last modified header for cache validation
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...CACHE_HEADERS,
        'Last-Modified': config.updatedAt || new Date().toISOString(),
        'ETag': `"${config.version || '1.0.0'}-${config.updatedAt}"`,
      },
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
