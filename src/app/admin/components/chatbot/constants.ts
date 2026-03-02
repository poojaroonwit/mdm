import { Chatbot, ChatbotVersion } from './types'

export const DEFAULT_CHATBOT_CONFIG: Partial<Chatbot> = {
  name: '',
  website: '',
  description: '',
  engineType: 'custom',
  apiEndpoint: '',
  apiAuthType: 'none',
  apiAuthValue: '',
  selectedModelId: undefined,
  selectedEngineId: undefined,
  chatkitAgentId: undefined,
  chatkitApiKey: undefined,
  openaiAgentSdkAgentId: undefined,
  openaiAgentSdkApiKey: undefined,
  openaiAgentSdkModel: undefined,
  openaiAgentSdkInstructions: undefined,
  openaiAgentSdkReasoningEffort: undefined,
  openaiAgentSdkStore: undefined,
  openaiAgentSdkVectorStoreId: undefined,
  openaiAgentSdkEnableWebSearch: false,
  openaiAgentSdkEnableCodeInterpreter: false,
  openaiAgentSdkEnableComputerUse: false,
  openaiAgentSdkEnableImageGeneration: false,
  openaiAgentSdkUseWorkflowConfig: undefined, // Will auto-detect based on agentId (true for workflows, false for assistants)
  openaiAgentSdkGreeting: undefined,
  openaiAgentSdkPlaceholder: undefined,
  openaiAgentSdkBackgroundColor: undefined,
  difyApiKey: undefined,
  difyOptions: {
    apiBaseUrl: '',
    responseMode: 'streaming',
    user: '',
    conversationId: '',
    inputs: {},
  },
  chatkitOptions: {
    theme: {
      colorScheme: 'light',
      color: {
        accent: {
          primary: '#3b82f6',
          level: 2,
        },
      },
      radius: 'round',
      density: 'normal',
      typography: {
        fontFamily: 'Inter, sans-serif',
      },
      // Legacy support
      primaryColor: '#3b82f6',
      secondaryColor: '#6b7280',
      backgroundColor: '#ffffff',
      textColor: '#000000',
    },
    locale: 'en',
    composer: {
      placeholder: 'Type your message...',
    },
    header: {
      customButtonLeft: [],
    },
    startScreen: {
      greeting: 'Hello! How can I help you today?',
      prompts: [],
    },
    disclaimer: {
      text: '',
    },
    threadItemActions: {
      feedback: false,
      retry: false,
    },
    modelPicker: {
      enabled: false,
    },
    personaPicker: {
      enabled: false,
      personas: [],
    },
  },
  primaryColor: '#3b82f6',
  fontFamily: 'Inter',
  fontSize: '14px',
  fontColor: '#000000',
  borderColor: '#e5e7eb',
  borderWidth: '1px',
  borderRadius: '8px',
  bubbleBorderColor: '#e5e7eb',
  bubbleBorderWidth: '1px',
  bubbleBorderRadius: '8px',
  bubblePadding: '12px',
  // Message bubble padding (separate for user and bot)
  userBubblePadding: '12px',
  botBubblePadding: '12px',
  userMessageBackgroundColor: '#3b82f6',
  botMessageBackgroundColor: '#f3f4f6',
  userMessageFontColor: '#ffffff',
  userMessageFontFamily: 'Inter',
  userMessageFontSize: '14px',
  botMessageFontColor: '#000000',
  botMessageFontFamily: 'Inter',
  botMessageFontSize: '14px',
  showMessageName: false,
  messageName: '',
  messageNamePosition: 'top-of-message',
  showMessageAvatar: true,
  messageAvatarPosition: 'top-of-message',
  messageBoxColor: '#ffffff',
  shadowColor: '#000000',
  shadowBlur: '4px',
  conversationOpener: 'Hello! How can I help you today?',
  conversationOpenerFontSize: '16px',
  conversationOpenerFontColor: '#6b7280',
  conversationOpenerFontFamily: 'Inter',
  conversationOpenerPosition: 'center',
  conversationOpenerAlignment: 'center',
  conversationOpenerBackgroundColor: undefined,
  conversationOpenerPadding: '16px',
  conversationOpenerBorderRadius: '8px',
  conversationOpenerFontWeight: '400',
  conversationOpenerLineHeight: '1.5',
  followUpQuestions: [],
  enableFileUpload: false,
  showCitations: true,
  enableVoiceAgent: false,
  showMessageFeedback: false,
  showMessageRetry: false,
  chatbotEnabled: true, // Enabled by default
  deploymentType: 'popover',
  widgetAvatarStyle: 'circle',
  widgetPosition: 'bottom-right',
  widgetSize: '60px',
  widgetBackgroundColor: '#3b82f6',
  widgetBackgroundBlur: 0, // No blur by default
  widgetBackgroundOpacity: 100, // Fully opaque by default
  widgetBorderColor: '#ffffff',
  widgetBorderWidth: '2px',
  widgetBorderRadius: '50%',
  widgetShadowColor: '#000000',
  widgetShadowBlur: '8px',
  widgetLabelText: 'Chat',
  widgetLabelColor: '#ffffff',
  widgetAnimation: 'fade', // Deprecated: use widgetAnimationEntry instead
  widgetAnimationEntry: 'fade' as 'slide-up' | 'scale' | 'fade' | 'slide-side',
  widgetAnimationExit: 'slide-down' as 'slide-down' | 'scale' | 'fade' | 'slide-side',
  widgetAnimationDuration: 0.3,
  widgetAnimationType: 'spring' as 'spring' | 'tween',
  widgetAutoShow: true,
  widgetAutoShowDelay: 0,
  widgetOffsetX: '20px',
  widgetOffsetY: '20px',
  widgetZIndex: 9999,
  showNotificationBadge: false,
  notificationBadgeColor: '#ef4444',
  popoverPosition: 'left', // Default: popover appears to the left of widget
  widgetPopoverMargin: '10px', // Default margin between widget and popover
  chatWindowWidth: '380px',
  chatWindowHeight: '600px',
  chatWindowBackgroundBlur: 0, // No blur by default
  chatWindowBackgroundOpacity: 100, // Fully opaque by default
  // Overlay configuration
  overlayEnabled: false, // Disabled by default
  overlayColor: '#000000', // Black overlay by default
  overlayOpacity: 50, // 50% opacity by default
  overlayBlur: 0, // No blur by default
  chatWindowBorderColor: '#e5e7eb',
  chatWindowBorderWidth: '1px',
  chatWindowBorderRadius: '8px',
  chatWindowShadowColor: '#000000',
  chatWindowShadowBlur: '4px',
  typingIndicatorStyle: 'spinner',
  typingIndicatorColor: '#6b7280',
  showThinkingMessage: false, // Disabled by default
  thinkingMessageText: 'Thinking...', // Default thinking message text
  headerTitle: '',
  headerDescription: '',
  headerLogo: '',
  headerBgColor: '#3b82f6',
  headerFontColor: '#ffffff',
  headerFontFamily: 'Inter',
  headerShowAvatar: true,
  // Header Avatar (separate from message avatar)
  headerAvatarType: 'icon',
  headerAvatarIcon: 'Bot',
  headerAvatarIconColor: '#ffffff',
  headerAvatarBackgroundColor: '#3b82f6',
  headerAvatarImageUrl: '',
  headerBorderEnabled: true,
  headerBorderColor: '#e5e7eb',
  headerPaddingX: '16px',
  headerPaddingY: '16px',
  // Close Button
  closeButtonOffsetX: '8px',
  closeButtonOffsetY: '16px', // Match headerPaddingY to align with clear session button
  footerBgColor: '#ffffff',
  footerBorderColor: '#e5e7eb',
  footerBorderWidth: '1px',
  footerBorderRadius: '0px',
  footerPaddingX: '16px',
  footerPaddingY: '16px',
  footerInputBgColor: '#ffffff',
  footerInputBorderColor: '#e5e7eb',
  footerInputBorderWidth: '1px',
  footerInputBorderRadius: '8px',
  footerInputFontColor: '#000000',
  sendButtonIcon: 'Send',
  sendButtonRounded: false,
  sendButtonBgColor: '#3b82f6',
  sendButtonIconColor: '#ffffff',
  sendButtonShadowColor: '#000000',
  sendButtonShadowBlur: '0px',
  sendButtonPaddingX: '8px',
  sendButtonPaddingY: '8px',
  fileUploadLayout: 'attach-first',
  avatarType: 'icon',
  avatarIcon: 'Bot',
  avatarIconColor: '#ffffff',
  avatarBackgroundColor: '#3b82f6',
  avatarImageUrl: '',
  // User Avatar
  showUserAvatar: true,
  userAvatarType: 'icon',
  userAvatarIcon: 'User',
  userAvatarIconColor: '#6b7280',
  userAvatarBackgroundColor: '#e5e7eb',
  userAvatarImageUrl: '',
  isPublished: false,
  currentVersion: '1.0.0',
  // PWA Defaults
  pwaEnabled: false,
  pwaInstallScope: 'chat',
  pwaBannerText: 'Install app for quick access',
  pwaBannerPosition: 'bottom',
  pwaDisplayMode: 'standalone',
  pwaIconSize: 512,
  pwaBannerBgColor: undefined,
  pwaBannerFontColor: '#ffffff',
  pwaBannerBorderRadius: '8px',
  pwaBannerPadding: '10px 12px',
  pwaBannerButtonBgColor: '#ffffff',
  pwaBannerButtonTextColor: undefined,
  pwaBannerButtonBorderRadius: '4px',
  pwaBannerButtonFontSize: '12px',
  // Emulator Configuration
  pageBackgroundColor: '#ffffff',
  pageBackgroundImage: '',
  pageTitle: '',
  pageDescription: ''
}

