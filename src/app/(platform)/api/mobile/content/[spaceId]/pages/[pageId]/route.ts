/**
 * Mobile Content API - Get Single Page
 * 
 * GET /api/mobile/content/:spaceId/pages/:pageId
 * 
 * Returns a single page with its component schema.
 * Includes data binding configuration for dynamic content.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { convertPage } from '@/lib/mobile-content-converter'
import { MOBILE_SCHEMA_VERSION } from '@/lib/mobile-content-schema'

// Cache control headers - shorter TTL for individual pages
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
  'Vary': 'Accept-Encoding',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string; pageId: string }> }
) {
  try {
    const { spaceId, pageId } = await params
    
    // Validate parameters
    if (!spaceId || spaceId === 'undefined') {
      return NextResponse.json(
        { error: 'Space ID is required' },
        { status: 400 }
      )
    }
    
    if (!pageId || pageId === 'undefined') {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const includeChildren = searchParams.get('includeChildren') !== 'false'
    const expandBindings = searchParams.get('expandBindings') === 'true'
    
    // Get spaces editor config
    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Space configuration not found' },
        { status: 404 }
      )
    }

    // Find the page
    const internalPage = config.pages.find(p => p.id === pageId)
    
    if (!internalPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Convert to mobile schema
    const mobilePage = convertPage(internalPage)

    // Optionally strip children for lightweight response
    if (!includeChildren && mobilePage.components) {
      // Just return component metadata without full tree
      mobilePage.components = mobilePage.components.map(comp => ({
        id: comp.id,
        type: comp.type,
        name: comp.name,
        // Remove children and full props
      }))
    }

    // If expandBindings is true, resolve data binding URLs
    if (expandBindings && mobilePage.dataBindings) {
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host') || 'localhost:3000'
      const baseUrl = `${protocol}://${host}`
      
      mobilePage.dataBindings = mobilePage.dataBindings.map(binding => ({
        ...binding,
        source: binding.source.startsWith('/') 
          ? `${baseUrl}${binding.source}`
          : binding.source,
      }))
    }

    // Prepare response
    const response = {
      success: true,
      schemaVersion: MOBILE_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      spaceId,
      page: mobilePage,
      _links: {
        self: `/api/mobile/content/${spaceId}/pages/${pageId}`,
        space: `/api/mobile/content/${spaceId}`,
        allPages: `/api/mobile/content/${spaceId}/pages`,
      },
    }

    return NextResponse.json(response, {
      headers: {
        ...CACHE_HEADERS,
        'ETag': `"${pageId}-${internalPage.updatedAt}"`,
        'Last-Modified': internalPage.updatedAt,
      },
    })
  } catch (error) {
    console.error('[Mobile Page API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch page',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
