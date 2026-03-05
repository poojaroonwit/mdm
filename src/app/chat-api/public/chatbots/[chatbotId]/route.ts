import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { mergeVersionConfig, sanitizeChatbotConfig } from '@/lib/chatbot-helper'
import { checkRateLimit } from '@/lib/rate-limiter'

// CORS headers for cross-origin embed support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Private-Network': 'true',
  'Cache-Control': 'no-store, max-age=0',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params

    const ip = request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = await checkRateLimit(chatbotId, ip, {
      enabled: true,
      maxRequestsPerMinute: 60,
      blockDuration: 60,
    })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimitResult.resetTime },
        { status: 429, headers: corsHeaders }
      )
    }

    const chatbot = await db.chatbot.findFirst({
      where: { id: chatbotId, deletedAt: null },
      include: {
        versions: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404, headers: corsHeaders })
    }

    const mergedChatbot = sanitizeChatbotConfig(mergeVersionConfig(chatbot))

    if (mergedChatbot.chatbotEnabled === false) {
      return NextResponse.json(
        { error: 'Chatbot is disabled', disabled: true },
        { status: 403, headers: corsHeaders }
      )
    }

    return NextResponse.json({ chatbot: mergedChatbot }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching chatbot config:', error)
    return NextResponse.json({ error: 'Failed to fetch chatbot' }, { status: 500, headers: corsHeaders })
  }
}