// Generate a proper UUID for database compatibility
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function createDefaultChatbot(name: string): Chatbot {
  return {
    id: generateUUID(),
    name: name,
    website: '',
    description: '',
    engineType: 'custom',
    apiEndpoint: '',
    apiAuthType: 'none',
    apiAuthValue: '',
    selectedModelId: undefined,
    selectedEngineId: undefined,
    chatkitAgentId: undefined,
    chatkitApiKey: undefined,
    openaiAgentSdkAgentId: undefined,
    openaiAgentSdkApiKey: undefined,
    openaiAgentSdkModel: undefined,
    openaiAgentSdkInstructions: undefined,
    openaiAgentSdkReasoningEffort: undefined,
    openaiAgentSdkStore: undefined,
    openaiAgentSdkVectorStoreId: undefined,
    difyApiKey: undefined,
    difyOptions: {
      apiBaseUrl: '',
      responseMode: 'streaming',
      user: '',
      conversationId: '',
      inputs: {},
    },
    chatkitOptions: {
      theme: {
        colorScheme: 'light',
        color: {
          accent: {
            primary: '#3b82f6',
            level: 2,
          },
        },
        radius: 'round',
        density: 'normal',
        typography: {
          fontFamily: 'Inter, sans-serif',
        },
        // Legacy support
        primaryColor: '#3b82f6',
        secondaryColor: '#6b7280',
        backgroundColor: '#ffffff',
        textColor: '#000000',
      },
      locale: 'en',
      composer: {
        placeholder: 'Type your message...',
        tools: [],
      },
      header: {
        customButtonLeft: [],
      },
      startScreen: {
        greeting: 'Hello! How can I help you today?',
        prompts: [],
      },
      entities: undefined,
    },
    logo: '',
    primaryColor: '#3b82f6',
    fontFamily: 'Inter',
    fontSize: '14px',
    fontColor: '#000000',
    borderColor: '#e5e7eb',
    borderWidth: '1px',
    borderRadius: '8px',
    bubbleBorderColor: '#e5e7eb',
    bubbleBorderWidth: '1px',
    bubbleBorderRadius: '8px',
    bubblePadding: '12px',
    // Message bubble padding (separate for user and bot)
    userBubblePadding: '12px',
    botBubblePadding: '12px',
    userMessageBackgroundColor: '#3b82f6',
    botMessageBackgroundColor: '#f3f4f6',
    userMessageFontColor: '#ffffff',
    userMessageFontFamily: 'Inter',
    userMessageFontSize: '14px',
    showMessageName: false,
    messageName: '',
    messageNamePosition: 'top-of-message',
    showMessageAvatar: true,
    messageAvatarPosition: 'top-of-message',
    messageBoxColor: '#ffffff',
    shadowColor: '#000000',
    shadowBlur: '4px',
    conversationOpener: 'Hello! How can I help you today?',
    showStartConversation: true, // Show start conversation message by default
    conversationOpenerFontSize: '16px',
    conversationOpenerFontColor: '#6b7280',
    conversationOpenerFontFamily: 'Inter',
    conversationOpenerPosition: 'center',
    conversationOpenerAlignment: 'center',
    conversationOpenerBackgroundColor: undefined,
    conversationOpenerPadding: '16px',
    conversationOpenerBorderRadius: '8px',
    conversationOpenerFontWeight: '400',
    conversationOpenerLineHeight: '1.5',
    followUpQuestions: [],
    enableFileUpload: false,
    showCitations: true,
    enableVoiceAgent: false,
    chatbotEnabled: true, // Enabled by default
    deploymentType: 'popover',
    widgetAvatarStyle: 'circle',
    widgetPosition: 'bottom-right',
    widgetSize: '60px',
    widgetBackgroundColor: '#3b82f6',
    widgetBackgroundBlur: 0, // No blur by default
    widgetBackgroundOpacity: 100, // Fully opaque by default
    widgetBorderColor: '#ffffff',
    widgetBorderWidth: '2px',
    widgetBorderRadius: '50%',
    widgetShadowColor: '#000000',
    widgetShadowBlur: '8px',
    widgetLabelText: 'Chat',
    widgetLabelColor: '#ffffff',
    widgetAnimation: 'fade', // Deprecated: use widgetAnimationEntry instead
    widgetAnimationEntry: 'fade' as 'slide-up' | 'scale' | 'fade' | 'slide-side',
    widgetAnimationExit: 'slide-down' as 'slide-down' | 'scale' | 'fade' | 'slide-side',
    widgetAnimationDuration: 0.3,
    widgetAnimationType: 'spring' as 'spring' | 'tween',
    widgetAutoShow: true,
    widgetAutoShowDelay: 0,
    widgetOffsetX: '20px',
    widgetOffsetY: '20px',
    widgetZIndex: 9999,
    showNotificationBadge: false,
    notificationBadgeColor: '#ef4444',
    popoverPosition: 'left', // Default: popover appears to the left of widget
    widgetPopoverMargin: '10px', // Default margin between widget and popover
    chatWindowWidth: '380px',
    chatWindowHeight: '600px',
    chatWindowBackgroundBlur: 0, // No blur by default
    chatWindowBackgroundOpacity: 100, // Fully opaque by default
    // Overlay configuration
    overlayEnabled: false, // Disabled by default
    overlayColor: '#000000', // Black overlay by default
    overlayOpacity: 50, // 50% opacity by default
    overlayBlur: 0, // No blur by default
    chatWindowBorderColor: '#e5e7eb',
    chatWindowBorderWidth: '1px',
    chatWindowBorderRadius: '8px',
    chatWindowShadowColor: '#000000',
    chatWindowShadowBlur: '4px',
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [{
      id: `version-${Date.now()}`,
      version: '1.0.0',
      createdAt: new Date(),
      createdBy: 'current-user',
      isPublished: false
    }],
    currentVersion: '1.0.0',
    // PWA Configuration
    pwaEnabled: false,
    pwaInstallScope: 'chat',
    pwaBannerText: 'Install app for quick access',
    pwaBannerPosition: 'bottom',
    pwaDisplayMode: 'standalone',
    pwaIconSize: 512,
    pwaBannerBgColor: undefined,
    pwaBannerFontColor: '#ffffff',
    pwaBannerBorderRadius: '8px',
    pwaBannerPadding: '10px 12px',
    pwaBannerButtonBgColor: '#ffffff',
    pwaBannerButtonTextColor: undefined,
    pwaBannerButtonBorderRadius: '4px',
    pwaBannerButtonFontSize: '12px',
    // Emulator Configuration
    pageBackgroundColor: '#ffffff',
    pageBackgroundImage: '',
    pageTitle: '',
    pageDescription: ''
  }
}

export function createDefaultVersion(): ChatbotVersion {
  return {
    id: `version-${Date.now()}`,
    version: '1.0.0',
    createdAt: new Date(),
    createdBy: 'current-user',
    isPublished: false
  }
}




