'use client'

import './chat-page.css'
import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useChatMessages } from './hooks/useChatMessages'
import { useChatHistory } from './hooks/useChatHistory'
import { useChatFileHandling } from './hooks/useChatFileHandling'
import { useChatbotLoader } from './hooks/useChatbotLoader'
import { useAgentThread } from './hooks/useAgentThread'
import {
  getChatStyle,
  getPopoverPositionStyle,
  getContainerStyle,
  getOverlayStyle,
  getWidgetButtonStyle,
} from './utils/chatStyling'
import { FullPageChatLayout } from './components/FullPageChatLayout'
import { PWAInstallBanner } from './components/PWAInstallBanner'
import { ChatPageContentRenderer } from './components/ChatPageContentRenderer'
import { ChatPageSurface } from './components/ChatPageSurface'
import { useChatPageEnvironment } from './hooks/useChatPageEnvironment'
import { useChatPageMessaging } from './hooks/useChatPageMessaging'
import { useChatPageVoice } from './hooks/useChatPageVoice'
import { useChatWidgetLifecycle } from './hooks/useChatWidgetLifecycle'

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
  const previewDevice = searchParams.get('previewDevice') // 'desktop' | 'tablet' | 'mobile'
  const urlLocale = searchParams.get('locale') || searchParams.get('lang')
  
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
  const [showGetStarted, setShowGetStarted] = useState(false)
  const {
    isInIframe,
    isMobile,
    setIsMobile,
    isMobileRef,
    latestParentWidthRef,
  } = useChatPageEnvironment({
    isEmbed,
    isPreview,
    parentWidthParam,
    previewDevice,
    showGetStarted,
    setShowGetStarted,
  })

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const prevIsOpenRef = useRef(isOpen)
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'liked' | 'disliked' | null>>({})
  const [input, setInput] = useState('')
  const [chatKitUnavailable, setChatKitUnavailable] = useState(false)
  const hasEverOpenedRef = useRef(false)

  const { chatbot, emulatorConfig } = useChatbotLoader({
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

        if (effectiveDeploymentType === 'popover' || effectiveDeploymentType === 'popup-center') {
          const autoOpenDesktop = (loadedChatbot as any).widgetAutoShowDesktop !== undefined
            ? (loadedChatbot as any).widgetAutoShowDesktop
            : ((loadedChatbot as any).widgetAutoShow !== undefined ? (loadedChatbot as any).widgetAutoShow : true)
          const autoOpenMobile = (loadedChatbot as any).widgetAutoShowMobile || false
          const shouldAuto = isMobile ? autoOpenMobile : autoOpenDesktop

          if (!shouldAuto) {
            setIsOpen(false)
          }
        } else {
          setIsOpen(true)
        }
      }
      const greetingMessage = loadedChatbot.openaiAgentSdkGreeting || loadedChatbot.conversationOpener
      if (greetingMessage && (previewDeploymentType !== 'fullpage' || isInIframe)) {
      }
    },
  })

  const [currentChatId, setCurrentChatId] = useState<string | null>(null)

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

  const {
    attachments,
    setAttachments,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  } = useChatFileHandling()

  const {
    isRecording,
    isVoiceEnabled,
    isSpeaking,
    audioLevel,
    handleStartRecording,
    handleStopRecording,
    toggleVoiceOutput,
    currentTranscript,
  } = useChatPageVoice({
    chatbot,
    messages,
    isLoading,
    setInput,
    sendMessage,
  })

  useChatWidgetLifecycle({
    chatbot,
    chatKitUnavailable,
    isEmbed,
    isMobile,
    previewDeploymentType,
    setIsOpen,
    setMessages,
  })
  const handleClose = () => {
    if (isEmbed || isInIframe) {
      window.parent.postMessage({ type: 'close-chat' }, '*')
    }
    setIsOpen(false)
    setShowGetStarted(false)
  }

  const handleOpenChat = () => {
    const isMobile = isMobileRef.current
    const getStarted = (chatbot as any)?.chatkitOptions?.getStarted
    
    if (getStarted?.enabled && !isOpen && !isMobile) {
      const hasShown = sessionStorage.getItem(`chatkit_get_started_shown_${chatbotId}`)
      if (!hasShown) {
          setShowGetStarted(true)
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
    sessionStorage.setItem(`chatkit_get_started_shown_${chatbotId}`, 'true')
  }

  const toggleChat = () => {
    if (isOpen) {
      handleClose()
    } else {
      if (showGetStarted) {
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

  useChatPageMessaging({
    chatbot,
    chatbotId,
    isOpen,
    isEmbed,
    isInIframe,
    isMobile,
    isMobileRef,
    latestParentWidthRef,
    previewDeploymentType,
    setPreviewDeploymentType,
    setIsOpen,
    setShowGetStarted,
    setMessages,
    setIsMobile,
    handleOpenChat,
  })

  const isDesktopPreview = isPreview && previewDevice === 'desktop'
  const baseDeploymentType = (isEmbed && searchParams.get('type'))
    ? (searchParams.get('type') as 'popover' | 'fullpage' | 'popup-center')
    : (isEmbed ? 'fullpage' : previewDeploymentType)

  const effectiveDeploymentType = baseDeploymentType

  const widgetButtonStyle = useMemo(() => {
    if (!chatbot) return {}
    return getWidgetButtonStyle(chatbot, (chatbot as any).chatkitOptions)
  }, [chatbot])

  if (!chatbot) {
    return <div className="h-screen w-screen bg-transparent" />
  }

  const chatbotEnabled = (chatbot as any).chatbotEnabled !== false

  if (!chatbotEnabled) {
    return null
  }

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
  const shouldRenderChatKit = Boolean(
    !chatKitUnavailable &&
    (chatbot.engineType === 'chatkit' || chatbot.engineType === 'openai-agent-sdk') &&
    agentId
  )



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

  const renderChatContent = () => (
    <ChatPageContentRenderer
      chatbot={chatbot}
      shouldRenderChatKit={shouldRenderChatKit}
      useChatKitInRegularStyle={useChatKitInRegularStyle}
      effectiveDeploymentType={effectiveDeploymentType}
      isInIframe={isInIframe}
      isMobile={isMobile}
      isEmbed={isEmbed}
      isPreview={isPreview}
      isDesktopPreview={isDesktopPreview}
      onChatKitUnavailable={() => setChatKitUnavailable(true)}
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
    />
  )

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


  return (
    <ChatPageSurface
      chatbot={chatbot}
      emulatorConfig={emulatorConfig}
      isEmbed={isEmbed}
      isOpen={isOpen}
      isPreview={isPreview}
      isInIframe={isInIframe}
      isMobile={isMobile}
      previewDevice={previewDevice}
      previewDeploymentType={previewDeploymentType}
      showGetStarted={showGetStarted}
      shouldShowWidgetButton={shouldShowWidgetButton}
      shouldMountContainer={shouldMountContainer}
      shouldShowContainer={shouldShowContainer}
      isNativeChatKit={isNativeChatKit}
      useChatKitInRegularStyle={useChatKitInRegularStyle}
      shouldRenderChatKit={shouldRenderChatKit}
      effectiveDeploymentType={effectiveDeploymentType}
      widgetButtonStyle={widgetButtonStyle}
      popoverPositionStyle={popoverPositionStyle}
      containerStyle={containerStyle}
      chatStyle={chatStyle}
      overlayStyle={overlayStyle}
      setPreviewDeploymentType={setPreviewDeploymentType}
      setIsOpen={setIsOpen}
      setShowGetStarted={setShowGetStarted}
      handleStartChat={handleStartChat}
      toggleChat={toggleChat}
      resetChat={resetChat}
      handleClose={handleClose}
      renderChatContent={renderChatContent}
    />
  )
}
