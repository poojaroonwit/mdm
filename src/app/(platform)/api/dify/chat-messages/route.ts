import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limiter'
import { mergeVersionConfig, validateDomain } from '@/lib/chatbot-helper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { apiBaseUrl, apiKey, requestBody, chatbotId } = body

    // Server-side Lookup for Dify Config
    if (chatbotId && (!apiBaseUrl || !apiKey)) {
      try {
        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } }
        })
        if (chatbot) {
          const config = mergeVersionConfig(chatbot)

          // SECURITY: Domain Whitelisting
          const domainValidation = validateDomain(config, request)
          if (!domainValidation.allowed) {
            console.warn(`[Dify API] ${domainValidation.error}`)
            return NextResponse.json(
              { error: 'Domain not allowed', details: domainValidation.error },
              { status: 403 }
            )
          }

          // Check if chatbot is enabled (default to true if not set)
          const chatbotEnabled = config.chatbotEnabled !== false
          if (!chatbotEnabled) {
            console.log(`[Dify API] Chatbot ${chatbotId} is disabled`)
            return NextResponse.json(
              { error: 'Chatbot is disabled', disabled: true },
              { status: 403 }
            )
          }

          if (!apiKey) apiKey = config.difyApiKey
          if (!apiBaseUrl) {
            const difyOptions = config.difyOptions || {}
            apiBaseUrl = difyOptions.apiBaseUrl
          }

          // Rate Limiting Check
          try {
            // Try to get userId from requestBody (user) or use IP/anonymous
            const userId = requestBody?.user || 'anonymous'
            const rateLimitConfig = await getRateLimitConfig(chatbotId)
            if (rateLimitConfig) {
              const rateLimitResult = await checkRateLimit(chatbotId, userId, rateLimitConfig)
              if (!rateLimitResult.allowed) {
                return NextResponse.json(
                  {
                    error: 'Rate limit exceeded',
                    message: rateLimitResult.reason,
                    resetTime: rateLimitResult.resetTime
                  },
                  { status: 429 }
                )
              }
            }
          } catch (rlError) {
            console.warn('Rate limit check failed:', rlError)
          }
        }
      } catch (error) {
        console.warn('Failed to lookup Dify config:', error)
      }
    }

    if (!apiBaseUrl || !apiKey) {
      return NextResponse.json(
        { error: 'Missing apiBaseUrl or apiKey (and lookup failed)' },
        { status: 400 }
      )
    }

    // Clean up the base URL to avoid duplicate /v1
    let baseUrl = apiBaseUrl.replace(/\/$/, '') // Remove trailing slash
    baseUrl = baseUrl.replace(/\/v1$/, '') // Remove /v1 if present
    const apiUrl = `${baseUrl}/v1/chat-messages`

    // Forward the request to Dify API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // Check if response is streaming
    const contentType = response.headers.get('content-type')
    const isStreaming = contentType?.includes('text/event-stream') || contentType?.includes('text/plain')

    if (isStreaming && response.body) {
      // Return streaming response - proxy the stream directly
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      })
    } else {
      // Return JSON response
      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          return NextResponse.json(errorData, { status: response.status })
        } catch {
          return NextResponse.json(
            { error: errorText || 'Dify API request failed' },
            { status: response.status }
          )
        }
      }
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    console.error('Dify proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to proxy request to Dify API' },
      { status: 500 }
    )
  }
}
