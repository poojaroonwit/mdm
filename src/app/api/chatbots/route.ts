import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { mergeVersionConfig, sanitizeChatbotConfig } from '@/lib/chatbot-helper'
import { encryptApiKey } from '@/lib/encryption'
import { getSecretsManager } from '@/lib/secrets-manager'
import { createAuditContext } from '@/lib/audit-context-helper'
import { requireSpaceAccess } from '@/lib/space-access'
import { checkRateLimit } from '@/lib/rate-limiter'
import {
  assignResourceFolder,
  getFolderState,
  resolveFolderSpaceId,
} from '@/lib/folder-state'

export const dynamic = 'force-dynamic'

const prisma = db

// Helper function to sync OpenAI API key to global provider config
async function syncOpenAIApiKey(apiKey: string | null | undefined, request: NextRequest, user: any) {
  if (!apiKey) return

  try {
    // Check if OpenAI provider exists
    const existingProvider = await prisma.aIProviderConfig.findUnique({
      where: { provider: 'openai' }
    })

    const secretsManager = getSecretsManager()
    const useVault = secretsManager.getBackend() === 'vault'

    let encryptedApiKey: string | null = null

    if (apiKey) {
      if (useVault) {
        // Store in Vault with audit context
        const auditContext = createAuditContext(request, user, 'API key sync from chatbot')
        await secretsManager.storeSecret(
          `ai-providers/openai/api-key`,
          { apiKey },
          undefined,
          auditContext
        )
        encryptedApiKey = 'vault://openai'
      } else {
        // Use database encryption
        encryptedApiKey = encryptApiKey(apiKey)
      }
    }

    if (existingProvider) {
      // Update existing provider
      await prisma.aIProviderConfig.update({
        where: { provider: 'openai' },
        data: {
          apiKey: encryptedApiKey,
          isConfigured: !!apiKey,
          status: apiKey ? 'active' : 'inactive'
        }
      })
    } else {
      // Create new provider
      await prisma.aIProviderConfig.create({
        data: {
          provider: 'openai',
          name: 'OpenAI',
          description: 'Leading AI research company with GPT models',
          website: 'https://openai.com',
          icon: '🤖',
          apiKey: encryptedApiKey,
          isSupported: true,
          isConfigured: !!apiKey,
          status: apiKey ? 'active' : 'inactive'
        }
      })
    }
  } catch (error) {
    console.error('Error syncing OpenAI API key:', error)
    // Don't throw - this is a sync operation, shouldn't fail the main request
  }
}

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

  // TODO: Add requireSpaceAccess check if spaceId is available

  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get('spaceId') || searchParams.get('space_id')
  const isPublished = searchParams.get('isPublished')
  const folderSpaceId = await resolveFolderSpaceId(session.user.id!, spaceId)

  const where: any = {
    deletedAt: null,
    OR: [
      { createdBy: session.user.id },
      { space: { members: { some: { userId: session.user.id } } } }
    ]
  }

  if (spaceId) {
    where.spaceId = spaceId
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
  
  console.log('[DEBUG] Chatbot POST - Session User:', JSON.stringify(session.user));

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

  // TODO: Add requireSpaceAccess check if spaceId is available

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
        spaceId: spaceId || null,
        versions: {
          create: {
            version: currentVersion || '1.0.0',
            config: {
              name,
              website,
              description,
              engineType: engine || 'custom',
              apiEndpoint,
              apiAuthType: apiAuthType || 'none',
              apiAuthValue: apiAuthValue || null,
              selectedModelId: selectedModelId || null,
              selectedEngineId: selectedEngineId || null,
              chatkitAgentId: chatkitAgentId || null,
              chatkitApiKey: chatkitApiKey || null,
              chatkitOptions: chatkitOptions || null,
              useChatKitInRegularStyle: useChatKitInRegularStyle !== undefined ? useChatKitInRegularStyle : null,
              difyApiKey: difyApiKey || null,
              difyOptions: difyOptions || null,
              openaiAgentSdkAgentId: openaiAgentSdkAgentId || null,
              openaiAgentSdkApiKey: openaiAgentSdkApiKey || null,
              openaiAgentSdkModel: openaiAgentSdkModel || null,
              openaiAgentSdkInstructions: openaiAgentSdkInstructions || null,
              openaiAgentSdkReasoningEffort: openaiAgentSdkReasoningEffort || null,
              openaiAgentSdkStore: openaiAgentSdkStore !== undefined ? openaiAgentSdkStore : null,
              openaiAgentSdkVectorStoreId: openaiAgentSdkVectorStoreId || null,
              openaiAgentSdkEnableWebSearch: openaiAgentSdkEnableWebSearch !== undefined ? openaiAgentSdkEnableWebSearch : null,
              openaiAgentSdkEnableCodeInterpreter: openaiAgentSdkEnableCodeInterpreter !== undefined ? openaiAgentSdkEnableCodeInterpreter : null,
              openaiAgentSdkEnableComputerUse: openaiAgentSdkEnableComputerUse !== undefined ? openaiAgentSdkEnableComputerUse : null,
              openaiAgentSdkEnableImageGeneration: openaiAgentSdkEnableImageGeneration !== undefined ? openaiAgentSdkEnableImageGeneration : null,
              openaiAgentSdkUseWorkflowConfig: openaiAgentSdkUseWorkflowConfig !== undefined ? openaiAgentSdkUseWorkflowConfig : null,
              openaiAgentSdkGreeting: openaiAgentSdkGreeting || null,
              openaiAgentSdkPlaceholder: openaiAgentSdkPlaceholder || null,
              openaiAgentSdkBackgroundColor: openaiAgentSdkBackgroundColor || null,
              openaiAgentSdkWorkflowCode: openaiAgentSdkWorkflowCode || null,
              openaiAgentSdkWorkflowFile: openaiAgentSdkWorkflowFile || null,
              openaiAgentSdkRealtimePromptId: openaiAgentSdkRealtimePromptId || null,
              openaiAgentSdkRealtimePromptVersion: openaiAgentSdkRealtimePromptVersion || null,
              openaiAgentSdkGuardrails: openaiAgentSdkGuardrails !== undefined ? openaiAgentSdkGuardrails : null,
              openaiAgentSdkInputGuardrails: openaiAgentSdkInputGuardrails !== undefined ? openaiAgentSdkInputGuardrails : null,
              openaiAgentSdkOutputGuardrails: openaiAgentSdkOutputGuardrails !== undefined ? openaiAgentSdkOutputGuardrails : null,
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
              conversationOpener: conversationOpener || null,
              showStartConversation: (body as any).showStartConversation !== undefined ? (body as any).showStartConversation : null,
              startScreenPrompts: (body as any).startScreenPrompts || null,
              startScreenPromptsStyle: (body as any).startScreenPromptsStyle || null,
              startScreenPromptsPosition: (body as any).startScreenPromptsPosition || null,
              startScreenPromptsIconDisplay: (body as any).startScreenPromptsIconDisplay || null,
              startScreenPromptsBackgroundColor: (body as any).startScreenPromptsBackgroundColor || null,
              startScreenPromptsFontColor: (body as any).startScreenPromptsFontColor || null,
              startScreenPromptsFontFamily: (body as any).startScreenPromptsFontFamily || null,
              startScreenPromptsFontSize: (body as any).startScreenPromptsFontSize || null,
              startScreenPromptsPadding: (body as any).startScreenPromptsPadding || null,
              startScreenPromptsBorderColor: (body as any).startScreenPromptsBorderColor || null,
              startScreenPromptsBorderWidth: (body as any).startScreenPromptsBorderWidth || null,
              startScreenPromptsBorderRadius: (body as any).startScreenPromptsBorderRadius || null,
              followUpQuestions: followUpQuestions || [],
              enableFileUpload: enableFileUpload || false,
              showCitations: showCitations !== undefined ? showCitations : true,
              deploymentType: deploymentType || 'popover',
              customEmbedDomain: customEmbedDomain || null,
              domainAllowlist: domainAllowlist || null,
              // Message font styling
              userMessageFontColor: userMessageFontColor || null,
              userMessageFontFamily: userMessageFontFamily || null,
              userMessageFontSize: userMessageFontSize || null,
              botMessageFontColor: botMessageFontColor || null,
              botMessageFontFamily: botMessageFontFamily || null,
              botMessageFontSize: botMessageFontSize || null,
              // Header configuration
              headerTitle: headerTitle || null,
              headerDescription: headerDescription || null,
              headerLogo: headerLogo || null,
              headerBgColor: headerBgColor || null,
              headerFontColor: headerFontColor || null,
              headerFontFamily: headerFontFamily || null,
              headerShowAvatar: headerShowAvatar !== undefined ? headerShowAvatar : null,
              headerAvatarType: headerAvatarType || null,
              headerAvatarIcon: headerAvatarIcon || null,
              headerAvatarIconColor: headerAvatarIconColor || null,
              headerAvatarBackgroundColor: headerAvatarBackgroundColor || null,
              headerAvatarImageUrl: headerAvatarImageUrl || null,
              headerBorderEnabled: headerBorderEnabled !== undefined ? headerBorderEnabled : null,
              headerBorderColor: headerBorderColor || null,
              headerPaddingX: headerPaddingX || null,
              headerPaddingY: headerPaddingY || null,
              headerShowClearSession: headerShowClearSession !== undefined ? headerShowClearSession : null,
              headerShowCloseButton: headerShowCloseButton !== undefined ? headerShowCloseButton : null,
              // Close button position
              closeButtonOffsetX: closeButtonOffsetX || null,
              closeButtonOffsetY: closeButtonOffsetY || null,
              // Send button configuration
              sendButtonWidth: sendButtonWidth || null,
              sendButtonHeight: sendButtonHeight || null,
              sendButtonPosition: sendButtonPosition || 'outside',
              // Widget Button
              widgetSize: widgetSize || null,
              widgetPosition: widgetPosition || null,
              widgetAvatarStyle: widgetAvatarStyle || null,
              widgetBackgroundColor: widgetBackgroundColor || null,
              widgetBorderColor: widgetBorderColor || null,
              widgetBorderWidth: widgetBorderWidth || null,
              widgetBorderRadius: widgetBorderRadius || null,
              widgetShadowColor: widgetShadowColor || null,
              widgetShadowBlur: widgetShadowBlur || null,
              widgetShadowX: (body as any).widgetShadowX || null,
              widgetShadowY: (body as any).widgetShadowY || null,
              widgetShadowSpread: (body as any).widgetShadowSpread || null,
              widgetLabelText: widgetLabelText || null,
              widgetLabelColor: widgetLabelColor || null,
              widgetAnimation: widgetAnimation || null,
              widgetAutoShow: (body as any).widgetAutoShow !== undefined ? (body as any).widgetAutoShow : null,
              widgetAutoShowDelay: (body as any).widgetAutoShowDelay !== undefined ? (body as any).widgetAutoShowDelay : null,
              widgetOffsetX: widgetOffsetX || null,
              widgetOffsetY: widgetOffsetY || null,
              widgetZIndex: (body as any).widgetZIndex !== undefined ? (body as any).widgetZIndex : null,
              showNotificationBadge: (body as any).showNotificationBadge !== undefined ? (body as any).showNotificationBadge : null,
              notificationBadgeColor: notificationBadgeColor || null,
              widgetAvatarType: widgetAvatarType || null,
              widgetAvatarIcon: widgetAvatarIcon || null,
              widgetAvatarImageUrl: widgetAvatarImageUrl || null,
              // Chat Window
              chatWindowWidth: chatWindowWidth || null,
              chatWindowHeight: chatWindowHeight || null,
              chatWindowBorderColor: (body as any).chatWindowBorderColor || null,
              chatWindowBorderWidth: (body as any).chatWindowBorderWidth || null,
              chatWindowBorderRadius: (body as any).chatWindowBorderRadius || null,
              chatWindowShadowColor: (body as any).chatWindowShadowColor || null,
              chatWindowShadowBlur: (body as any).chatWindowShadowBlur || null,
              chatWindowPaddingTop: (body as any).chatWindowPaddingTop || null,
              chatWindowPaddingRight: (body as any).chatWindowPaddingRight || null,
              chatWindowPaddingBottom: (body as any).chatWindowPaddingBottom || null,
              chatWindowPaddingLeft: (body as any).chatWindowPaddingLeft || null,
              // Footer
              footerBgColor: footerBgColor || null,
              footerBorderColor: footerBorderColor || null,
              footerBorderWidth: footerBorderWidth || null,
              footerBorderRadius: footerBorderRadius || null,
              footerPaddingTop: footerPaddingTop || null,
              footerPaddingRight: footerPaddingRight || null,
              footerPaddingBottom: footerPaddingBottom || null,
              footerPaddingLeft: footerPaddingLeft || null,
              footerInputBgColor: footerInputBgColor || null,
              footerInputBorderColor: footerInputBorderColor || null,
              footerInputBorderWidth: footerInputBorderWidth || null,
              footerInputBorderRadius: footerInputBorderRadius || null,
              footerInputFontColor: footerInputFontColor || null,
              // Footer Granular
              footerBorderWidthTop: (body as any).footerBorderWidthTop || null,
              footerBorderWidthRight: (body as any).footerBorderWidthRight || null,
              footerBorderWidthBottom: (body as any).footerBorderWidthBottom || null,
              footerBorderWidthLeft: (body as any).footerBorderWidthLeft || null,
              footerBorderRadiusTopLeft: (body as any).footerBorderRadiusTopLeft || null,
              footerBorderRadiusTopRight: (body as any).footerBorderRadiusTopRight || null,
              footerBorderRadiusBottomRight: (body as any).footerBorderRadiusBottomRight || null,
              footerBorderRadiusBottomLeft: (body as any).footerBorderRadiusBottomLeft || null,
              // Footer Input Granular
              footerInputBorderWidthTop: (body as any).footerInputBorderWidthTop || null,
              footerInputBorderWidthRight: (body as any).footerInputBorderWidthRight || null,
              footerInputBorderWidthBottom: (body as any).footerInputBorderWidthBottom || null,
              footerInputBorderWidthLeft: (body as any).footerInputBorderWidthLeft || null,
              footerInputBorderRadiusTopLeft: (body as any).footerInputBorderRadiusTopLeft || null,
              footerInputBorderRadiusTopRight: (body as any).footerInputBorderRadiusTopRight || null,
              footerInputBorderRadiusBottomRight: (body as any).footerInputBorderRadiusBottomRight || null,
              footerInputBorderRadiusBottomLeft: (body as any).footerInputBorderRadiusBottomLeft || null,
              // Send Button
              sendButtonIcon: sendButtonIcon || null,
              sendButtonBorderRadius: sendButtonBorderRadius || null,
              sendButtonBgColor: sendButtonBgColor || null,
              sendButtonIconColor: sendButtonIconColor || null,
              sendButtonShadowColor: sendButtonShadowColor || null,
              sendButtonShadowBlur: sendButtonShadowBlur || null,
              sendButtonPadding: sendButtonPadding || null,
              sendButtonRounded: (body as any).sendButtonRounded !== undefined ? (body as any).sendButtonRounded : null,
              sendButtonPaddingX: (body as any).sendButtonPaddingX || null,
              sendButtonPaddingY: (body as any).sendButtonPaddingY || null,
              sendButtonBorderRadiusTopLeft: (body as any).sendButtonBorderRadiusTopLeft || null,
              sendButtonBorderRadiusTopRight: (body as any).sendButtonBorderRadiusTopRight || null,
              sendButtonBorderRadiusBottomRight: (body as any).sendButtonBorderRadiusBottomRight || null,
              sendButtonBorderRadiusBottomLeft: (body as any).sendButtonBorderRadiusBottomLeft || null,
              // Message Styles
              userMessageBackgroundColor: userMessageBackgroundColor || null,
              botMessageBackgroundColor: botMessageBackgroundColor || null,
              userBubbleBorderColor: userBubbleBorderColor || null,
              userBubbleBorderWidth: userBubbleBorderWidth || null,
              userBubbleBorderRadius: userBubbleBorderRadius || null,
              botBubbleBorderColor: botBubbleBorderColor || null,
              botBubbleBorderWidth: botBubbleBorderWidth || null,
              botBubbleBorderRadius: botBubbleBorderRadius || null,
              // PWA
              pwaEnabled: (body as any).pwaEnabled !== undefined ? (body as any).pwaEnabled : null,
              pwaBannerText: (body as any).pwaBannerText || null,
              pwaBannerPosition: (body as any).pwaBannerPosition || null,
              pwaAppName: (body as any).pwaAppName || null,
              pwaShortName: (body as any).pwaShortName || null,
              pwaDescription: (body as any).pwaDescription || null,
              pwaThemeColor: (body as any).pwaThemeColor || null,
              pwaBackgroundColor: (body as any).pwaBackgroundColor || null,
              pwaIconUrl: (body as any).pwaIconUrl || null,
              pwaIconSize: (body as any).pwaIconSize || null,
              pwaDisplayMode: (body as any).pwaDisplayMode || null,
              pwaBannerBgColor: (body as any).pwaBannerBgColor || null,
              pwaBannerFontColor: (body as any).pwaBannerFontColor || null,
              pwaBannerFontFamily: (body as any).pwaBannerFontFamily || null,
              pwaBannerFontSize: (body as any).pwaBannerFontSize || null,
              pwaBannerBorderRadius: (body as any).pwaBannerBorderRadius || null,
              pwaBannerShadow: (body as any).pwaBannerShadow || null,
              pwaBannerPadding: (body as any).pwaBannerPadding || null,
              pwaBannerButtonBgColor: (body as any).pwaBannerButtonBgColor || null,
              pwaBannerButtonTextColor: (body as any).pwaBannerButtonTextColor || null,
              pwaBannerButtonBorderRadius: (body as any).pwaBannerButtonBorderRadius || null,
              pwaBannerButtonFontSize: (body as any).pwaBannerButtonFontSize || null
            },
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

    const resolvedFolderSpaceId = await resolveFolderSpaceId(session.user.id!, folderSpaceId || spaceId || null)
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

