'use client'

// Import chat-page.css HERE (not in layout.tsx) so it lands in the static CSS
// bundle linked in the initial <head>, not in streamed RSC HTML. This ensures
// the background-color: transparent !important rule is render-blocking.
// next-themes' enableColorScheme={false} in providers.tsx prevents it from
// injecting style="color-scheme: dark;".
import './chat-page.css'
import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { X, Bot, Menu, Loader2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from './types'
import { ChatKitRenderer } from './components/ChatKitRenderer'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatContent } from './components/ChatContent'
import { ChatHeader } from './components/ChatHeader'
import { ThreadSelector } from './components/ThreadSelector'
import { useChatMessages } from './hooks/useChatMessages'
import { useChatHistory } from './hooks/useChatHistory'
import { useChatFileHandling } from './hooks/useChatFileHandling'
import { useChatbotLoader } from './hooks/useChatbotLoader'
import { useChatVoice } from './hooks/useChatVoice'
import { useOpenAIRealtimeVoice } from './hooks/useOpenAIRealtimeVoice'
import { useAgentThread } from './hooks/useAgentThread'
import {
  getChatStyle,
  getPopoverPositionStyle,
  getContainerStyle,
  getOverlayStyle,
  getWidgetButtonStyle,
  ensureUnits,
  SHADOW_BUFFER,
  BUTTON_SHADOW_BUFFER,
} from './utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { ChatWidgetButton } from './components/ChatWidgetButton'
import { GetStartedPopover } from './components/GetStartedPopover'
import { WidgetChatContainer } from './components/WidgetChatContainer'
import { FullPageChatLayout } from './components/FullPageChatLayout'
import { PWAInstallBanner } from './components/PWAInstallBanner'

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('mode') === 'embed'
  const isPwaOnly = searchParams.get('mode') === 'pwa-only'

  const urlDeploymentType = searchParams.get('deploymentType') || searchParams.get('type')
  // Parent viewport width passed by the embed script — more reliable than window.screen.width
  // inside the iframe (screen.width can return desktop resolution in DevTools Responsive mode)
  const parentWidthParam = searchParams.get('pw')
  const isPreview = searchParams.get('preview') === 'true'
  const urlLocale = searchParams.get('locale') || searchParams.get('lang')
  
  // Content Overrides for Multi-language support
  const urlGreeting = searchParams.get('greeting') || searchParams.get('opener')
  const urlPlaceholder = searchParams.get('placeholder')
  const urlPrompts = [
    searchParams.get('prompt1'),
    searchParams.get('prompt2'),
    searchParams.get('prompt3'),
    searchParams.get('prompt4'),
  ].filter(Boolean) as string[]

  const chatbotId = params?.id as string
  const [previewDeploymentType, setPreviewDeploymentType] = useState<'popover' | 'fullpage' | 'popup-center'>(
    (urlDeploymentType === 'popover' || urlDeploymentType === 'popup-center') ? urlDeploymentType : 'fullpage'
  )
  const [isOpen, setIsOpen] = useState<boolean>(urlDeploymentType === 'fullpage' || (!urlDeploymentType && !isEmbed))
  // Initialize isInIframe from isEmbed (URL param) so the chatbot loader immediately
  // skips the private API on first render, avoiding auth redirect failures in cross-site iframes
  const [isInIframe, setIsInIframe] = useState(isEmbed)
  
  // Track if viewport is mobile
  const [isMobile, setIsMobile] = useState(false)
  // Use ref to track isMobile for resize effect without causing re-runs
  const isMobileRef = useRef(false)
  // Store the latest width from parent-viewport message to survive resizes/re-renders
  const latestParentWidthRef = useRef<number | null>(null)

  const [showGetStarted, setShowGetStarted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const prevIsOpenRef = useRef(isOpen)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [input, setInput] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('') // Separate state for voice transcript display
  // Track if ChatKit is unavailable (for fallback to regular chat)
  const [chatKitUnavailable, setChatKitUnavailable] = useState(false)
  // Track if the widget has ever been opened so we can keep it mounted (preserving chat history)
  const hasEverOpenedRef = useRef(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      // In preview mode (emulator), respect the explicit device selection
      const previewDevice = searchParams.get('previewDevice')
      if (isPreview && previewDevice) {
        const mobile = previewDevice === 'mobile' || previewDevice === 'tablet'
        setIsMobile(mobile)
        isMobileRef.current = mobile
        return
      }

      // In embed mode (NOT preview/emulator), detect mobile from the parent viewport width.
      // window.screen.width inside the iframe can return the desktop monitor resolution in
      // Chrome DevTools Responsive mode or on some Android browsers (physical pixels).
      // The embed script passes the parent's window.innerWidth as ?pw=<n> for accuracy.
      let width: number
      if (isEmbed && !isPreview) {
        // Priority: Latest postMessage width > Initial URL param > window.screen.width
        const latestPw = latestParentWidthRef.current
        const initialPw = parentWidthParam !== null ? parseInt(parentWidthParam, 10) : NaN
        
        if (latestPw !== null && !isNaN(latestPw)) {
          width = latestPw
        } else {
          width = !isNaN(initialPw) ? initialPw : window.screen.width
        }
      } else {
        width = window.innerWidth
      }
      const mobile = width < 1024
      setIsMobile(mobile)
      isMobileRef.current = mobile
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isEmbed, isPreview])

  // Auto-hide Get Started on mobile
  useEffect(() => {
    if (isMobile && showGetStarted) {
      setShowGetStarted(false)
    }
  }, [isMobile, showGetStarted])

  // Check if page is loaded in an iframe
  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  // Auto-open on mobile fullpage embed (since popover was converted to fullpage)
  // FIXED: This caused an infinite loop in Embed mode because closing the widget shrinks the iframe,
  // which triggers isMobile=true, which forces setIsOpen(true), which expands the iframe.
  /* 
  useEffect(() => {
    if (isMobile && isEmbed) {
      setIsOpen(true)
    }
  }, [isMobile, isEmbed])
  */

  // Set transparent background for embed mode to prevent black iframe in dark OS mode.
  // useLayoutEffect fires before the browser paints React content. We no longer
  // manage color-scheme via inline styles as next-themes' enableColorScheme={false}
  // prevents it from injecting unwanted attributes.
  useLayoutEffect(() => {
    // Remove any color-scheme inline style next-themes may have injected before hydration
    document.documentElement.style.removeProperty('color-scheme')
    if (isEmbed) {
      document.documentElement.classList.add('chat-embed-mode')
      document.documentElement.style.backgroundColor = 'transparent'
    } else {
      document.documentElement.classList.remove('chat-embed-mode')
      document.documentElement.style.backgroundColor = ''
    }
    return () => {
      document.documentElement.classList.remove('chat-embed-mode')
      document.documentElement.style.backgroundColor = ''
    }
  }, [isEmbed])

  // Load chatbot
  const { chatbot, setChatbot, emulatorConfig, setEmulatorConfig } = useChatbotLoader({
    chatbotId,
    previewDeploymentType,
    isInIframe,
    locale: urlLocale,
    greeting: urlGreeting,
    placeholder: urlPlaceholder,
    prompts: urlPrompts.length > 0 ? urlPrompts : null,
    onChatbotLoaded: (loadedChatbot) => {
      // Dismiss the server-injected loading screen
      const loader = document.getElementById('pwa-loading-overlay')
      if (loader) {
        loader.style.opacity = '0'
        setTimeout(() => {
          loader.remove()
        }, 500)
      }

      // Prioritize URL deployment type if in embed mode (allows script to override DB default)
      const effectiveDeploymentType = (isEmbed && urlDeploymentType)
        ? urlDeploymentType
        : loadedChatbot.deploymentType

      if (effectiveDeploymentType) {
        setPreviewDeploymentType(effectiveDeploymentType as any)

        // Update isOpen state based on the effective deployment type
        if (effectiveDeploymentType === 'popover' || effectiveDeploymentType === 'popup-center') {
          // Check for auto-show setting, otherwise default to closed (false)
          // Note: Logic in useEffect below handles auto-show timing, but we should set initial state correctly

          // To match Embed logic:
          const autoOpenDesktop = (loadedChatbot as any).widgetAutoShowDesktop !== undefined
            ? (loadedChatbot as any).widgetAutoShowDesktop
            : ((loadedChatbot as any).widgetAutoShow !== undefined ? (loadedChatbot as any).widgetAutoShow : true)
          const autoOpenMobile = (loadedChatbot as any).widgetAutoShowMobile || false
          const shouldAuto = isMobile ? autoOpenMobile : autoOpenDesktop

          if (!shouldAuto) {
            setIsOpen(false)
          }
          // If shouldAuto is true, the useEffect [chatbot, previewDeploymentType] will handle opening it after delay
        } else {
          // Fullpage always open
          setIsOpen(true)
        }
      }
      // Add greeting message for non-fullpage modes
      const greetingMessage = loadedChatbot.openaiAgentSdkGreeting || loadedChatbot.conversationOpener
      if (greetingMessage && (previewDeploymentType !== 'fullpage' || isInIframe)) {
        // This will be handled by chat history for fullpage mode
      }
    },
  })

  // Message management (must be initialized first to provide setMessages)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

  // OpenAI Agent SDK Thread management (must be initialized before useChatMessages)
  const {
    currentThreadId,
    setCurrentThreadId,
    threads,
    isLoading: threadsLoading,
    createThread,
    updateThreadTitle,
    deleteThread,
    isEnabled: threadManagementEnabled,
  } = useAgentThread({
    chatbot,
    chatbotId,
    spaceId: (chatbot as any)?.spaceId || null,
  })

  const {
    messages,
    setMessages,
    isLoading,
    isSessionExpired,
    selectedFollowUp,
    sendMessage,
    resetChat,
    handleFollowUpClick,
    messagesEndRef,
    scrollAreaRef,
  } = useChatMessages({
    chatbot,
    currentChatId,
    previewDeploymentType,
    isInIframe,
    threadId: threadManagementEnabled ? currentThreadId : null,
    chatbotId: threadManagementEnabled ? chatbotId : undefined,
    spaceId: threadManagementEnabled ? ((chatbot as any)?.spaceId || null) : undefined,
    onThreadIdChange: (newThreadId) => {
      if (threadManagementEnabled) {
        setCurrentThreadId(newThreadId)
        // Create thread record if it doesn't exist
        if (newThreadId && !threads.find(t => t.threadId === newThreadId)) {
          createThread(newThreadId)
        }
      }
    },
  })

  // Reset chat session when widget is closed (if configured)
  useEffect(() => {
    if (!chatbot || !chatbot.resetSessionOnClose) {
      prevIsOpenRef.current = isOpen
      return
    }

    if (prevIsOpenRef.current && !isOpen) {
      console.log('[ChatPage] Resetting session on widget close')
      resetChat()
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, chatbot, resetChat])

  // Chat history management (only for non-OpenAI Agent SDK chatbots)
  const {
    chatHistory,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
  } = useChatHistory({
    chatbotId,
    chatbot,
    previewDeploymentType,
    isInIframe,
    messages,
    setMessages,
    currentChatId,
    setCurrentChatId,
  })

  // File handling
  const {
    attachments,
    setAttachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  } = useChatFileHandling()

  // Voice agent - select provider based on chatbot config
  const voiceProvider = chatbot?.voiceProvider || 'browser'

  // Browser-based voice (Web Speech API)
  const browserVoice = useChatVoice({
    chatbot: voiceProvider === 'browser' ? chatbot : null,
    messages,
    isLoading,
    onTranscript: (transcript) => {
      setInput(transcript)
    },
    onSendMessage: (content) => {
      sendMessage(content)
    },
  })

  // OpenAI Realtime API voice
  const openaiRealtimeVoice = useOpenAIRealtimeVoice({
    chatbot: voiceProvider === 'openai-realtime' ? chatbot : null,
    onTranscript: (transcript, isUserInput) => {
      // For realtime voice, distinguish between user input and AI response
      if (isUserInput) {
        // User is speaking - update input field
        setInput(transcript)
        setCurrentTranscript(transcript) // Also show in VoiceWaveUI
      } else {
        // AI is responding - only show in VoiceWaveUI subtitle, not in input field
        setCurrentTranscript(transcript)
        // Don't update input field for AI responses
      }
      console.log('📝 Transcript updated:', transcript, isUserInput ? '(user)' : '(AI)')
    },
  })

  // Select the appropriate voice hook based on provider
  const voiceState = voiceProvider === 'openai-realtime'
    ? {
      isRecording: openaiRealtimeVoice.isRecording,
      isVoiceEnabled: openaiRealtimeVoice.isVoiceEnabled,
      isSpeaking: openaiRealtimeVoice.isSpeaking,
      audioLevel: openaiRealtimeVoice.audioLevel, // Real-time audio level for visualization
      handleStartRecording: openaiRealtimeVoice.startRecording,
      handleStopRecording: openaiRealtimeVoice.stopRecording,
      toggleVoiceOutput: () => {
        // For OpenAI Realtime, toggle is handled by the API
        if (openaiRealtimeVoice.isSpeaking) {
          openaiRealtimeVoice.stopRecording()
        }
      },
    }
    : {
      isRecording: browserVoice.isRecording,
      isVoiceEnabled: browserVoice.isVoiceEnabled,
      isSpeaking: browserVoice.isSpeaking,
      handleStartRecording: browserVoice.handleStartRecording,
      handleStopRecording: browserVoice.handleStopRecording,
      toggleVoiceOutput: browserVoice.toggleVoiceOutput,
    }

  const {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    audioLevel = 0, // Default to 0 if not available
    handleStartRecording,
    handleStopRecording,
    toggleVoiceOutput,
  } = voiceState

  // Compute if native ChatKit is being used (for skipping redundant auto-show and resize messages)
  // Native ChatKit handles its own auto-show and resize via ChatKitRenderer/ChatKitWrapper
  // Note: We only need this for embed mode checking. In embed mode, isDesktopPreview is always false.
  const isNativeChatKitMode = useMemo(() => {
    if (!chatbot || chatKitUnavailable) return false
    const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
    const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
    const shouldRender = (chatbot.engineType === 'chatkit' || chatbot.engineType === 'openai-agent-sdk') && agentId
    // In embed mode, useChatKitInRegularStyle depends on chatbot config only (isMobile && !isEmbed is false when isEmbed=true)
    // So for embed mode detection, we only check the explicit config flag
    const regularStyleExplicit = (chatbot as any).useChatKitInRegularStyle === true
    return shouldRender && !regularStyleExplicit
  }, [chatbot, chatKitUnavailable])

  // Auto-show for widget (only auto-open, don't auto-close)
  // SKIP for native ChatKit in embed mode - ChatKitRenderer handles its own auto-show logic
  // to prevent conflicting state management that could cause loops
  const isInitialLoadRef = useRef(true)
  const lastChatbotIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (!chatbot) return
    
    // Reset initial load flag when chatbot ID changes (new chatbot loaded)
    if (chatbot.id !== lastChatbotIdRef.current) {
      isInitialLoadRef.current = true
      lastChatbotIdRef.current = chatbot.id
    }
    
    // Skip auto-show for native ChatKit in embed mode - ChatKitRenderer handles its own auto-show
    if (isNativeChatKitMode && isEmbed) {
      console.log('[ChatPage] Skipping auto-show - native ChatKit handles its own state')
      return
    }
    if (previewDeploymentType === 'fullpage') {
      setIsOpen(true) // Full page always shows
      isInitialLoadRef.current = false
      return
    }
    
    // In preview/emulator mode, preserve the current isOpen state when config updates
    // Only reset isOpen on initial load, not on subsequent config updates
    if (isInitialLoadRef.current) {
      // For popover/popup-center, start closed to show widget button (only on initial load)
      setIsOpen(false)
      isInitialLoadRef.current = false
      
      const autoOpenDesktop = (chatbot as any).widgetAutoShowDesktop !== undefined
        ? (chatbot as any).widgetAutoShowDesktop
        : ((chatbot as any).widgetAutoShow !== undefined ? (chatbot as any).widgetAutoShow : true)
      const autoOpenMobile = (chatbot as any).widgetAutoShowMobile || false
      const shouldAuto = isMobile ? autoOpenMobile : autoOpenDesktop

      if (shouldAuto) {
        const delayMs = ((chatbot as any).widgetAutoShowDelay || 0) * 1000
        const t = setTimeout(() => setIsOpen(true), delayMs)
        return () => clearTimeout(t)
      }
    }
    // If not initial load (i.e., config update), preserve current isOpen state
  }, [chatbot, previewDeploymentType, isNativeChatKitMode, isEmbed])

  // Inject greeting message for popover/popup-center modes (only once on mount)
  const greetingInjectedRef = useRef(false)
  useEffect(() => {
    if (!chatbot || greetingInjectedRef.current || isNativeChatKitMode) return

    const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'

    if (isPopover) {
       const greeting = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener
       if (greeting) {
         greetingInjectedRef.current = true
         setMessages([{
           id: 'greeting-' + Date.now(),
           role: 'assistant',
           content: greeting,
           timestamp: new Date()
         }])
       }
    }
  }, [chatbot, previewDeploymentType, isNativeChatKitMode])

  // Notify parent window about open/close state for iframe resizing
  // For native ChatKit in embed mode, this sends the INITIAL resize to make the container
  // visible (it starts as visibility:hidden). ChatKitWrapper takes over for subsequent resizes.
  useEffect(() => {
    if (!chatbot) return

    if (isEmbed || isInIframe) {
      let width = '100%'
      let height = '100%'
      
      // Positioning data for the parent frame
      const x = chatbot as any
      const pos = (x.widgetPosition || 'bottom-right') as string
      const offsetX = ensureUnits(x.widgetOffsetX, '20px')
      const offsetY = ensureUnits(x.widgetOffsetY, '20px')
      
      const positionData: any = {}

      const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'

      if (isPopover) {
        if (!isOpen) {
          // Closed state: use BUTTON_SHADOW_BUFFER (12px) instead of SHADOW_BUFFER (40px)
          // to minimise the transparent iframe area that blocks host-page interactions.
          const widgetSizeRaw = parseFloat(x.widgetSize || '60') || 60
          const size = `${widgetSizeRaw + (BUTTON_SHADOW_BUFFER * 2)}px`
          width = size
          height = size
        } else if (!isMobileRef.current) {
          // Desktop Popover - use ref to avoid dependency loop
          const baseWidth = parseFloat(extractNumericValue(ensureUnits(x.chatWindowWidth, '450px'))) || 450
          const baseHeight = parseFloat(extractNumericValue(ensureUnits(x.chatWindowHeight, '800px'))) || 800
          const widgetSizeRaw = parseFloat(x.widgetSize || '60') || 60
          const popoverMarginPx = parseFloat(x.widgetPopoverMargin || '10') || 10
          const popoverPos = x.popoverPosition || 'top'
          const popoverMarginLeft = parseFloat(x.widgetPopoverMarginLeft || '0') || 0
          const popoverMarginRight = parseFloat(x.widgetPopoverMarginRight || '0') || 0

          if (popoverPos === 'left') {
            // Side-by-side: popover is beside the button — needs extra width for the button + margin
            width = `${baseWidth + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
            height = `${baseHeight + (SHADOW_BUFFER * 2)}px`
          } else {
            // Default 'top': popover is above the button — needs extra height for the button + margin
            width = `${baseWidth + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
            height = `${baseHeight + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2)}px`
          }
        }
        
        // Calculate parent positions.
        // ParentFrame = UserOffset - buffer, internal element at +buffer = UserOffset on screen.
        // Closed: use BUTTON_SHADOW_BUFFER (button only — small iframe).
        // Open: use SHADOW_BUFFER (chat window needs full shadow clearance).
        const activeBuffer = isOpen ? SHADOW_BUFFER : BUTTON_SHADOW_BUFFER
        const parentOffsetX = `calc(${offsetX} - ${activeBuffer}px)`
        const parentOffsetY = `calc(${offsetY} - ${activeBuffer}px)`
        
        if (isOpen && isMobileRef.current) {
          // Force top-left anchor for 100% fullscreen on mobile
          // This prevents height: 100% combined with bottom: 20px from shifting the frame offscreen
          positionData.top = '0px'
          positionData.left = '0px'
        } else {
          if (pos.includes('bottom')) positionData.bottom = parentOffsetY
          else positionData.top = parentOffsetY
          
          if (pos.includes('right')) positionData.right = parentOffsetX
          else positionData.left = parentOffsetX
          
          if (pos.includes('center')) {
            positionData.left = '50%'
            positionData.transform = 'translateX(-50%)'
          }
        }
      }



      window.parent.postMessage({
        type: 'chat-widget-resize',
        isOpen,
        width,
        height,
        ...positionData,
        deploymentType: previewDeploymentType
      }, '*')
    }
  // isMobile added so resize re-fires on device rotation or when mobile is detected after initial load
  }, [isOpen, isEmbed, isInIframe, previewDeploymentType, isNativeChatKitMode, chatbot, isMobile])

  // Listen for preview mode changes and external control commands
  // Use ref to track previous preview mode to avoid unnecessary isOpen resets
  const prevPreviewModeRef = useRef<string | null>(null)
  
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = event.data
        if (!data || typeof data !== 'object') return
        
        // Debug logging for chat-related messages
        if (data.type && (data.type.startsWith('chatbot-') || data.type.includes('chat'))) {
           // console.log('[ChatPage] Received message:', data.type, data)
        }

        if (data.type === 'chatbot-preview-mode') {
          const val = data.value
          if (val === 'popover' || val === 'fullpage' || val === 'popup-center') {
            // Only reset isOpen state when preview mode ACTUALLY changes
            const modeChanged = prevPreviewModeRef.current !== val
            prevPreviewModeRef.current = val
            
            setPreviewDeploymentType(val)
            
            if (modeChanged) {
              // Reset isOpen state when preview mode changes to show widget button
              if (val === 'popover' || val === 'popup-center') {
                setIsOpen(false)
              } else {
                setIsOpen(true)
              }
            }
          }
        }
        if (data.type === 'clear-session') {
          setMessages([])
        }
        // Parent embed script reports its viewport width (sent on load and resize).
        // Use this to keep mobile detection accurate when the iframe itself is small.
        if (data.type === 'parent-viewport' && isEmbed) {
          const newWidth = data.width as number
          latestParentWidthRef.current = newWidth
          const mobile = newWidth < 1024
          if (mobile !== isMobileRef.current) {
            setIsMobile(mobile)
            isMobileRef.current = mobile
          }
        }
        // Handle external control commands from parent window (embed script)
        if (data.type === 'open-chat') {
          handleOpenChat()
        }
        if (data.type === 'close-chat') {
          setIsOpen(false)
          setShowGetStarted(false)
        }
      } catch (err) {
        console.error('[ChatPage] Error processing message:', err)
      }
    }
    
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const handleClose = () => {
    if (isEmbed || isInIframe) {
      window.parent.postMessage({ type: 'close-chat' }, '*')
    }
    setIsOpen(false)
    setShowGetStarted(false)
  }

  const handleOpenChat = () => {
    // Check if Get Started is enabled
    // strict check for desktop only
    const isMobile = isMobileRef.current
    const getStarted = (chatbot as any)?.chatkitOptions?.getStarted
    
    if (getStarted?.enabled && !isOpen && !isMobile) {
      // Check session storage
      const hasShown = sessionStorage.getItem(`chatkit_get_started_shown_${chatbotId}`)
      if (!hasShown) {
          setShowGetStarted(true)
          // We don't set isOpen=true yet, we wait for user to click "Start"
      } else {
          setIsOpen(true)
      }
    } else {
      setIsOpen(true)
    }
  }

  const handleStartChat = () => {
    setShowGetStarted(false)
    setIsOpen(true)
    // Mark as shown for this session
    sessionStorage.setItem(`chatkit_get_started_shown_${chatbotId}`, 'true')
  }

  const toggleChat = () => {
    if (isOpen) {
      handleClose()
    } else {
      if (showGetStarted) {
        // If get started is already showing, clicking widget button again should probably close it
        setShowGetStarted(false)
      } else {
        handleOpenChat()
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      sendMessage(input, attachments.length > 0 ? attachments : undefined)
      setInput('')
      clearAttachments()
    }
  }

  // Determine deployment type - force fullpage on mobile/tablet for popover modes
  // BUT: In preview/emulator mode with desktop device, preserve the selected deployment type so users can preview widget behavior
  // For mobile/tablet preview, still apply fullpage conversion to match production mobile behavior
  const previewDevice = searchParams.get('previewDevice') // 'desktop' | 'tablet' | 'mobile'
  const isDesktopPreview = isPreview && previewDevice === 'desktop'
  const baseDeploymentType = (isEmbed && searchParams.get('type'))
    ? (searchParams.get('type') as 'popover' | 'fullpage' | 'popup-center')
    : (isEmbed ? 'fullpage' : previewDeploymentType)

  // We no longer force fullpage on mobile.
  // Instead, getContainerStyle in chatStyling.ts handles rendering the popover as full screen
  // This allows the iframe embedded parent scripts to receive proper resize events while still displaying 100% on mobile.
  const effectiveDeploymentType = baseDeploymentType

  // Memoize widget button style to ensure it recomputes when chatbot config changes
  const widgetButtonStyle = useMemo(() => {
    if (!chatbot) return {}
    return getWidgetButtonStyle(chatbot, (chatbot as any).chatkitOptions)
  }, [chatbot])

  if (!chatbot) {
    return <div className="h-screen w-screen bg-transparent" />
  }

  // Check if chatbot is enabled (default to true if not set)
  const chatbotEnabled = (chatbot as any).chatbotEnabled !== false

  // If chatbot is disabled, don't render anything
  if (!chatbotEnabled) {
    return null
  }

  // PWA Only mode - used for separate iframe architecture
  if (isPwaOnly) {
    return (
      <div style={{ pointerEvents: 'auto', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        <PWAInstallBanner
          chatbot={chatbot}
          isMobile={true}
          onDismiss={() => {
            if (isEmbed || isInIframe) {
              window.parent.postMessage({ type: 'close-pwa-banner' }, '*')
            }
          }}
          onInstall={() => {
            const baseUrl = window.location.origin
            const pwaUrl = `${baseUrl}/chat/${chatbotId}?pwa=1`
            window.open(pwaUrl, '_blank', 'noopener,noreferrer')
          }}
        />
      </div>
    )
  }

  const chatStyle = getChatStyle(chatbot, (chatbot as any).chatkitOptions)
  const containerStyle = getContainerStyle(
    chatbot, 
    effectiveDeploymentType, 
    emulatorConfig, 
    isMobile, 
    isEmbed, 
    isPreview, // Use generic isPreview flag so mobile preview respects popover config
    (chatbot as any).chatkitOptions
  )
  const overlayStyle = getOverlayStyle(effectiveDeploymentType, chatbot, isOpen, (chatbot as any).chatkitOptions)
  const popoverPositionStyle = getPopoverPositionStyle(chatbot, isEmbed, isOpen)

  // Render ChatKit only if engine type is chatkit or openai-agent-sdk with agent ID
  // In DESKTOP preview mode, don't force regular style on mobile - allow widget preview
  // Mobile/tablet preview still uses regular style on mobile to match production
  // In EMBED mode, do NOT force regular style just because iframe is small (mobile-sized).
  const useChatKitInRegularStyle = (chatbot as any).useChatKitInRegularStyle === true || isMobile
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
  const shouldRenderChatKit =
    !chatKitUnavailable &&
    (chatbot.engineType === 'chatkit' || chatbot.engineType === 'openai-agent-sdk') &&
    agentId



  const isNativeChatKit = shouldRenderChatKit && !useChatKitInRegularStyle

  // On mobile, when chat is open, hide widget button (fullpage mode covers entire screen)
  // Widget button should show in embed mode if deployment type is popover/popup-center
  // Also show widget button on mobile embed when chat is closed (so user can re-open)
  // Determine if the container should be shown based on isOpen state and deployment type.
  // - Fullpage (desktop non-widget) is always open.
  // - Popover/Popup-center (widget) respects isOpen.
  // Since mobile now uses CSS `100%` rather than faking `fullpage`, we can just check `isOpen` for all widget-based deployments.
  const isOriginallyWidgetBased = baseDeploymentType === 'popover' || baseDeploymentType === 'popup-center'

  const shouldShowWidgetButton = !isNativeChatKit && (
    // Show widget button when closed, OR when open on desktop (not mobile)
    // On mobile, fullpage mode covers screen so we hide button when open
    isOriginallyWidgetBased && (!isOpen || !isMobile)
  )

  // Fullpage is always visible, Widgets respect isOpen
  const shouldShowContainer = !isNativeChatKit && (
    effectiveDeploymentType === 'fullpage' ? true : isOpen
  )

  if (isOpen && !hasEverOpenedRef.current) {
    hasEverOpenedRef.current = true
  }
  // For widget modes: keep container mounted after first open (CSS hides it when closed)
  const shouldMountContainer = !isNativeChatKit && (
    effectiveDeploymentType === 'fullpage' ? true : hasEverOpenedRef.current
  )

  const renderChatContent = () => {
    if (!chatbot) return null

    // If it's ChatKit but NOT in regular style mode, use native ChatKit (Desktop only, if enabled)
    if (shouldRenderChatKit && !useChatKitInRegularStyle) {
      // In embed mode, use a stable isMobile value to prevent re-renders from iframe resizing
      // which can cause ChatKit SDK to flicker/reinitialize
      // Native ChatKit handles responsive behavior internally
      const stableIsMobile = isEmbed ? false : isMobile
      return (
        <ChatKitRenderer
          chatbot={chatbot}
          previewDeploymentType={effectiveDeploymentType}
          isInIframe={isInIframe}
          isMobile={stableIsMobile}
          isPreview={isPreview}
          isDesktopPreview={isDesktopPreview}
          onChatKitUnavailable={() => setChatKitUnavailable(true)}
        />
      )
    }

    // If it's ChatKit in regular style mode (Desktop windowed OR Mobile Popover/Fullpage), use platform container + headless ChatKit
    if (shouldRenderChatKit && useChatKitInRegularStyle) {
      return (
        <div
          className="flex-1 min-h-0 relative overflow-hidden chatkit-in-regular-style"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChatKitRenderer
            chatbot={chatbot}
            previewDeploymentType={effectiveDeploymentType}
            isInIframe={isInIframe}
            isMobile={isMobile}
            useChatKitInRegularStyle={true}
            onChatKitUnavailable={() => setChatKitUnavailable(true)}
          />
        </div>
      )
    }

    return (
      <ChatContent
        chatbot={chatbot}
        messages={messages}
        input={input}
        setInput={setInput}
        attachments={attachments}
        setAttachments={setAttachments}
        isLoading={isLoading}
        selectedFollowUp={selectedFollowUp}
        messageFeedback={messageFeedback}
        setMessageFeedback={setMessageFeedback}
        setMessages={setMessages}
        sendMessage={sendMessage}
        resetChat={resetChat}
        isSessionExpired={isSessionExpired}
        onFileSelect={handleFileSelect}
        onFollowUpClick={handleFollowUpClick}
        removeAttachment={removeAttachment}
        handleSubmit={handleSubmit}
        isRecording={isRecording}
        isVoiceEnabled={isVoiceEnabled}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onToggleVoiceOutput={toggleVoiceOutput}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        currentTranscript={currentTranscript}
        chatbotId={chatbotId}
        threadId={threadManagementEnabled ? currentThreadId : null}
        hideHeader={true} // Main loop handles header rendering now for consistency
      />
    )
  }

  // isPreview is now defined earlier in the component (around line 336)
  // This is used by the layout routing logic below
  if (effectiveDeploymentType === 'fullpage' && !isInIframe && !isPreview) {
    return (
      <FullPageChatLayout
        emulatorConfig={emulatorConfig}
        chatbot={chatbot}
        threadManagementEnabled={!!threadManagementEnabled}
        currentThreadId={currentThreadId}
        threads={threads}
        threadsLoading={threadsLoading}
        setCurrentThreadId={setCurrentThreadId}
        setMessages={setMessages}
        deleteThread={deleteThread}
        updateThreadTitle={updateThreadTitle}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        handleSelectChat={handleSelectChat}
        handleNewChat={handleNewChat}
        handleDeleteChat={handleDeleteChat}
        previewDeploymentType={previewDeploymentType}
        setPreviewDeploymentType={setPreviewDeploymentType}
        setIsOpen={setIsOpen}
        isMobile={isMobile}
        isEmbed={isEmbed}
        isPreview={false}
        useChatKitInRegularStyle={useChatKitInRegularStyle}
        shouldRenderChatKit={!!shouldRenderChatKit}
        handleClose={handleClose}
      >
        {renderChatContent()}
      </FullPageChatLayout>
    )
  }







  // Define the main chat UI content part to be wrapped in the device frame if needed
  const chatUI = (
    <>
      {overlayStyle && (
        <div style={overlayStyle} aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}

      {/* Native ChatKit rendering (renders its own widget/container) */}
      {isNativeChatKit && (
        <>
          {/* PWA Banner for native popover mode (Only if NOT host website mode, which has its own fixed banner) */}
          {((chatbot as any).pwaInstallScope !== 'website') && (
            <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
          )}
          {renderChatContent()}
        </>
      )}

      {/* Widget launcher button - Ensure it is clickable */}
      {shouldShowWidgetButton && (
        <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: 0, right: 0, zIndex: Z_INDEX.chatWidget }}>
           {/* Get Started Popover - Renders above widget button when active */}
           {chatbot && (
            <GetStartedPopover 
              chatbot={chatbot}
              isOpen={showGetStarted && !isOpen} // Only show if chat is NOT open
              onStart={handleStartChat}
              onClose={() => setShowGetStarted(false)}
              theme={(chatbot as any).chatkitOptions?.theme}
            />
           )}
          
          <ChatWidgetButton
            chatbot={chatbot}
            isOpen={isOpen}
            onClick={toggleChat}
            widgetButtonStyle={widgetButtonStyle}
            popoverPositionStyle={popoverPositionStyle}
            onDebugToggle={() => {
              setShowGetStarted(prev => !prev);
            }}
          />
        </div>
      )}
      {/* Chat container */}
      {shouldMountContainer && (
        <WidgetChatContainer
          key="chat-container"
          chatbot={chatbot}
          containerStyle={containerStyle}
          chatStyle={chatStyle}
          emulatorConfig={emulatorConfig}
          isMobile={isMobile}
          isEmbed={isEmbed}
          isPreview={isPreview}
          useChatKitInRegularStyle={useChatKitInRegularStyle}
          shouldRenderChatKit={!!shouldRenderChatKit}
          effectiveDeploymentType={effectiveDeploymentType}
          handleClose={handleClose}
          isOpen={shouldShowContainer}
          onClearSession={resetChat}
        >
          {renderChatContent()}
        </WidgetChatContainer>
      )}

      {/* PWA Banner for 'Host Website' scope (Overlay) - Renders outside widget container to be visible when closed */}
      {/* If in preview mode (emulator), we still show it here because it's easier to preview in a single frame. */}
      {/* In production embed (Host Website mode), it will be in its own separate iframe (see route.ts). */}
      {isPreview && ((chatbot as any).pwaInstallScope === 'website') && (
        <div style={{ pointerEvents: 'auto', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
        </div>
      )}
    </>
  )

  const showDeviceFrame = isPreview && !isInIframe && (previewDevice === 'mobile' || previewDevice === 'tablet')

  return (
    <div
      className={showDeviceFrame ? "flex items-center justify-center min-h-screen p-8" : ""}
      style={{
        position: 'relative',
        height: '100%',
        minHeight: showDeviceFrame ? '100vh' : 'auto',
        // Apply emulator background only in preview/standalone — not in embed (keeps iframe transparent)
        backgroundColor: isEmbed ? undefined : emulatorConfig.backgroundColor,
        backgroundImage: (!isEmbed && emulatorConfig.backgroundImage) ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: (!isEmbed && emulatorConfig.backgroundImage) ? 'cover' : undefined,
        backgroundPosition: (!isEmbed && emulatorConfig.backgroundImage) ? 'center' : undefined,
        backgroundRepeat: (!isEmbed && emulatorConfig.backgroundImage) ? 'no-repeat' : undefined,
        // When embedded and closed (or just PWA overlay showing), allow clicks to pass through
        pointerEvents: (isEmbed && !isOpen && !isPreview) ? 'none' : 'auto',
        // Isolate emulator from global.css styles - emulator has its own styling
        isolation: isPreview ? 'isolate' : undefined,
      }}
    >
      {/* Preview Type Selector - Fixed at top right (only show when not in iframe) */}
      {!isInIframe && (
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-md p-2 shadow-lg" style={{ zIndex: Z_INDEX.chatWidgetPreview }}>
          <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
          <Select
            value={previewDeploymentType}
            onValueChange={(value: string) => {
              const deploymentType = value as 'popover' | 'fullpage' | 'popup-center'
              setPreviewDeploymentType(deploymentType)
              if (deploymentType === 'popover' || deploymentType === 'popup-center') {
                setIsOpen(false)
              } else {
                setIsOpen(true)
              }
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popover">Popover</SelectItem>
              <SelectItem value="popup-center">Popup Center</SelectItem>
              <SelectItem value="fullpage">Full Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showDeviceFrame ? (
        <div
          className="relative shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
          style={{
            width: previewDevice === 'mobile' ? '300px' : '500px',
            height: previewDevice === 'mobile' ? '600px' : '700px',
            borderRadius: previewDevice === 'mobile' ? '40px' : '32px',
            backgroundColor: '#f5f5f5', // Light gray instead of black
            border: `${previewDevice === 'mobile' ? '8px' : '10px'} solid #e5e5e5`, // Light theme border
            transform: 'translateZ(0)'
          }}
        >
          {/* Status Bar */}
          <div
            className="h-8 w-full flex items-center justify-between px-6 text-[10px] font-bold shrink-0"
            style={{
              backgroundColor: chatbot.primaryColor || '#1e40af',
              color: '#fff'
            }}
          >
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" /></svg>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
              <svg className="h-4 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4zm-4 16h-2v-2h2v2z" /></svg>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full relative overflow-hidden bg-white">
            {chatUI}
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" style={{ zIndex: 60 }} />
        </div>
      ) : (
        chatUI
      )}
    </div>
  )
}
// Helper to extract numeric value from string like "8px" -> "8"
function extractNumericValue(value: string | undefined): string {
  if (!value) return '0'
  const match = value.toString().match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : '0'
}
