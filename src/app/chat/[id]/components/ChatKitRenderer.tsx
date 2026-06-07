'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatKitWrapper } from './ChatKitWrapper'
import { ChatWidgetButton } from './ChatWidgetButton'
import { getPopoverPositionStyle, getWidgetButtonStyle } from '../utils/chatStyling'

import { ChatbotConfig } from '../types'

interface ChatKitRendererProps {
  chatbot: ChatbotConfig
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isMobile?: boolean
  isPreview?: boolean  // True when in emulator preview mode (has ?preview=true in URL)
  isDesktopPreview?: boolean  // True when in emulator desktop view (overrides isMobile for widget visibility)
  shouldShowWidgetButton?: boolean // Control widget visibility external to internal logic (e.g. from page layout)
  onChatKitUnavailable?: () => void // Callback when ChatKit fails to load
  useChatKitInRegularStyle?: boolean // Propagate regular style setting from parent
}

export function ChatKitRenderer({
  chatbot,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isMobile = false,
  isPreview = false,
  isDesktopPreview = false,
  onChatKitUnavailable,
  useChatKitInRegularStyle: propUseChatKitInRegularStyle
}: ChatKitRendererProps) {
  const [chatkitLoaded, setChatkitLoaded] = useState(false)
  const [chatkitModule, setChatkitModule] = useState<any>(null)
  const [chatkitError, setChatkitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  // Initialize isOpen state
  // In preview mode (emulator), start open so user sees content immediately, but allow closing.
  // For fullpage/regular style, logic below will enforce it.
  const [isOpen, setIsOpenRaw] = useState<boolean>(false)

  // Debug wrapper for setIsOpen to trace all state changes
  const setIsOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const stack = new Error().stack?.split('\n').slice(2, 5).join('\n') || 'unknown'
    console.log(`[ChatKitRenderer] setIsOpen called with:`, value, '\nStack:', stack)
    setIsOpenRaw(value)
  }, [])

  // Log whenever isOpen actually changes
  React.useEffect(() => {
    console.log('[ChatKitRenderer] isOpen changed to:', isOpen, 'timestamp:', Date.now())
  }, [isOpen])

  // Use prop if provided, otherwise check config
  const useChatKitInRegularStyle = propUseChatKitInRegularStyle ?? (chatbot as any).useChatKitInRegularStyle === true

  // Compute agent ID once (must be before any early returns)
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId

  // Track if we need to notify parent about ChatKit unavailability
  // This must be in useEffect to avoid calling parent setState during render
  const notifiedUnavailableRef = React.useRef(false)

  useEffect(() => {
    // Notify parent when ChatKit is unavailable (error or missing agent ID)
    // Only notify once to prevent loops
    if (!notifiedUnavailableRef.current && onChatKitUnavailable) {
      if (chatkitError || !agentId) {
        console.log('🔄 Triggering ChatKit unavailable callback (from useEffect)')
        notifiedUnavailableRef.current = true
        onChatKitUnavailable()
      }
    }
  }, [chatkitError, agentId, onChatKitUnavailable])

  // Debug: Log chatbot config for ChatKit requirements on mount
  // Debug: Log chatbot config for ChatKit requirements on mount
  useEffect(() => {
    const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
    const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
    const apiKey = isAgentSDK ? chatbot.openaiAgentSdkApiKey : chatbot.chatkitApiKey

    console.log('🔍 ChatKit Configuration Check:', {
      engineType: chatbot.engineType,
      isChatKitEngine: chatbot.engineType === 'chatkit',
      isAgentSDK: chatbot.engineType === 'openai-agent-sdk',
      hasAgentId: !!agentId,
      agentIdPreview: agentId ? agentId.substring(0, 20) + '...' : 'NOT SET',
      hasApiKey: !!apiKey,
      chatbotId: chatbot.id,
      chatbotName: chatbot.name,
      useChatKitInRegularStyle
    })

    // Log warnings for missing configuration
    if (chatbot.engineType !== 'chatkit' && chatbot.engineType !== 'openai-agent-sdk') {
      console.warn('⚠️ ChatKit will NOT render: engineType is', chatbot.engineType, '(must be "chatkit" or "openai-agent-sdk")')
    }
    if (!agentId) {
      console.warn('⚠️ ChatKit will NOT render: agentId is not configured')
    }
  }, [chatbot, useChatKitInRegularStyle]) // Ensure this dependency array matches original or is correct

  // Auto-show for widget (only auto-open, don't auto-close)
  // Use refs to track one-time initialization and prevent re-triggering
  const initializedRef = React.useRef(false)
  const autoShowTriggeredRef = React.useRef(false)

  // Effect to enforce open state for fullpage/regular style
  // This runs when mode changes to fullpage/regular - it should NOT include isOpen in deps
  // to avoid infinite loops (calling setIsOpen in an effect that depends on isOpen)
  useEffect(() => {
    if (previewDeploymentType === 'fullpage' || useChatKitInRegularStyle) {
      console.log('🔄 Enforcing open state for fullpage/regular style', { previewDeploymentType, useChatKitInRegularStyle, timestamp: Date.now() })
      setIsOpen(true)
    }
  }, [previewDeploymentType, useChatKitInRegularStyle]) // Removed isOpen to prevent infinite loop

  // Effect for auto-show logic (only run once per mount/session)
  useEffect(() => {
    if (!chatbot) return

    // Fullpage/regular style is handled by the enforcement effect above
    // IMPORTANT: Check this BEFORE initializedRef to prevent setIsOpen(false) from running
    if (previewDeploymentType === 'fullpage' || useChatKitInRegularStyle) {
      return
    }

    // Only run initialization logic once per mount
    if (initializedRef.current) return
    initializedRef.current = true

    // For popover/popup-center, start closed to show widget button
    setIsOpen(false)

    // Check if auto-show is enabled
    // Check if auto-show is enabled
    // Separate logic for mobile and desktop
    // Default Desktop: true (or legacy widgetAutoShow value)
    // Default Mobile: false
    const autoOpenDesktop = (chatbot as any).widgetAutoShowDesktop !== undefined
      ? (chatbot as any).widgetAutoShowDesktop
      : ((chatbot as any).widgetAutoShow !== undefined ? (chatbot as any).widgetAutoShow : true)

    const autoOpenMobile = (chatbot as any).widgetAutoShowMobile || false

    const shouldAuto = isMobile ? autoOpenMobile : autoOpenDesktop

    if (shouldAuto && !autoShowTriggeredRef.current) {
      autoShowTriggeredRef.current = true
      const delayMs = ((chatbot as any).widgetAutoShowDelay || 0) * 1000
      const t = setTimeout(() => setIsOpen(true), delayMs)
      return () => clearTimeout(t)
    }
  }, [chatbot, previewDeploymentType, useChatKitInRegularStyle])

  // Load ChatKit script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script already loaded
    if (document.querySelector('script[src*="chatkit.js"]')) {
      setChatkitLoaded(true)
      return
    }

    // Load ChatKit script
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.async = true
    script.onload = () => {
      console.log('ChatKit script loaded')
      setChatkitLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load ChatKit script')
      setChatkitError('Failed to load ChatKit script')
      toast.error('Failed to load ChatKit')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  // Compute widget button visibility for loading states (popover/popup-center modes)
  const shouldShowWidgetInLoading =
    !useChatKitInRegularStyle &&
    (previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center')

  // Compute widget button styles for loading states
  const widgetButtonStyle = getWidgetButtonStyle(chatbot, (chatbot as any).chatkitOptions)
  const popoverPositionStyle = getPopoverPositionStyle(chatbot)

  // Helper to render widget button in loading/error states
  const renderWidgetButton = () => {
    if (!shouldShowWidgetInLoading) return null
    return (
      <ChatWidgetButton
        chatbot={chatbot}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        widgetButtonStyle={widgetButtonStyle}
        popoverPositionStyle={popoverPositionStyle}
      />
    )
  }

  // Load ChatKit module when script is loaded
  useEffect(() => {
    if (!chatkitLoaded || !agentId || chatkitModule || isInitializing) {
      return
    }

    setIsInitializing(true)
    console.log('Loading ChatKit module...')

    // Import ChatKit module dynamically
    import('@openai/chatkit-react')
      .then((module) => {
        console.log('ChatKit module loaded:', module)
        if (!module.useChatKit) {
          throw new Error('useChatKit not found in @openai/chatkit-react')
        }
        setChatkitModule(module)
        setIsInitializing(false)
      })
      .catch((error) => {
        // Handle module not found error gracefully
        const isModuleNotFound =
          error instanceof Error &&
          (error.message.includes('Cannot find module') ||
            error.message.includes('Failed to fetch dynamically imported module') ||
            (error as any).code === 'MODULE_NOT_FOUND')

        if (isModuleNotFound) {
          console.warn('ChatKit module (@openai/chatkit-react) is not installed. Please run: npm install @openai/chatkit-react')
        } else {
          console.error('Error importing ChatKit module:', error)
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setChatkitError(errorMessage)
        setIsInitializing(false)

        // Notify parent that ChatKit is unavailable so it can fall back to regular chat
        if (onChatKitUnavailable) {
          onChatKitUnavailable()
        }
        console.warn('ChatKit module not available, will use regular chat style')
      })
  }, [chatkitLoaded, agentId, chatkitModule, isInitializing, onChatKitUnavailable])

  // Debug: Trace ChatKitRenderer state
  console.log('ChatKitRenderer state:', {
    chatkitLoaded,
    chatkitModule: !!chatkitModule,
    chatkitError,
    isInitializing,
    isMobile,
    previewDeploymentType,
    agentId,
    engineType: chatbot.engineType,
    timestamp: new Date().toISOString(),
    useChatKitInRegularStyle
  })

  // Render ChatKit component when ready
  if (chatkitModule && agentId && !chatkitError) {
    console.log('✅ ChatKit ready to render')
    return (
      <ChatKitWrapper
        chatkitModule={chatkitModule}
        chatbot={chatbot as any}
        onError={setChatkitError}
        previewDeploymentType={previewDeploymentType}
        isInIframe={isInIframe}
        isMobile={isMobile}
        isPreview={isPreview}
        isDesktopPreview={isDesktopPreview}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        useChatKitInRegularStyle={useChatKitInRegularStyle}
        isNative={!useChatKitInRegularStyle}
      />
    )
  }

  // If ChatKit fails to load, show error state (callback is handled by useEffect above)
  if (chatkitError) {
    console.error('❌ ChatKit error detected:', chatkitError)

    // Show visible error in development, return null in production to use fallback
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="max-w-md">
            <div className="text-red-500 mb-2">⚠️ ChatKit Error</div>
            <p className="text-sm text-muted-foreground mb-4">{chatkitError}</p>
            <p className="text-xs text-muted-foreground">Falling back to regular chat...</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Loading state - show spinner while initializing
  if (!chatkitLoaded) {
    console.log('⏳ ChatKit script loading...')
    // For popover modes, show widget button during loading
    if (shouldShowWidgetInLoading) {
      return (
        <>
          {renderWidgetButton()}
        </>
      )
    }
    return (
      <div className="h-full w-full bg-transparent" />
    )
  }

  // No agent ID configured - show error BEFORE checking module loading
  // This prevents infinite "Initializing..." spinner when agentId is missing
  // Note: Callback is handled by useEffect above
  if (!agentId) {
    console.error('❌ ChatKit cannot render: No agent ID configured')
    console.log('💡 To fix: Set chatkitAgentId (for ChatKit engine) or openaiAgentSdkAgentId (for Agent SDK)')

    // Show helpful error message
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="max-w-md">
          <div className="text-amber-500 mb-2">⚠️ ChatKit Configuration Missing</div>
          <p className="text-sm text-muted-foreground mb-2">
            Agent ID is not configured.
          </p>
          <p className="text-xs text-muted-foreground">
            Please set the Agent ID in the chatbot&apos;s Engine Configuration.
          </p>
        </div>
      </div>
    )
  }

  if (isInitializing || !chatkitModule) {
    console.log('⏳ ChatKit module initializing...')
    // For popover modes, show widget button during initialization
    if (shouldShowWidgetInLoading) {
      return (
        <>
          {renderWidgetButton()}
        </>
      )
    }
    return (
      <div className="h-full w-full bg-transparent" />
    )
  }

  return null
}
