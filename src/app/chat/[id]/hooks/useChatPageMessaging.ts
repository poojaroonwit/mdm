import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { ensureUnits, SHADOW_BUFFER, BUTTON_SHADOW_BUFFER } from '../utils/chatStyling'

function extractNumericValue(value: string | undefined): string {
  if (!value) return '0'
  const match = value.toString().match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : '0'
}

interface UseChatPageMessagingParams {
  chatbot: any
  chatbotId: string
  isOpen: boolean
  isEmbed: boolean
  isInIframe: boolean
  isMobile: boolean
  isMobileRef: MutableRefObject<boolean>
  latestParentWidthRef: MutableRefObject<number | null>
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  setPreviewDeploymentType: (type: 'popover' | 'fullpage' | 'popup-center') => void
  setIsOpen: (open: boolean) => void
  setShowGetStarted: (show: boolean) => void
  setMessages: (messages: any[]) => void
  setIsMobile: (mobile: boolean) => void
  handleOpenChat: () => void
}

export function useChatPageMessaging({
  chatbot,
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
}: UseChatPageMessagingParams) {
  const prevPreviewModeRef = useRef<string | null>(null)

  useEffect(() => {
    if (!chatbot) return

    if (isEmbed || isInIframe) {
      let width = '100%'
      let height = '100%'
      const x = chatbot as any
      const pos = (x.widgetPosition || 'bottom-right') as string
      const offsetX = ensureUnits(x.widgetOffsetX, '20px')
      const offsetY = ensureUnits(x.widgetOffsetY, '20px')
      const positionData: any = {}
      const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'

      if (isPopover) {
        if (!isOpen) {
          const widgetSizeRaw = parseFloat(x.widgetSize || '60') || 60
          const size = `${widgetSizeRaw + (BUTTON_SHADOW_BUFFER * 2)}px`
          width = size
          height = size
        } else if (!isMobileRef.current) {
          const baseWidth = parseFloat(extractNumericValue(ensureUnits(x.chatWindowWidth, '450px'))) || 450
          const baseHeight = parseFloat(extractNumericValue(ensureUnits(x.chatWindowHeight, '800px'))) || 800
          const widgetSizeRaw = parseFloat(x.widgetSize || '60') || 60
          const popoverMarginPx = parseFloat(x.widgetPopoverMargin || '10') || 10
          const popoverPos = x.popoverPosition || 'top'
          const popoverMarginLeft = parseFloat(x.widgetPopoverMarginLeft || '0') || 0
          const popoverMarginRight = parseFloat(x.widgetPopoverMarginRight || '0') || 0

          if (popoverPos === 'left') {
            width = `${baseWidth + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
            height = `${baseHeight + (SHADOW_BUFFER * 2)}px`
          } else {
            width = `${baseWidth + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
            height = `${baseHeight + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2)}px`
          }
        }

        const activeBuffer = isOpen ? SHADOW_BUFFER : BUTTON_SHADOW_BUFFER
        const parentOffsetX = `calc(${offsetX} - ${activeBuffer}px)`
        const parentOffsetY = `calc(${offsetY} - ${activeBuffer}px)`

        if (isOpen && isMobileRef.current) {
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
        deploymentType: previewDeploymentType,
      }, '*')
    }
  }, [isOpen, isEmbed, isInIframe, previewDeploymentType, chatbot, isMobile, isMobileRef])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = event.data
        if (!data || typeof data !== 'object') return

        if (data.type === 'chatbot-preview-mode') {
          const val = data.value
          if (val === 'popover' || val === 'fullpage' || val === 'popup-center') {
            const modeChanged = prevPreviewModeRef.current !== val
            prevPreviewModeRef.current = val
            setPreviewDeploymentType(val)
            if (modeChanged) {
              setIsOpen(val === 'fullpage')
            }
          }
        }
        if (data.type === 'clear-session') {
          setMessages([])
        }
        if (data.type === 'parent-viewport' && isEmbed) {
          const newWidth = data.width as number
          latestParentWidthRef.current = newWidth
          const mobile = newWidth < 1024
          if (mobile !== isMobileRef.current) {
            setIsMobile(mobile)
            isMobileRef.current = mobile
          }
        }
        if (data.type === 'open-chat') {
          handleOpenChat()
        }
        if (data.type === 'close-chat') {
          setIsOpen(false)
          setShowGetStarted(false)
        }
      } catch (error) {
        console.error('[ChatPage] Error processing message:', error)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])
}
