import { NextRequest, NextResponse } from 'next/server';
import { validateDomain } from '@/lib/chatbot-helper';

// CORS headers for embed support
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Private-Network': 'true',
};

// Helper to create JSON response with CORS headers
function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

// ChatKit Session API - Creates session with OpenAI for ChatKit
// This endpoint is called by the ChatKitWrapper to get a client_secret

export async function POST(request: NextRequest) {
  console.log('🔵 ChatKit session API called')
  try {
    const body = await request.json();
    const { agentId, apiKey: providedApiKey, existing, chatbotId, spaceId, deploymentType, origin: clientOrigin, referrer, userAgent, language, timezone } = body;

    console.log('📝 Session request details:', {
      hasAgentId: !!agentId,
      agentIdPrefix: agentId?.substring(0, 10),
      hasChatbotId: !!chatbotId,
      hasProvidedApiKey: !!providedApiKey,
      hasExistingSession: !!existing
    })

    let apiKey = providedApiKey;
    let organizationId: string | undefined;
    let projectId: string | undefined;
    let maxPromptTokens: number | undefined;
    let maxCompletionTokens: number | undefined;
    let truncationStrategy: any | undefined;

    // If API key is missing but we have chatbotId, fetch it from DB
    if (!apiKey && chatbotId) {
      console.log('🔍 Fetching API key from database for chatbot:', chatbotId)
      try {
        // Import db dynamically to avoid build cycle issues if any
        const { db } = await import('@/lib/db');
        const { mergeVersionConfig } = await import('@/lib/chatbot-helper');

        const chatbot = await db.chatbot.findUnique({
          where: { id: chatbotId },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        });

        if (chatbot) {
          const config = mergeVersionConfig(chatbot);

          // SECURITY: Domain Whitelisting
          const domainValidation = validateDomain(config, request)
          if (!domainValidation.allowed) {
            console.warn(`[Session API] ${domainValidation.error}`)
            return jsonResponse(
              { error: 'Domain not allowed', details: domainValidation.error },
              403
            )
          }

          // Check if chatbot is enabled (default to true if not set)
          const chatbotEnabled = config.chatbotEnabled !== false
          if (!chatbotEnabled) {
            console.log(`[Session API] Chatbot ${chatbotId} is disabled`)
            return jsonResponse(
              { error: 'Chatbot is disabled', disabled: true },
              403
            )
          }

          // Determine which key to use and optional IDs
          const isAgentSDK = config.engineType === 'openai-agent-sdk';
          apiKey = isAgentSDK ? config.openaiAgentSdkApiKey : config.chatkitApiKey;
          organizationId = isAgentSDK ? config.openaiAgentSdkOrganizationId : config.openaiChatkitOrganizationId;
          projectId = isAgentSDK ? config.openaiAgentSdkProjectId : config.openaiChatkitProjectId;
          maxPromptTokens = config.openaiAgentSdkMaxPromptTokens;
          maxCompletionTokens = config.openaiAgentSdkMaxCompletionTokens;
          truncationStrategy = config.openaiAgentSdkTruncationStrategy;

          console.log('✅ Retrieved API configuration from database', {
            engineType: config.engineType,
            hasKey: !!apiKey,
            hasOrgId: !!organizationId,
            hasProjectId: !!projectId
          })
        } else {
          console.warn('⚠️ Chatbot not found in database:', chatbotId)
        }
      } catch (dbError) {
        console.error('❌ Error fetching API configuration from DB:', dbError);
        // Continue to see if we can fail gracefully or if apiKey was optional
      }
    }

    if (!agentId) {
      console.error('❌ Missing agentId in request')
      return jsonResponse({ error: 'Missing agentId' }, 400);
    }

    if (!apiKey) {
      console.error('❌ Missing API key')
      return jsonResponse(
        { error: 'Missing API key', details: 'No OpenAI API key provided or found for this chatbot' },
        400
      );
    }

    // Call OpenAI's ChatKit Sessions API to create a session
    // API requires: user (string), workflow.id (string)
    // See: https://platform.openai.com/docs/api-reference/chatkit/sessions
    const openaiUrl = 'https://api.openai.com/v1/chatkit/sessions';

    // Build session payload for ChatKit
    // Generate a unique user ID for the session (could be enhanced with real user IDs)
    const userId = body.userId || `user_${chatbotId}_${Date.now()}`;

    // Build metadata for tracking — only include non-empty string values
    // OpenAI metadata: keys ≤ 64 chars, values ≤ 512 chars, max 16 pairs
    const requestOrigin = clientOrigin || request.headers.get('origin') || request.headers.get('referer') || ''

    // Extract real client IP from proxy headers (server-side, cannot be set by client JS)
    const ip =
      request.headers.get('cf-connecting-ip') ||        // Cloudflare
      request.headers.get('x-real-ip') ||               // Nginx proxy
      (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || // Load balancer chain
      undefined

    const rawMetadata: Record<string, string | undefined> = {
      chatbot_id: chatbotId,
      space_id: spaceId,
      deployment_type: deploymentType,
      origin: requestOrigin,
      referrer: referrer || undefined,
      ip,
      user_agent: userAgent ? String(userAgent).substring(0, 512) : undefined,
      language,
      timezone,
      platform: 'mdm',
    }
    const metadata: Record<string, string> = Object.fromEntries(
      Object.entries(rawMetadata).filter((entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1].length > 0
      )
    )

    const sessionPayload: any = {
      user: userId,
      workflow: {
        id: agentId,
      },
      metadata,
      max_prompt_tokens: maxPromptTokens || undefined,
      max_completion_tokens: maxCompletionTokens || undefined,
      truncation_strategy: truncationStrategy || undefined,
    };

    // If refreshing an existing session, include session info
    if (existing && existing.session_id) {
      sessionPayload.session_id = existing.session_id;
      console.log('🔄 Refreshing session:', existing.session_id)
    }

    console.log('🌐 Calling OpenAI ChatKit API:', {
      url: openaiUrl,
      userId,
      workflowId: agentId?.substring(0, 20) + '...',
      isRefresh: !!existing,
      metadata
    })

    const headers: any = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'chatkit_beta=v1',
    };

    if (organizationId) {
      headers['OpenAI-Organization'] = organizationId;
    }

    if (projectId) {
      headers['OpenAI-Project'] = projectId;
    }

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(sessionPayload),
    });

    console.log('📡 OpenAI API response status:', response.status, response.statusText)

    if (!response.ok) {
      if (response.status === 404 && existing) {
        return jsonResponse(
          { error: 'session_expired', details: 'The ChatKit session has expired or was not found.' },
          404
        );
      }

      const errorText = await response.text();
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }

      console.error('❌ OpenAI session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetails
      });

      return jsonResponse(
        {
          error: 'Failed to create OpenAI session',
          details: errorDetails.error?.message || errorDetails.raw || response.statusText
        },
        response.status
      );
    }

    const sessionData = await response.json();
    console.log('✅ Session created successfully:', {
      session_id: sessionData.id,
      has_client_secret: !!sessionData.client_secret,
      expires_at: sessionData.expires_at
    })

    // Return the client_secret to the frontend
    return jsonResponse({
      client_secret: sessionData.client_secret?.value || sessionData.client_secret,
      session_id: sessionData.id,
      expires_at: sessionData.expires_at
    });

  } catch (error) {
    console.error('❌ ChatKit session error:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Keep GET for backwards compatibility
export async function GET() {
  return jsonResponse(
    { error: 'Use POST method with agentId and apiKey in body' },
    405
  );
}
