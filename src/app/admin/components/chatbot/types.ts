export interface ChatbotVersion {
  id: string
  version: string
  createdAt: Date
  createdBy: string
  isPublished: boolean
  changes?: string
  config?: any
}

export interface ChatKitColorAccent {
  primary?: string
  level?: number // 0-4 intensity level
  icon?: string // Icon color (separate from primary accent)
}

export interface ChatKitSurfaceColors {
  background?: string
  foreground?: string
  [key: string]: any
}

export interface ChatKitColor {
  accent?: ChatKitColorAccent
  background?: string
  text?: string
  secondary?: string
  border?: string
  surface?: string | ChatKitSurfaceColors
  [key: string]: any
}

export interface ChatKitTypography {
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  lineHeight?: string | number
  letterSpacing?: string | number
  [key: string]: any
}

export interface ChatKitTheme {
  colorScheme?: 'light' | 'dark' | 'system' // 'system' = auto-detect browser preference
  color?: ChatKitColor
  radius?: 'pill' | 'round' | 'soft' | 'sharp'
  density?: 'compact' | 'normal' | 'spacious'
  typography?: ChatKitTypography
  // Legacy support
  primaryColor?: string
  secondaryColor?: string
  backgroundColor?: string
  textColor?: string
  [key: string]: any
}

export interface ChatKitComposerTool {
  id?: string
  label?: string
  shortLabel?: string // Shorter label variant for compact display
  icon?: string
  pinned?: boolean
  type?: string
  accept?: string // For file_upload tools: e.g., "image/*", "video/*", ".pdf,.doc"
  placeholderOverride?: string // Override placeholder text for this specific tool
  [key: string]: any
}

export interface ChatKitComposer {
  placeholder?: string
  tools?: ChatKitComposerTool[]
  [key: string]: any
}

export interface ChatKitHeaderButton {
  icon?: string
  label?: string
  onClick?: () => void
  [key: string]: any
}

export interface ChatKitHeader {
  customButtonLeft?: ChatKitHeaderButton[]
  [key: string]: any
}

export interface ChatKitStartScreenPrompt {
  name?: string
  label?: string
  prompt: string
  icon?: string
  [key: string]: any
}

export interface ChatKitStartScreen {
  greeting?: string
  prompts?: ChatKitStartScreenPrompt[]
}

export interface ChatKitEntities {
  onTagSearch?: (query: string) => Promise<any[]>
  onRequestPreview?: (entity: any) => Promise<any>
  [key: string]: any
}

export interface ChatKitDisclaimer {
  text?: string
  [key: string]: any
}

export interface ChatKitThreadItemActions {
  feedback?: boolean
  retry?: boolean
  [key: string]: any
}

export interface ChatKitModelPicker {
  enabled?: boolean
  [key: string]: any
}

export interface ChatKitPersonaPicker {
  enabled?: boolean
  personas?: Array<{
    id?: string
    name?: string
    description?: string
    systemPrompt?: string
    [key: string]: any
  }>
  [key: string]: any
}

export interface ChatKitOptions {
  theme?: ChatKitTheme
  locale?: string
  composer?: ChatKitComposer
  header?: ChatKitHeader
  startScreen?: ChatKitStartScreen
  entities?: ChatKitEntities
  disclaimer?: ChatKitDisclaimer
  threadItemActions?: ChatKitThreadItemActions
  modelPicker?: ChatKitModelPicker
  personaPicker?: ChatKitPersonaPicker
  getStarted?: ChatKitGetStarted
  [key: string]: any
}

export interface ChatKitGetStarted {
  enabled?: boolean
  icon?: string
  image?: string
  title?: string
  subTitle?: string
  description?: string
  buttonText?: string
  marginBottom?: string
  [key: string]: any
}

export interface DifyFile {
  type: 'image' | 'document' | 'audio' | 'video'
  transfer_method: 'remote_url' | 'local_file'
  url?: string // For remote_url
  upload_file_id?: string // For local_file
  [key: string]: any
}

export interface DifyOptions {
  apiBaseUrl?: string // Dify API base URL (e.g., http://ncc-dify.qsncc.com)
  responseMode?: 'streaming' | 'blocking' // Response mode: streaming or blocking
  user?: string // User identifier
  conversationId?: string // Conversation ID for continuing conversations
  inputs?: Record<string, any> // Input variables for the workflow/app
  [key: string]: any
}

