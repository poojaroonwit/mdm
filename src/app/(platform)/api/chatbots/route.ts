import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { mergeVersionConfig } from '@/lib/chatbot-helper'
import { requireSpaceAccess } from '@/lib/space-access'
import { checkRateLimit } from '@/lib/rate-limiter'
import { getAccessibleSpaceIds } from '@/lib/chatbot-access'
import {
  assignResourceFolder,
  getFolderState,
  resolveFolderSpaceId,
} from '@/lib/folder-state'
import { buildChatbotVersionConfig, syncOpenAIApiKey } from './chatbot-route-helpers'

export const dynamic = 'force-dynamic'

const prisma = db

// Helper function to sync OpenAI API key to global provider config

// Helper function to sync OpenAI API key to global provider config
// (Inline mergeVersionConfig removed)

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Rate limiting for listing chatbots
  const rateLimitResult = await checkRateLimit('list-chatbots', session.user.id, {
    enabled: true,
    maxRequestsPerMinute: 120,
    blockDuration: 60,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(request.url)
  const requestedSpaceId = searchParams.get('spaceId') || searchParams.get('space_id')
  const isPublished = searchParams.get('isPublished')
  const normalizedSpaceId = requestedSpaceId === 'global' ? null : requestedSpaceId

  if (normalizedSpaceId) {
    const accessResult = await requireSpaceAccess(normalizedSpaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response
  }

  const folderSpaceId = await resolveFolderSpaceId(session.user.id!, normalizedSpaceId, 'chatbot')
  const accessibleSpaceIds = await getAccessibleSpaceIds(session.user.id!)
  const where: any = {
    deletedAt: null,
  }

  if (requestedSpaceId === 'global') {
    where.createdBy = session.user.id
    where.spaceId = null
  } else if (normalizedSpaceId) {
    where.spaceId = normalizedSpaceId
  } else {
    where.OR = [
      { createdBy: session.user.id },
      ...(accessibleSpaceIds.length > 0 ? [{ spaceId: { in: accessibleSpaceIds } }] : []),
    ]
  }

  if (isPublished !== null) {
    where.isPublished = isPublished === 'true'
  }

  const chatbots = await db.chatbot.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const folderState = folderSpaceId ? await getFolderState(folderSpaceId, 'chatbot') : { folders: [], assignments: {} as Record<string, string | null> }

  // Merge version config into each chatbot
  const mergedChatbots = chatbots.map(cb => ({
    ...mergeVersionConfig(cb),
    folder_id: folderState.assignments[cb.id] || null,
  }))

  return NextResponse.json({ chatbots: mergedChatbots, folderSpaceId })
}





export const GET = withErrorHandling(getHandler, 'GET /api/chatbots')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Rate limiting for creating chatbots
  const rateLimitResult = await checkRateLimit('create-chatbot', session.user.id, {
    enabled: true,
    maxRequestsPerMinute: 30,
    blockDuration: 60,
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many chatbot creation requests. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const {
    name,
    website,
    description,
    engineType = body.engine_type,
    apiEndpoint,
    apiAuthType,
    apiAuthValue,
    logo,
    primaryColor,
    fontFamily,
    fontSize,
    fontColor,
    borderColor,
    borderWidth,
    borderRadius,
    messageBoxColor,
    shadowColor,
    shadowBlur,
    conversationOpener,
    followUpQuestions,
    enableFileUpload,
    showCitations,
    enableVoiceAgent,
    voiceProvider,
    voiceUIStyle,
    deploymentType,
    currentVersion,
    spaceId = body.space_id,
    folderId = body.folder_id,
    folderSpaceId = body.folder_space_id,
    customEmbedDomain,
    domainAllowlist,
    selectedModelId,
    selectedEngineId,
    chatkitAgentId,
    chatkitApiKey,
    chatkitOptions,
    openaiAgentSdkAgentId,
    openaiAgentSdkApiKey,
    openaiAgentSdkModel,
    openaiAgentSdkInstructions,
    openaiAgentSdkReasoningEffort,
    openaiAgentSdkStore,
    openaiAgentSdkVectorStoreId,
    openaiAgentSdkEnableWebSearch,
    openaiAgentSdkEnableCodeInterpreter,
    openaiAgentSdkEnableComputerUse,
    openaiAgentSdkEnableImageGeneration,
    openaiAgentSdkUseWorkflowConfig,
    openaiAgentSdkGreeting,
    openaiAgentSdkPlaceholder,
    openaiAgentSdkBackgroundColor,
    openaiAgentSdkWorkflowCode,
    openaiAgentSdkWorkflowFile,
    openaiAgentSdkRealtimePromptId,
    openaiAgentSdkRealtimePromptVersion,
    openaiAgentSdkGuardrails,
    openaiAgentSdkInputGuardrails,
    openaiAgentSdkOutputGuardrails,
    // Dify specific
    difyApiKey,
    difyOptions,
    // ChatKit specific
    useChatKitInRegularStyle,
    // Message display options
    showMessageFeedback,
    showMessageRetry,
    typingIndicatorStyle,
    fileUploadLayout,
    // Message font styling
    userMessageFontColor,
    userMessageFontFamily,
    userMessageFontSize,
    botMessageFontColor,
    botMessageFontFamily,
    botMessageFontSize,
    // Header configuration
    headerTitle,
    headerDescription,
    headerLogo,
    headerBgColor,
    headerFontColor,
    headerFontFamily,
    headerShowAvatar,
    headerAvatarType,
    headerAvatarIcon,
    headerAvatarIconColor,
    headerAvatarBackgroundColor,
    headerAvatarImageUrl,
    headerBorderEnabled,
    headerBorderColor,
    headerPaddingX,
    headerPaddingY,
    headerShowClearSession,
    headerShowCloseButton,
    // Close button position
    closeButtonOffsetX,
    closeButtonOffsetY,
    // Send button configuration
    sendButtonWidth,
    sendButtonHeight,
    sendButtonPosition,
    // Widget Button
    widgetSize,
    widgetPosition,
    widgetAvatarStyle,
    widgetBackgroundColor,
    widgetBorderColor,
    widgetBorderWidth,
    widgetBorderRadius,
    widgetShadowColor,
    widgetShadowBlur,
    widgetShadowX,
    widgetShadowY,
    widgetShadowSpread,
    widgetLabelText,
    widgetLabelColor,
    widgetAnimation,
    widgetAutoShow,
    widgetAutoShowDelay,
    widgetOffsetX,
    widgetOffsetY,
    widgetZIndex,
    showNotificationBadge,
    notificationBadgeColor,
    widgetAvatarType,
    widgetAvatarIcon,
    widgetAvatarImageUrl,
    // Chat Window
    chatWindowWidth,
    chatWindowHeight,
    chatWindowBorderColor,
    chatWindowBorderWidth,
    chatWindowBorderRadius,
    chatWindowShadowColor,
    chatWindowShadowBlur,
    chatWindowPaddingTop,
    chatWindowPaddingRight,
    chatWindowPaddingBottom,
    chatWindowPaddingLeft,
    // Footer
    footerBgColor,
    footerBorderColor,
    footerBorderWidth,
    footerBorderRadius,
    footerPaddingTop,
    footerPaddingRight,
    footerPaddingBottom,
    footerPaddingLeft,
    footerInputBgColor,
    footerInputBorderColor,
    footerInputBorderWidth,
    footerInputBorderRadius,
    footerInputFontColor,
    // Footer Granular
    footerBorderWidthTop,
    footerBorderWidthRight,
    footerBorderWidthBottom,
    footerBorderWidthLeft,
    footerBorderRadiusTopLeft,
    footerBorderRadiusTopRight,
    footerBorderRadiusBottomRight,
    footerBorderRadiusBottomLeft,
    // Footer Input Granular
    footerInputBorderWidthTop,
    footerInputBorderWidthRight,
    footerInputBorderWidthBottom,
    footerInputBorderWidthLeft,
    footerInputBorderRadiusTopLeft,
    footerInputBorderRadiusTopRight,
    footerInputBorderRadiusBottomRight,
    footerInputBorderRadiusBottomLeft,
    // Send Button
    sendButtonIcon,
    sendButtonBorderRadius,
    sendButtonBgColor,
    sendButtonIconColor,
    sendButtonShadowColor,
    sendButtonShadowBlur,
    sendButtonPadding,
    sendButtonRounded,
    sendButtonPaddingX,
    sendButtonPaddingY,
    sendButtonBorderRadiusTopLeft,
    sendButtonBorderRadiusTopRight,
    sendButtonBorderRadiusBottomRight,
    sendButtonBorderRadiusBottomLeft,
    // Message Styles
    userMessageBackgroundColor,
    botMessageBackgroundColor,
    userBubbleBorderColor,
    userBubbleBorderWidth,
    userBubbleBorderRadius,
    botBubbleBorderColor,
    botBubbleBorderWidth,
    botBubbleBorderRadius,
    // PWA
    pwaEnabled,
    pwaBannerText,
    pwaBannerPosition,
    pwaAppName,
    pwaShortName,
    pwaDescription,
    pwaThemeColor,
    pwaBackgroundColor,
    pwaIconUrl,
    pwaIconSize,
    pwaDisplayMode,
    pwaBannerBgColor,
    pwaBannerFontColor,
    pwaBannerFontFamily,
    pwaBannerFontSize,
    pwaBannerBorderRadius,
    pwaBannerShadow,
    pwaBannerPadding,
    pwaBannerButtonBgColor,
    pwaBannerButtonTextColor,
    pwaBannerButtonBorderRadius,
    pwaBannerButtonFontSize
  } = body

  const normalizedSpaceId = spaceId === 'global' ? null : spaceId || null

  if (normalizedSpaceId) {
    const accessResult = await requireSpaceAccess(normalizedSpaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response
  }

  // Validate required fields based on engine type
  if (!name || !website) {
    return NextResponse.json({ error: 'Missing required fields: name and website are required' }, { status: 400 })
  }

  const engine = engineType || 'custom'

  if (engine === 'custom') {
    if (!apiEndpoint) {
      return NextResponse.json({ error: 'Missing required fields: API Endpoint is required for custom engine type' }, { status: 400 })
    }
  } else if (engine === 'openai') {
    if (!selectedModelId) {
      return NextResponse.json({ error: 'Missing required fields: OpenAI Model is required' }, { status: 400 })
    }
  } else if (engine === 'chatkit') {
    if (!chatkitAgentId) {
      return NextResponse.json({ error: 'Missing required fields: Agent Builder Agent ID is required for ChatKit' }, { status: 400 })
    }
  } else if (engine === 'openai-agent-sdk') {
    if (!openaiAgentSdkAgentId) {
      return NextResponse.json({ error: 'Missing required fields: Agent/Workflow ID is required for OpenAI Agent SDK' }, { status: 400 })
    }
    if (!openaiAgentSdkApiKey) {
      return NextResponse.json({ error: 'Missing required fields: OpenAI API Key is required for OpenAI Agent SDK' }, { status: 400 })
    }
  }

  // For non-custom engines, use a placeholder for apiEndpoint if not provided (database requires it)
  const finalApiEndpoint = apiEndpoint || (engine === 'custom' ? '' : 'https://api.openai.com/v1')

  // Create chatbot
  try {
    const chatbot = await db.chatbot.create({
      data: {
        name,
        website: website || null,
        description: description || null,
        apiEndpoint: finalApiEndpoint,
        apiAuthType: apiAuthType || 'none',
        apiAuthValue: apiAuthValue || null,
        logo: logo || null,
        primaryColor: primaryColor || null,
        fontFamily: fontFamily || null,
        fontSize: fontSize || null,
        fontColor: fontColor || null,
        borderColor: borderColor || null,
        borderWidth: borderWidth || null,
        borderRadius: borderRadius || null,
        messageBoxColor: messageBoxColor || null,
        shadowColor: shadowColor || null,
        shadowBlur: shadowBlur || null,
        widgetBackgroundColor: widgetBackgroundColor || null,
        conversationOpener: conversationOpener || null,
        followUpQuestions: followUpQuestions || [],
        enableFileUpload: enableFileUpload || false,
        showCitations: showCitations !== undefined ? showCitations : true,
        deploymentType: deploymentType || 'popover',
        engineType: engine || 'chatkit',
        customEmbedDomain: customEmbedDomain || null,
        domainAllowlist: domainAllowlist || null,
        isPublished: false,
        currentVersion: currentVersion || null,
        createdBy: session.user.id,
        spaceId: normalizedSpaceId,
        versions: {
          create: {
            version: currentVersion || '1.0.0',
            config: buildChatbotVersionConfig(body, engine),
            isPublished: false,
            createdBy: session.user.id
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        space: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    const resolvedFolderSpaceId = await resolveFolderSpaceId(
      session.user.id!,
      folderSpaceId || normalizedSpaceId,
      'chatbot'
    )
    if (resolvedFolderSpaceId) {
      await assignResourceFolder(resolvedFolderSpaceId, 'chatbot', chatbot.id, folderId || null)
    }

    // Sync OpenAI API key to global provider config if provided
    if (openaiAgentSdkApiKey) {
      await syncOpenAIApiKey(openaiAgentSdkApiKey, request, session.user)
    }

    // Merge version config into chatbot object
    const mergedChatbot = {
      ...mergeVersionConfig(chatbot),
      folder_id: folderId || null,
    }

    return NextResponse.json({ chatbot: mergedChatbot }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating chatbot:', error)
    
    // Handle specific Prisma errors
    if (error.code === 'P2003') {
       // P2003: Foreign key constraint failed
       if (error.meta?.field_name?.includes('created_by') || error.message?.includes('chatbots_created_by_fkey')) {
         return NextResponse.json(
           { error: 'Session invalid: User record not found. Please log out and log in again.' },
           { status: 401 }
         )
       }
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot', details: error?.toString(), stack: error?.stack },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/chatbots')

