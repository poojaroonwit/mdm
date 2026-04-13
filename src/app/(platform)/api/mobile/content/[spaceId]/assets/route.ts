/**
 * Mobile Content API - Assets Manifest
 * 
 * GET /api/mobile/content/:spaceId/assets
 * 
 * Returns asset references (images, icons, fonts) that the mobile app
 * should preload or cache for offline use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { loadBrandingConfig } from '@/lib/branding'

// Cache headers
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'Vary': 'Accept-Encoding',
}

interface AssetInfo {
  id: string
  type: 'image' | 'icon' | 'font' | 'video' | 'audio'
  url: string
  alt?: string
  width?: number
  height?: number
  mimeType?: string
  size?: number
  priority: 'high' | 'medium' | 'low'
  preload: boolean
}

/**
 * Extract assets from page components
 */
function extractAssetsFromComponents(components: any[], baseUrl: string): AssetInfo[] {
  const assets: AssetInfo[] = []
  
  function processComponent(component: any, depth: number = 0) {
    if (!component) return
    
    // Check for image sources
    if (component.type === 'image' || component.config?.type === 'image') {
      const src = component.config?.src || component.config?.imageUrl || component.props?.source
      if (src) {
        assets.push({
          id: `asset-${component.id}`,
          type: 'image',
          url: src.startsWith('/') ? `${baseUrl}${src}` : src,
          alt: component.config?.alt || component.props?.alt,
          width: component.config?.width || component.width,
          height: component.config?.height || component.height,
          priority: depth < 2 ? 'high' : 'medium',
          preload: depth < 2,
        })
      }
    }
    
    // Check for icon sources
    if (component.type === 'icon' || component.config?.icon) {
      const icon = component.config?.icon || component.props?.icon
      if (icon && icon.startsWith('http')) {
        assets.push({
          id: `icon-${component.id}`,
          type: 'icon',
          url: icon,
          priority: 'low',
          preload: false,
        })
      }
    }
    
    // Check for video/audio
    if (component.type === 'video' && component.config?.src) {
      assets.push({
        id: `video-${component.id}`,
        type: 'video',
        url: component.config.src.startsWith('/') ? `${baseUrl}${component.config.src}` : component.config.src,
        priority: 'low',
        preload: false,
      })
    }
    
    if (component.type === 'audio' && component.config?.src) {
      assets.push({
        id: `audio-${component.id}`,
        type: 'audio',
        url: component.config.src.startsWith('/') ? `${baseUrl}${component.config.src}` : component.config.src,
        priority: 'low',
        preload: false,
      })
    }
    
    // Process children
    if (component.children && Array.isArray(component.children)) {
      component.children.forEach((child: any) => processComponent(child, depth + 1))
    }
  }
  
  components.forEach(comp => processComponent(comp))
  
  return assets
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
    const type = searchParams.get('type') // 'image', 'icon', 'font', etc.
    const preloadOnly = searchParams.get('preloadOnly') === 'true'
    const priority = searchParams.get('priority') // 'high', 'medium', 'low'
    
    // Get spaces editor config
    const config = await SpacesEditorManager.getSpacesEditorConfig(spaceId)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Space configuration not found' },
        { status: 404 }
      )
    }

    // Build base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Collect assets from all pages
    let allAssets: AssetInfo[] = []
    
    for (const page of config.pages || []) {
      if (page.components) {
        const pageAssets = extractAssetsFromComponents(page.components, baseUrl)
        allAssets.push(...pageAssets)
      }
    }

    // Get branding assets
    try {
      const branding = await loadBrandingConfig()
      if (branding) {
        // App logo
        if (branding.applicationLogo) {
          allAssets.push({
            id: 'app-logo',
            type: 'image',
            url: branding.applicationLogo.startsWith('/') 
              ? `${baseUrl}${branding.applicationLogo}` 
              : branding.applicationLogo,
            alt: branding.applicationName || 'App Logo',
            priority: 'high',
            preload: true,
          })
        }
        
        // Login background image
        if (branding.loginBackground?.type === 'image' && branding.loginBackground.image) {
          allAssets.push({
            id: 'login-background',
            type: 'image',
            url: branding.loginBackground.image.startsWith('/') 
              ? `${baseUrl}${branding.loginBackground.image}` 
              : branding.loginBackground.image,
            priority: 'medium',
            preload: false,
          })
        }
      }
    } catch (error) {
      // Ignore branding errors
    }

    // Login page assets
    if (config.loginPageConfig) {
      if (config.loginPageConfig.backgroundType === 'image' && config.loginPageConfig.backgroundImage) {
        allAssets.push({
          id: 'login-bg-image',
          type: 'image',
          url: config.loginPageConfig.backgroundImage.startsWith('/') 
            ? `${baseUrl}${config.loginPageConfig.backgroundImage}` 
            : config.loginPageConfig.backgroundImage,
          priority: 'medium',
          preload: false,
        })
      }
      
      if (config.loginPageConfig.logoUrl) {
        allAssets.push({
          id: 'login-logo',
          type: 'image',
          url: config.loginPageConfig.logoUrl.startsWith('/') 
            ? `${baseUrl}${config.loginPageConfig.logoUrl}` 
            : config.loginPageConfig.logoUrl,
          priority: 'high',
          preload: true,
        })
      }
    }

    // Deduplicate by URL
    const uniqueAssets = allAssets.reduce((acc, asset) => {
      const existing = acc.find(a => a.url === asset.url)
      if (!existing) {
        acc.push(asset)
      } else if (asset.priority === 'high' && existing.priority !== 'high') {
        // Upgrade priority if we find a higher priority reference
        existing.priority = 'high'
        existing.preload = true
      }
      return acc
    }, [] as AssetInfo[])

    // Apply filters
    let filteredAssets = uniqueAssets
    
    if (type) {
      filteredAssets = filteredAssets.filter(a => a.type === type)
    }
    
    if (preloadOnly) {
      filteredAssets = filteredAssets.filter(a => a.preload)
    }
    
    if (priority) {
      filteredAssets = filteredAssets.filter(a => a.priority === priority)
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    filteredAssets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    // Calculate totals
    const summary = {
      total: filteredAssets.length,
      byType: {
        image: filteredAssets.filter(a => a.type === 'image').length,
        icon: filteredAssets.filter(a => a.type === 'icon').length,
        font: filteredAssets.filter(a => a.type === 'font').length,
        video: filteredAssets.filter(a => a.type === 'video').length,
        audio: filteredAssets.filter(a => a.type === 'audio').length,
      },
      preloadCount: filteredAssets.filter(a => a.preload).length,
    }

    const response = {
      success: true,
      spaceId,
      generatedAt: new Date().toISOString(),
      summary,
      assets: filteredAssets,
      _links: {
        self: `/api/mobile/content/${spaceId}/assets`,
        content: `/api/mobile/content/${spaceId}`,
        manifest: `/api/mobile/content/${spaceId}/manifest`,
      },
    }

    return NextResponse.json(response, {
      headers: CACHE_HEADERS,
    })
  } catch (error) {
    console.error('[Mobile Assets API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch assets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
