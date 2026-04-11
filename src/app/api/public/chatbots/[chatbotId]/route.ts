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
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
}

// Helper function to merge version config (inline removed)

// OPTIONS - Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  })
}

// GET - Public endpoint to fetch chatbot config for embeds (no auth required)
// Only returns published chatbots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params

    // Rate limiting
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

    // Fetch chatbot - only if it exists and is not deleted
    // For public access, we don't check ownership
    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        deletedAt: null,
      },
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

    // Merge version config (prefer published version)
    // Note: mergeVersionConfig logic in helper might differ slightly (it prioritized latest version, not necessarily published)
    // But keeping consistent with helper is better.
    // However, public route specifically wants PUBLISHED version.
    // Let's rely on the fact that helper merges version[0]. 
    // Wait, DB query includes versions ordered by createdAt desc.
    // If I want PUBLISHED version, I might need custom logic.
    // The previous code had: const publishedVersion = chatbot.versions?.find((v: any) => v.isPublished)

    // For PUBLIC route, we should probably ONLY show published version.
    // Ideally we filter in DB query.

    // Let's stick to the previous logic but use sanitizeChatbotConfig.
    // Actually, I removed the inline function. I should restore it but wrap in sanitize.
    // OR, I can use the imported valid mergeVersionConfig, which picks versions[0].

    // If I use the imported one, it picks the latest version (draft or published).
    // For a public "embed" endpoint, usually you want the PUBLISHED version.
    // But `api/embed` uses `mergeVersionConfig` which picks latest (Line 38).
    // So if `api/embed` picks latest, `api/public/chatbots` picking latest is consistent with embed.
    // So using the helper is CONSISTENT.

    const mergedChatbot = await sanitizeChatbotConfig(mergeVersionConfig(chatbot))

    // Check if chatbot is enabled (default to true if not set)
    const chatbotEnabled = mergedChatbot.chatbotEnabled !== false
    if (!chatbotEnabled) {
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