export interface Chatbot {
  id: string
  name: string
  website: string
  description?: string
  engineType: 'custom' | 'openai' | 'chatkit' | 'dify' | 'openai-agent-sdk'
  apiEndpoint: string
  apiAuthType: 'none' | 'bearer' | 'api_key' | 'custom'
  apiAuthValue: string
  selectedModelId?: string
  selectedEngineId?: string
  // ChatKit specific
  chatkitAgentId?: string
  chatkitApiKey?: string
  chatkitOptions?: ChatKitOptions
  useChatKitInRegularStyle?: boolean // Enable ChatKit in regular style (only header config will be used)
  // Dify specific
  difyApiKey?: string
  difyOptions?: DifyOptions
  // OpenAI Agent SDK specific
  openaiAgentSdkAgentId?: string
  openaiAgentSdkApiKey?: string
  openaiAgentSdkModel?: string // Model to use (e.g., "gpt-4o", "gpt-5")
  openaiAgentSdkInstructions?: string // Agent instructions
  openaiAgentSdkReasoningEffort?: 'low' | 'medium' | 'high' // Reasoning effort for gpt-5
  openaiAgentSdkStore?: boolean // Whether to store reasoning traces
  openaiAgentSdkVectorStoreId?: string // Vector store ID for file search tool
  openaiAgentSdkEnableWebSearch?: boolean // Enable web search tool for the agent
  openaiAgentSdkEnableCodeInterpreter?: boolean // Enable code interpreter tool for the agent
  openaiAgentSdkEnableComputerUse?: boolean // Enable computer use tool for the agent
  openaiAgentSdkEnableImageGeneration?: boolean // Enable image generation tool for the agent
  openaiAgentSdkGuardrails?: any // Guardrails configuration from workflow (read-only, configured in Agent Builder)
  openaiAgentSdkRealtimePromptId?: string // Prompt ID for OpenAI Realtime API (alternative to instructions)
  openaiAgentSdkRealtimePromptVersion?: string // Prompt version for OpenAI Realtime API
  openaiAgentSdkInputGuardrails?: any // Input guardrails from workflow (read-only, configured in Agent Builder)
  openaiAgentSdkOutputGuardrails?: any // Output guardrails from workflow (read-only, configured in Agent Builder)
  openaiAgentSdkUseWorkflowConfig?: boolean // Whether to use workflow config or custom config (controls ALL configs: agent + UI)
  openaiAgentSdkGreeting?: string // Greeting/start message for Agent SDK
  openaiAgentSdkPlaceholder?: string // Input placeholder text for Agent SDK
  openaiAgentSdkBackgroundColor?: string // Background color for Agent SDK chat UI
  openaiAgentSdkWorkflowCode?: string // Custom workflow code from Agent Builder (pasted by user)
  openaiAgentSdkWorkflowFile?: string // Workflow file name from src/lib/workflows (e.g., "qsncc-workflow")
  openaiAgentSdkMaxPromptTokens?: number
  openaiAgentSdkMaxCompletionTokens?: number
  openaiAgentSdkTruncationStrategy?: {
    type: 'auto' | 'last_messages'
    last_messages?: number
  }
  resetSessionOnClose?: boolean
  // Style config
  logo?: string
  primaryColor: string
  fontFamily: string
  fontSize: string
  fontColor: string
  secondaryColor?: string
  backgroundColor?: string
  borderColor: string
  borderWidth: string
  borderRadius: string
  // Individual border width sides
  borderWidthTop?: string
  borderWidthRight?: string
  borderWidthBottom?: string
  borderWidthLeft?: string
  // Individual border radius corners
  borderRadiusTopLeft?: string
  borderRadiusTopRight?: string
  borderRadiusBottomRight?: string
  borderRadiusBottomLeft?: string
  // Message bubble borders
  bubbleBorderColor?: string
  bubbleBorderWidth?: string
  bubbleBorderRadius?: string
  // Individual bubble border width sides
  bubbleBorderWidthTop?: string
  bubbleBorderWidthRight?: string
  bubbleBorderWidthBottom?: string
  bubbleBorderWidthLeft?: string
  // Individual bubble border radius corners
  bubbleBorderRadiusTopLeft?: string
  bubbleBorderRadiusTopRight?: string
  bubbleBorderRadiusBottomRight?: string
  bubbleBorderRadiusBottomLeft?: string
  // Message bubble borders (separate for user and bot)
  userBubbleBorderColor?: string
  userBubbleBorderWidth?: string
  userBubbleBorderRadius?: string
  botBubbleBorderColor?: string
  botBubbleBorderWidth?: string
  botBubbleBorderRadius?: string
  // Individual user bubble border radius corners
  userBubbleBorderRadiusTopLeft?: string
  userBubbleBorderRadiusTopRight?: string
  userBubbleBorderRadiusBottomRight?: string
  userBubbleBorderRadiusBottomLeft?: string
  // Individual bot bubble border radius corners
  botBubbleBorderRadiusTopLeft?: string
  botBubbleBorderRadiusTopRight?: string
  botBubbleBorderRadiusBottomRight?: string
  botBubbleBorderRadiusBottomLeft?: string
  bubblePadding?: string
  // Message bubble padding (separate for user and bot)
  userBubblePadding?: string
  botBubblePadding?: string
  // Individual bot message padding sides
  botBubblePaddingTop?: string
  botBubblePaddingRight?: string
  botBubblePaddingBottom?: string
  botBubblePaddingLeft?: string
  // Individual user message padding sides
  userBubblePaddingTop?: string
  userBubblePaddingRight?: string
  userBubblePaddingBottom?: string
  userBubblePaddingLeft?: string
  // Message background colors
  userMessageBackgroundColor?: string
  botMessageBackgroundColor?: string
  // User message font styling
  userMessageFontColor?: string
  userMessageFontFamily?: string
  userMessageFontSize?: string
  // Bot message font styling
  botMessageFontColor?: string
  botMessageFontFamily?: string
  botMessageFontSize?: string
  // Message display options
  showMessageName?: boolean
  messageName?: string
  messageNamePosition?: 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
  showMessageAvatar?: boolean
  messageAvatarPosition?: 'top-of-message' | 'left-of-message'
  messageBoxColor: string
  shadowColor: string
  shadowBlur: string
  // Config
  conversationOpener: string
  showStartConversation?: boolean // Show/hide the start conversation message
  // Start Screen Prompts (for Agent SDK and other engines)
  startScreenPrompts?: Array<{ label?: string; prompt: string; icon?: string }> // Quick prompt buttons shown when chat starts
  // Start Screen Prompts Styling
  startScreenPromptsStyle?: 'list' | 'card' // Style type: list or card
  startScreenPromptsPosition?: 'center' | 'bottom' | 'list' // Position of prompts
  startScreenPromptsIconDisplay?: 'suffix' | 'show-all' | 'none' // How to display icons
  startScreenPromptsBackgroundColor?: string // Background color of prompt buttons
  startScreenPromptsFontColor?: string // Font color of prompt buttons
  startScreenPromptsFontFamily?: string // Font family of prompt buttons
  startScreenPromptsFontSize?: string // Font size of prompt buttons
  startScreenPromptsPadding?: string // Padding of prompt buttons
  startScreenPromptsBorderColor?: string // Border color of prompt buttons
  startScreenPromptsBorderWidth?: string // Border width of prompt buttons
  startScreenPromptsBorderRadius?: string // Border radius of prompt buttons
  // Conversation Opener Styling
  conversationOpenerFontSize?: string
  conversationOpenerFontColor?: string
  conversationOpenerFontFamily?: string
  conversationOpenerPosition?: 'center' | 'left' | 'right' | 'top' | 'bottom'
  conversationOpenerAlignment?: 'left' | 'center' | 'right' | 'justify'
  conversationOpenerBackgroundColor?: string
  conversationOpenerPadding?: string
  conversationOpenerBorderRadius?: string
  conversationOpenerFontWeight?: string | number
  conversationOpenerLineHeight?: string | number
  followUpQuestions: string[]
  enableFileUpload: boolean
  showCitations: boolean
  enableVoiceAgent?: boolean
  voiceProvider?: 'browser' | 'openai-realtime' // Voice provider: 'browser' for Web Speech API, 'openai-realtime' for OpenAI Realtime API
  voiceUIStyle?: 'chat' | 'wave' // Voice UI style: 'chat' for chat-like UI, 'wave' for background wave animation
  showMessageFeedback?: boolean // Show like/dislike buttons on messages
  showMessageRetry?: boolean // Show retry button on messages
  chatbotEnabled?: boolean // Enable/disable chatbot widget (default: true)
  // Deployment
  deploymentType: 'popover' | 'fullpage' | 'popup-center'
  customEmbedDomain?: string // Custom domain for embedding (e.g., https://chat.yourdomain.com)
  domainAllowlist?: string // Comma-separated list of allowed domains for security allowlist
  embedCode?: string
  // Widget styling (for popover)
  widgetAvatarStyle: 'circle' | 'square' | 'circle-with-label' | 'custom'
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center' | 'top-center'
  widgetSize: string
  widgetBackgroundColor: string
  widgetBackgroundBlur?: number // Blur percentage (0-100) for glassmorphism effect
  widgetBackgroundOpacity?: number // Background opacity (0-100) for glassmorphism effect
  widgetOpenBackgroundColor?: string // Background color when chat is OPEN (falls back to widgetBackgroundColor)
  widgetOpenBackgroundImage?: string // Background image URL when chat is OPEN
  widgetBorderColor: string
  widgetBorderWidth: string
  widgetBorderRadius: string
  widgetShadowColor: string
  widgetShadowBlur: string
  widgetLabelText?: string
  widgetLabelColor?: string
  widgetLabelShowIcon?: boolean // Show icon next to label
  widgetLabelIconPosition?: 'left' | 'right' // Icon position relative to label
  // Widget behavior
  widgetAnimation: 'none' | 'fade' | 'slide' | 'bounce'
  widgetAnimationEntry?: 'fade' | 'slide-up' | 'slide-side' | 'scale'
  widgetAutoShow?: boolean // Deprecated in favor of widgetAutoShowDesktop
  widgetAutoShowDesktop?: boolean // Default true
  widgetAutoShowMobile?: boolean // Default false
  widgetAutoShowDelay: number // seconds
  widgetOffsetX: string // horizontal offset from edge
  widgetOffsetY: string // vertical offset from edge
  widgetZIndex: number
  showNotificationBadge: boolean
  notificationBadgeColor: string
  widgetCloseAvatarType?: 'icon' | 'image'
  widgetCloseAvatarIcon?: string
  widgetCloseImageUrl?: string
  popoverPosition?: 'top' | 'left' // Position of popover relative to widget: 'top' = above widget, 'left' = to the left of widget
  widgetPopoverMargin?: string // Margin/spacing between widget button and popover window
  widgetPopoverMarginLeft?: string // Extra left margin of the open popover window
  widgetPopoverMarginRight?: string // Extra right margin of the open popover window (shifts window left for right-anchored widgets)
  widgetPadding?: string // Padding of widget button
  widgetPaddingTop?: string
  widgetPaddingRight?: string
  widgetPaddingBottom?: string
  widgetPaddingLeft?: string
  // Chat window size
  chatWindowWidth: string
  chatWindowHeight: string
  // Chat window background blur for glassmorphism
  chatWindowBackgroundBlur?: number // Blur percentage (0-100) for glassmorphism effect
  chatWindowBackgroundOpacity?: number // Background opacity (0-100) for glassmorphism effect
  // Overlay configuration (shown when chat is open)
  overlayEnabled?: boolean // Enable/disable overlay when chat is open
  overlayColor?: string // Overlay background color (hex, rgb, rgba)
  overlayOpacity?: number // Overlay opacity (0-100)
  overlayBlur?: number // Overlay blur percentage (0-100) for glassmorphism effect
  // Chat window border (popover/fullpage frame)
  chatWindowBorderColor?: string
  chatWindowBorderWidth?: string
  chatWindowBorderRadius?: string
  // Individual chat window border width sides
  chatWindowBorderWidthTop?: string
  chatWindowBorderWidthRight?: string
  chatWindowBorderWidthBottom?: string
  chatWindowBorderWidthLeft?: string
  // Individual chat window border radius corners
  chatWindowBorderRadiusTopLeft?: string
  chatWindowBorderRadiusTopRight?: string
  chatWindowBorderRadiusBottomRight?: string
  chatWindowBorderRadiusBottomLeft?: string
  // Chat window shadow
  chatWindowShadowColor?: string
  chatWindowShadowBlur?: string
  // Chat window padding
  chatWindowPaddingX?: string
  chatWindowPaddingY?: string
  // Individual chat window padding sides
  chatWindowPaddingTop?: string
  chatWindowPaddingRight?: string
  chatWindowPaddingBottom?: string
  chatWindowPaddingLeft?: string
  // Typing indicator
  typingIndicatorStyle?: 'spinner' | 'dots' | 'pulse' | 'bounce'
  typingIndicatorColor?: string
  showThinkingMessage?: boolean // Show "Thinking..." text like OpenAI
  thinkingMessageText?: string // Custom text for thinking message (default: "Thinking...")
  // Header
  headerTitle?: string
  headerShowTitle?: boolean
  headerDescription?: string
  headerLogo?: string
  headerShowLogo?: boolean // Show/hide header logo
  headerBgColor?: string
  headerFontColor?: string
  headerFontFamily?: string
  headerShowAvatar?: boolean
  enableConversationRenaming?: boolean
  // Header Avatar (separate from message avatar)
  headerAvatarType?: 'icon' | 'image'
  headerAvatarIcon?: string
  headerAvatarIconColor?: string
  headerAvatarBackgroundColor?: string
  headerAvatarImageUrl?: string
  headerBorderEnabled?: boolean
  headerBorderColor?: string
  headerShowClearSession?: boolean // Show/hide clear session button in header
  headerShowCloseButton?: boolean // Show/hide close button in header
  headerPaddingX?: string
  headerPaddingY?: string
  // Individual header padding sides
  headerPaddingTop?: string
  headerPaddingRight?: string
  headerPaddingBottom?: string
  headerPaddingLeft?: string
  // Close Button
  closeButtonOffsetX?: string
  closeButtonOffsetY?: string
  headerCloseButtonBackgroundColor?: string // Background color for close button
  headerCloseButtonIconColor?: string // Icon color for close button
  headerCloseButtonHoverBackgroundColor?: string // Hover background color for close button
  // Footer/Input Area
  footerBgColor?: string
  footerBorderColor?: string
  footerBorderWidth?: string
  footerBorderRadius?: string
  // Individual footer border width sides
  footerBorderWidthTop?: string
  footerBorderWidthRight?: string
  footerBorderWidthBottom?: string
  footerBorderWidthLeft?: string
  // Individual footer border radius corners
  footerBorderRadiusTopLeft?: string
  footerBorderRadiusTopRight?: string
  footerBorderRadiusBottomRight?: string
  footerBorderRadiusBottomLeft?: string
  footerPaddingX?: string
  footerPaddingY?: string
  // Individual footer padding sides
  footerPaddingTop?: string
  footerPaddingRight?: string
  footerPaddingBottom?: string
  footerPaddingLeft?: string
  footerInputBgColor?: string
  footerInputBorderColor?: string
  footerInputBorderWidth?: string
  footerInputBorderRadius?: string
  // Individual footer input border width sides
  footerInputBorderWidthTop?: string
  footerInputBorderWidthRight?: string
  footerInputBorderWidthBottom?: string
  footerInputBorderWidthLeft?: string
  // Individual footer input border radius corners
  footerInputBorderRadiusTopLeft?: string
  footerInputBorderRadiusTopRight?: string
  footerInputBorderRadiusBottomRight?: string
  footerInputBorderRadiusBottomLeft?: string
  footerInputFontColor?: string
  // Send Button
  sendButtonIcon?: string
  sendButtonRounded?: boolean // Deprecated - use sendButtonBorderRadius instead
  sendButtonBorderRadius?: string
  sendButtonBorderRadiusTopLeft?: string
  sendButtonBorderRadiusTopRight?: string
  sendButtonBorderRadiusBottomRight?: string
  sendButtonBorderRadiusBottomLeft?: string
  sendButtonBgColor?: string
  sendButtonIconColor?: string
  sendButtonShadowColor?: string
  sendButtonShadowBlur?: string
  sendButtonPaddingX?: string
  sendButtonPaddingY?: string
  sendButtonPadding?: string
  sendButtonPaddingTop?: string
  sendButtonPaddingRight?: string
  sendButtonPaddingBottom?: string
  sendButtonPaddingLeft?: string
  sendButtonWidth?: string // Send button width (default: same as height for square)
  sendButtonHeight?: string // Send button height (default: same as width for square)
  sendButtonPosition?: 'inside' | 'outside' // Send button position: inside input or outside
  // File Upload Layout
  fileUploadLayout?: 'attach-first' | 'input-first'
  // Avatar (Bot/Assistant)
  avatarType?: 'icon' | 'image' | 'none'
  avatarIcon?: string
  avatarIconColor?: string
  avatarBackgroundColor?: string
  avatarImageUrl?: string
  // User Avatar
  showUserAvatar?: boolean
  userAvatarType?: 'icon' | 'image'
  userAvatarIcon?: string
  userAvatarIconColor?: string
  userAvatarBackgroundColor?: string
  userAvatarImageUrl?: string
  // PWA Configuration
  pwaEnabled?: boolean // Enable/disable PWA install banner in embedded chat
  pwaInstallScope?: 'chat' | 'website' // Scope of installation: 'chat' (inline banner) or 'website' (top overlay)
  pwaBannerText?: string // Custom banner text (default: "Install app for quick access")
  pwaBannerPosition?: 'under-header' | 'floating-bottom' | 'floating-top' | 'top-of-header'
  pwaBannerTitleText?: string
  pwaBannerDescriptionText?: string
  pwaBannerButtonText?: string
  pwaBannerButtonHoverBgColor?: string
  pwaBannerButtonHoverTextColor?: string
  // PWA Metadata
  pwaAppName?: string // App name for PWA manifest (default: chatbot name)
  pwaShortName?: string // Short name for home screen (default: first word of name)
  pwaDescription?: string // App description (default: chatbot description)
  pwaThemeColor?: string // Theme/status bar color (default: primaryColor)
  pwaBackgroundColor?: string // Splash screen background color (default: #ffffff)
  pwaIconUrl?: string // App icon URL (should be 512x512, will be resized)
  pwaIconSize?: number // Icon size in pixels (default: 512)
  pwaDisplayMode?: 'standalone' | 'fullscreen' | 'minimal-ui' // PWA display mode (default: standalone)
  // PWA Banner Styling
  pwaBannerBgColor?: string // Banner background color (default: primaryColor gradient)
  pwaBannerFontColor?: string // Banner text color (default: #ffffff)
  pwaBannerFontFamily?: string // Banner font family (default: inherit from chatbot)
  pwaBannerFontSize?: string // Banner text font size (default: 13px)
  pwaBannerBorderRadius?: string // Banner border radius (default: 8px)
  pwaBannerBorderColor?: string // Banner border color
  pwaBannerBorderWidth?: string // Banner border width
  pwaBannerShadow?: string // Banner box shadow (default: 0 -2px 10px rgba(0,0,0,0.1))
  pwaBannerShadowX?: string
  pwaBannerShadowY?: string
  pwaBannerShadowBlur?: string
  pwaBannerShadowSpread?: string
  pwaBannerShadowColor?: string
  pwaBannerPadding?: string // Banner padding (default: 10px 12px)
  // PWA Banner Button Styling
  pwaBannerButtonBgColor?: string // Install button background (default: #ffffff)
  pwaBannerButtonTextColor?: string // Install button text color (default: primaryColor)
  pwaBannerButtonBorderRadius?: string // Install button border radius (default: 4px)
  pwaBannerButtonFontSize?: string // Install button font size (default: 12px)
  pwaBannerMargin?: string // Banner margin (default: 0)
  // Emulator Page Configuration (for preview/configuration UI)
  pageBackgroundColor?: string // Background color for emulator page
  pageBackgroundImage?: string // Background image URL for emulator page
  pageTitle?: string // Title text shown in emulator
  pageDescription?: string // Description text shown in emulator
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  versions: ChatbotVersion[]
  currentVersion: string
}

