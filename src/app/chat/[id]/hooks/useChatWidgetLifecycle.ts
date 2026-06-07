import { useEffect, useMemo, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { ChatbotConfig, Message } from '../types'

interface UseChatWidgetLifecycleParams {
  chatbot: ChatbotConfig | null
  chatKitUnavailable: boolean
  isEmbed: boolean
  isMobile: boolean
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  setIsOpen: (open: boolean) => void
  setMessages: Dispatch<SetStateAction<Message[]>>
}

export function useChatWidgetLifecycle({
  chatbot,
  chatKitUnavailable,
  isEmbed,
  isMobile,
  previewDeploymentType,
  setIsOpen,
  setMessages,
}: UseChatWidgetLifecycleParams) {
  const isInitialLoadRef = useRef(true)
  const lastChatbotIdRef = useRef<string | null>(null)
  const greetingInjectedRef = useRef(false)

  const isNativeChatKitMode = useMemo(() => {
    if (!chatbot || chatKitUnavailable) return false
    const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
    const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
    const shouldRender = (chatbot.engineType === 'chatkit' || chatbot.engineType === 'openai-agent-sdk') && agentId
    const regularStyleExplicit = (chatbot as any).useChatKitInRegularStyle === true
    return Boolean(shouldRender && !regularStyleExplicit)
  }, [chatbot, chatKitUnavailable])

  useEffect(() => {
    if (!chatbot) return

    if (chatbot.id !== lastChatbotIdRef.current) {
      isInitialLoadRef.current = true
      lastChatbotIdRef.current = chatbot.id
    }

    if (isNativeChatKitMode && isEmbed) {
      console.log('[ChatPage] Skipping auto-show - native ChatKit handles its own state')
      return
    }

    if (previewDeploymentType === 'fullpage') {
      setIsOpen(true)
      isInitialLoadRef.current = false
      return
    }

    if (isInitialLoadRef.current) {
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
  }, [chatbot, previewDeploymentType, isNativeChatKitMode, isEmbed])

  useEffect(() => {
    if (!chatbot || greetingInjectedRef.current || isNativeChatKitMode) return

    const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
    const greeting = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener

    if (isPopover && greeting) {
      greetingInjectedRef.current = true
      setMessages([{
        id: 'greeting-' + Date.now(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      }])
    }
  }, [chatbot, previewDeploymentType, isNativeChatKitMode, setMessages])
}
