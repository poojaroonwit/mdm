import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mergeVersionConfig, sanitizeChatbotConfig, validateDomain } from '@/lib/chatbot-helper'
// import { renderToStaticMarkup } from 'react-dom/server'
import * as Icons from 'lucide-react'
import React from 'react'
import { buildEmbedScript } from './embed-script'

export async function GET(request: NextRequest) {
  // Dynamically import renderToStaticMarkup to avoid build errors with Next.js Edge/Server boundary checks
  const { renderToStaticMarkup } = await import('react-dom/server')

  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('id')
  const type = searchParams.get('type') || 'popover'

  if (!chatbotId) {
    return new NextResponse("Missing chatbot ID", { status: 400 })
  }

  try {
    // Fetch chatbot configuration server-side (including versions for merged config)
    const rawChatbot = await db.chatbot.findFirst({
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

    if (!rawChatbot) {
      return new NextResponse("Chatbot not found", { status: 404 })
    }

    // Merge version config into chatbot object (this includes chatkitOptions, widgetBackgroundColor, etc.)
    const chatbot = await sanitizeChatbotConfig(mergeVersionConfig(rawChatbot))

    // Generate Icon SVG if needed
    let iconSvg = ''
    if (chatbot.avatarType !== 'image') {
      const IconName = (chatbot.avatarIcon || 'Bot') as keyof typeof Icons
      // @ts-ignore - Dynamic access to icons
      const IconComponent = Icons[IconName] || Icons.Bot
      const iconColor = chatbot.avatarIconColor || '#ffffff'
      // Render SVG with white color (or configured color) as it usually appears on a colored button
      // forcing white for the button icon usually looks best on colored backgrounds, 
      // but ChatPage uses avatarIconColor. We'll use the configured color.
      iconSvg = renderToStaticMarkup(React.createElement(IconComponent as any, {
        size: 24,
        color: iconColor,
        strokeWidth: 2
      }))
    }

    // Render Close Icon (X) server-side to match emulator style
    const closeIconColor = chatbot.avatarIconColor || '#ffffff'
    const closeIconSvg = renderToStaticMarkup(React.createElement(Icons.X, {
      size: 24,
      color: closeIconColor,
      strokeWidth: 2
    }))

    // SECURITY: Domain Whitelisting
    const domainValidation = validateDomain(chatbot, request)
    if (!domainValidation.allowed) {
      console.warn(`[Embed API] ${domainValidation.error}`)
      return new NextResponse(`console.error("[Chatbot Error] ${domainValidation.error}");`, {
        headers: { 'Content-Type': 'application/javascript' }
      })
    }

    // Check if chatbot is enabled (default to true if not set)
    const chatbotEnabled = chatbot.chatbotEnabled !== false
    if (!chatbotEnabled) {
      console.log(`[Embed API] Chatbot ${chatbotId} is disabled`)
      // Return an empty script that does nothing
      return new NextResponse(`/* Chatbot is disabled */`, {
        headers: { 
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, max-age=0',
        }
      })
    }

    // Get the origin from the request (this is the MDM server origin)
    const serverOrigin = request.nextUrl.origin

    const script = buildEmbedScript({
      chatbot,
      chatbotId,
      closeIconSvg,
      iconSvg,
      serverOrigin,
      type
    })

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Private-Network': 'true',
      },
    })
  } catch (error) {
    console.error('Error generating embed script:', error)
    return new NextResponse(`console.error("[Embed API Error] Server failed to generate script:", ${JSON.stringify(error instanceof Error ? error.message : String(error))});`, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true',
      }
    })
  }
}
