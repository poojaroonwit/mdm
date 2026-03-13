import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedScript } from './scriptGenerator'
import { db } from '@/lib/db'
import { mergeVersionConfig } from '@/lib/chatbot-helper'
import { buildChatKitTheme } from '../[id]/components/chatkit/configBuilder'
import { getWidgetConfig } from '../[id]/utils/widgetConfigHelper'
import { getContainerStyle, getPopoverPositionStyle } from '../[id]/utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('id')
  const type = searchParams.get('type') || 'popover'

  if (!chatbotId) {
    return new NextResponse("Missing chatbot ID", { status: 400 })
  }

  // Fetch chatbot config from DB
  const chatbotRaw = await db.chatbot.findFirst({
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

  // If not found, retun 404 or a script that logs error
  if (!chatbotRaw) {
    return new NextResponse(`console.error("Chatbot not found: ${chatbotId}");`, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }

  const chatbot = mergeVersionConfig(chatbotRaw as any)

  // Check if chatbot is enabled (default to true if not set)
  const chatbotEnabled = chatbot.chatbotEnabled !== false
  if (!chatbotEnabled) {
    return new NextResponse(`/* Chatbot is disabled */`, {
      headers: { 
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    })
  }

  // Generate Emulated Config using shared logic
  // 1. Theme
  const chatKitTheme = buildChatKitTheme(chatbot)

  const serverOrigin = request.nextUrl.origin

  // 2. Widget Config (Shared Logic)
  // Pass serverOrigin so relative / internal-hostname URLs in the config are resolved
  // to an absolute public URL before being embedded in the script.
  const widgetConfig = getWidgetConfig(chatbot, chatKitTheme, serverOrigin)

  // 3. Container Style (unused in script now, but good for reference if needed, or remove)
  // const containerStyle = getContainerStyle(chatbot, 'popover', {}, false) 

  // 3. Widget Button Style
  // Logic from ChatWidgetButton.tsx (we need to replicate this logic or move it to a shared helper)
  // Since ChatWidgetButton is a React component, we can't import it.
  // We will pass the chatbot object to the script generator which will use a new "Shared Logic" approach
  // OR we pre-calculate the styles here.

  // Actually, to "use like emulator", we should let scriptGenerator use the chatbot object
  // but we can pre-calculate complex things like the theme.

  // Pass the FULL processed chatbot object + pre-calculated theme to the generator
  // The generator will embed this as JSON
  const script = generateEmbedScript(chatbotId, type, serverOrigin, chatbot, chatKitTheme, widgetConfig)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=60', // Reduce cache time since we are baking in config
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}
