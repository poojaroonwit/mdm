import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/chat/[chatbotId]/manifest.json
 * 
 * Returns a dynamic PWA manifest for the chatbot.
 * Used when users install the chat as a standalone PWA.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params

    // Fetch chatbot configuration
    // Fetch chatbot configuration directly from DB
    const chatbotData = await db.chatbot.findFirst({
      where: { 
        id: chatbotId,
        deletedAt: null 
      },
      include: {
        versions: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    let chatbot: any = null
    if (chatbotData) {
      // Import helper to merge version config (similar to embed route)
      // We need to dynamically import or duplicate logic if not importable
      const { mergeVersionConfig, sanitizeChatbotConfig } = await import('@/lib/chatbot-helper')
      chatbot = await sanitizeChatbotConfig(mergeVersionConfig(chatbotData))
    }

    // Default values
    const defaultName = 'Chat Assistant'
    const defaultShortName = 'Chat'
    const defaultDescription = 'AI Chat Assistant'
    const defaultThemeColor = '#1e40af'
    const defaultBackgroundColor = '#ffffff'
    const defaultDisplayMode = 'standalone'

    // Build manifest with chatbot-specific values or defaults
    const manifest = {
      name: chatbot?.pwaAppName || chatbot?.name || defaultName,
      short_name: chatbot?.pwaShortName || chatbot?.name?.split(' ')[0] || defaultShortName,
      description: chatbot?.pwaDescription || chatbot?.description || defaultDescription,
      start_url: `/chat/${chatbotId}?pwa=1&source=pwa`,
      scope: `/chat/${chatbotId}`,
      display: chatbot?.pwaDisplayMode || defaultDisplayMode,
      orientation: 'portrait-primary',
      theme_color: chatbot?.pwaThemeColor || chatbot?.primaryColor || defaultThemeColor,
      background_color: chatbot?.pwaBackgroundColor || defaultBackgroundColor,
      icons: generateIcons(chatbot?.pwaIconUrl || chatbot?.logo, chatbot?.pwaIconSize),
      categories: ['utilities', 'productivity'],
      lang: 'en',
      dir: 'ltr',
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating PWA manifest:', error)

    // Return a basic manifest on error
    const { chatbotId } = await params
    return NextResponse.json({
      name: 'Chat Assistant',
      short_name: 'Chat',
      start_url: `/chat/${chatbotId}`,
      display: 'standalone',
      theme_color: '#1e40af',
      background_color: '#ffffff',
      icons: [],
    }, {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    })
  }
}

/**
 * Generate PWA icons array from a source icon URL
 * Returns multiple sizes for different device requirements
 */
function generateIcons(iconUrl: string | null | undefined, customSize?: number) {
  if (!iconUrl) {
    // Return default placeholder icons
    return [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ]
  }

  // Standard sizes
  const sizes = [48, 72, 96, 128, 144, 192, 256, 384, 512]

  // Create base icons list
  const icons = sizes.map(size => ({
    src: iconUrl,
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: size >= 192 ? 'any maskable' : 'any',
  }))

  // Add custom size if provided and not already in the list
  if (customSize && customSize > 0 && !sizes.includes(customSize)) {
    icons.push({
      src: iconUrl,
      sizes: `${customSize}x${customSize}`,
      type: 'image/png',
      purpose: 'any maskable',
    })
  }

  return icons
}
