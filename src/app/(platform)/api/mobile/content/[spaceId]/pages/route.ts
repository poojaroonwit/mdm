/**
 * Mobile Content API - Get All Pages
 * 
 * GET /api/mobile/content/:spaceId/pages
 * 
 * Returns all pages for a space with their component schemas.
 * Supports filtering and pagination for efficient mobile data loading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { convertPage } from '@/lib/mobile-content-converter'
import { MOBILE_SCHEMA_VERSION } from '@/lib/mobile-content-schema'

// Cache control headers
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const active = searchParams.get('active') // 'true', 'false', or null for all
    const search = searchParams.get('search') // Search by name
    const ids = searchParams.get('ids') // Comma-separated page IDs
    
    // Get spaces editor config
    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Space configuration not found' },
        { status: 404 }
      )
    }

    // Filter pages
    let pages = config.pages || []
    
    // Filter by active status
    if (active === 'true') {
      pages = pages.filter(p => p.isActive !== false)
    } else if (active === 'false') {
      pages = pages.filter(p => p.isActive === false)
    }
    
    // Filter by specific IDs
    if (ids) {
      const pageIds = ids.split(',').map(id => id.trim())
      pages = pages.filter(p => pageIds.includes(p.id))
    }
    
    // Search by name
    if (search) {
      const searchLower = search.toLowerCase()
      pages = pages.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.displayName.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      )
    }

    // Calculate pagination
    const total = pages.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    // Paginate
    const paginatedPages = pages.slice(startIndex, endIndex)
    
    // Convert to mobile schema
    const mobilePages = paginatedPages.map(convertPage)

    // Prepare response with pagination metadata
    const response = {
      success: true,
      schemaVersion: MOBILE_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      spaceId,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      pages: mobilePages,
      _links: {
        self: `/api/mobile/content/${spaceId}/pages?page=${page}&limit=${limit}`,
        first: `/api/mobile/content/${spaceId}/pages?page=1&limit=${limit}`,
        last: `/api/mobile/content/${spaceId}/pages?page=${totalPages}&limit=${limit}`,
        ...(page < totalPages && {
          next: `/api/mobile/content/${spaceId}/pages?page=${page + 1}&limit=${limit}`,
        }),
        ...(page > 1 && {
          previous: `/api/mobile/content/${spaceId}/pages?page=${page - 1}&limit=${limit}`,
        }),
      },
    }

    return NextResponse.json(response, {
      headers: CACHE_HEADERS,
    })
  } catch (error) {
    console.error('[Mobile Pages API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch pages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
