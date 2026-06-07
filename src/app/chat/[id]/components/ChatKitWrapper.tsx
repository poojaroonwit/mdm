'use client'

import React from 'react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle, getContainerStyle, getWidgetButtonStyle, getPopoverPositionStyle, ensureUnits, SHADOW_BUFFER } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { buildChatKitTheme } from './chatkit/configBuilder'
import { loadGoogleFont } from './chatkit/fontLoader'
import { ChatKitGlobalStyles } from './chatkit/ChatKitStyles'
import { ChatWidgetButton } from './ChatWidgetButton'
import { ChatKitStyleEnforcer } from './chatkit/ChatKitStyleEnforcer'
import { ChatKitContainerStyleTags } from './chatkit/ChatKitContainerStyleTags'
import { useChatKitHookOptions } from './chatkit/useChatKitHookOptions'

interface ChatKitWrapperProps {
  chatkitModule: any
  chatbot: ChatbotConfig
  onError: (error: string) => void
  previewDeploymentType?: 'popover' | 'fullpage' | 'popup-center'
  isInIframe?: boolean
  isMobile?: boolean
  isPreview?: boolean  // True when in emulator preview mode (always show widget on popover)
  isDesktopPreview?: boolean  // True when in emulator desktop view
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  useChatKitInRegularStyle?: boolean
  isNative?: boolean
}

export function ChatKitWrapper({
  chatkitModule,
  chatbot,
  onError,
  previewDeploymentType = 'fullpage',
  isInIframe = false,
  isMobile = false,
  isPreview = false,
  isDesktopPreview = false,
  isOpen,
  setIsOpen,
  useChatKitInRegularStyle: propUseChatKitInRegularStyle,
  isNative = false
}: ChatKitWrapperProps) {
  // ALL HOOKS MUST BE AT THE TOP LEVEL - NO CONDITIONALS OR TRY-CATCH AROUND HOOKS

  // Error state for catching errors outside of hooks
  const [initError, setInitError] = React.useState<string | null>(null)

  // Trigger resize when popover opens to help ChatKit recalculate its internal iframe dimensions
  const prevIsOpenRef = React.useRef(isOpen)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const chatkitControlRef = React.useRef<any>(null)  // Store ChatKit control for runtime updates
  const chatkitOptionsRef = React.useRef<any>(null)  // Store options for setOptions calls

  // Detect if we're in an embedded context (this is needed for resize message sync)
  const isEmbed = isInIframe || (typeof window !== 'undefined' && window.self !== window.top)

  // Use ref to track isMobile without causing effect re-runs
  // This prevents loops where isMobile change -> resize message -> iframe resize -> isMobile change
  const isMobileRef = React.useRef(isMobile)
  React.useEffect(() => { isMobileRef.current = isMobile }, [isMobile])

  // Lifted from try block to allow hooks
  const chatkitOptions = chatbot.chatkitOptions || {}
  const useChatKitInRegularStyle = propUseChatKitInRegularStyle ?? (chatbot as any).useChatKitInRegularStyle === true

  // Memoize theme calculation
  const theme = React.useMemo(() => buildChatKitTheme(chatbot), [chatbot])

  // Compute values needed for hooks upfront
  const deploymentType = previewDeploymentType || chatbot.deploymentType || 'fullpage'
  const isAgentSDK = chatbot.engineType === 'openai-agent-sdk'
  const agentId = isAgentSDK ? chatbot.openaiAgentSdkAgentId : chatbot.chatkitAgentId
  const apiKey = isAgentSDK ? chatbot.openaiAgentSdkApiKey : chatbot.chatkitApiKey

  // CRITICAL: Send resize messages to parent when isOpen changes in embed mode
  // This ensures the parent iframe size stays in sync with ChatKitWrapper's popover state
  // IMPORTANT: Do NOT include isMobile in dependencies - use ref instead to prevent loops
  // NOTE: In regular-style mode (isNative=false), page.tsx handles all resizing — skip here
  // to avoid conflicting messages that could shrink the iframe when chat opens on mobile.
  React.useEffect(() => {
    if (!isEmbed) return
    if (!isNative) return // page.tsx handles resize in regular-style mode
    if (previewDeploymentType === 'fullpage') return

    const isPopover = previewDeploymentType === 'popover' || previewDeploymentType === 'popup-center'
    if (!isPopover) return

    const x = chatbot as any
    const widgetSizeRaw = parseFloat(x.widgetSize || '60') || 60
    const pos = (x.widgetPosition || 'bottom-right') as string
    const offsetX = ensureUnits(x.widgetOffsetX, '20px')
    const offsetY = ensureUnits(x.widgetOffsetY, '20px')
    const popoverMarginPx = parseFloat(x.widgetPopoverMargin || '10') || 10
    const popoverPos = x.popoverPosition || 'top'
    const popoverMarginLeft = parseFloat(x.widgetPopoverMarginLeft || '0') || 0
    const popoverMarginRight = parseFloat(x.widgetPopoverMarginRight || '0') || 0

    let width = '100%'
    let height = '100%'

    if (!isOpen) {
      // If PWA overlay is enabled and we are on mobile, we must keep the iframe full scale
      // so the banner (fixed at top) remains visible.
      const isPwaOverlay = (chatbot as any).pwaInstallScope === 'website'
      if (isPwaOverlay && isMobileRef.current) {
        width = '100%'
        height = '100%'
      } else {
        // Closed state: widget button size + shadow buffer
        const closedSize = `${widgetSizeRaw + (SHADOW_BUFFER * 2)}px`
        width = closedSize
        height = closedSize
      }
    } else if (!isMobileRef.current) {
      // Desktop open: popover + widget button + margin + shadow buffer
      const baseWidth = parseFloat(ensureUnits(x.chatWindowWidth, '380px')) || 380
      const baseHeight = parseFloat(ensureUnits(x.chatWindowHeight, '600px')) || 600

      if (popoverPos === 'left') {
        width = `${baseWidth + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
        height = `${baseHeight + (SHADOW_BUFFER * 2)}px`
      } else {
        width = `${baseWidth + (SHADOW_BUFFER * 2) + popoverMarginLeft + popoverMarginRight}px`
        height = `${baseHeight + widgetSizeRaw + popoverMarginPx + (SHADOW_BUFFER * 2)}px`
      }
    }
    // else: mobile open stays at 100% x 100%

    // Calculate position data so parent iframe container is anchored correctly
    const parentOffsetX = `calc(${offsetX} - ${SHADOW_BUFFER}px)`
    const parentOffsetY = `calc(${offsetY} - ${SHADOW_BUFFER}px)`
    const positionData: any = {}
    if (isOpen && isMobileRef.current) {
      // On mobile, the chat covers the full screen — anchor to top-left so the CSS
      // media query (top:0; left:0; width:100%; height:100%) works unambiguously.
      positionData.top = '0px'
      positionData.left = '0px'
    } else {
      if (pos.includes('bottom')) positionData.bottom = parentOffsetY
      else positionData.top = parentOffsetY
      if (pos.includes('right')) positionData.right = parentOffsetX
      else positionData.left = parentOffsetX
      if (pos.includes('center')) positionData.left = '50%'
    }

    window.parent.postMessage({
      type: 'chat-widget-resize',
      isOpen,
      width,
      height,
      ...positionData,
      deploymentType: previewDeploymentType
    }, '*')
  }, [isOpen, isEmbed, previewDeploymentType, chatbot])  // Removed isMobile - use ref instead

  React.useEffect(() => {
    // Skip in embed mode - internal resize event can trigger isMobile changes that cause loops
    // The iframe resize is handled by postMessage above, not by window resize events
    if (isEmbed) return

    if (!prevIsOpenRef.current && isOpen && previewDeploymentType !== 'fullpage') {
      // Delay the resize event to ensure DOM is ready
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
      return () => clearTimeout(t)
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, previewDeploymentType, isEmbed])

  // Handle file upload tool click
  React.useEffect(() => {
    if (!containerRef.current) return

    const handleToolClick = (e: MouseEvent) => {
      // Check if the clicked element is part of the file upload tool
      // Accessing DOM elements created by ChatKit is tricky as we don't control the render
      // But we know we injected a tool with label 'Attach file' and id 'file-upload'
      // ChatKit usually renders buttons with aria-label same as tool label or similar
      const target = e.target as HTMLElement
      const button = target.closest('button')

      if (button) {
        // Check for aria-label or title matching our tool
        const label = button.getAttribute('aria-label') || button.getAttribute('title') || ''
        const type = button.getAttribute('type')

        // If we identify it's our file upload button
        if (label.includes('Attach file') || label.includes('file-upload')) {
          e.preventDefault()
          e.stopPropagation()
          fileInputRef.current?.click()
        }
      }
    }

    const container = containerRef.current
    container.addEventListener('click', handleToolClick, true) // Capture phase to intercept early

    return () => {
      container.removeEventListener('click', handleToolClick, true)
    }
  }, [])

  // Handle file selection and inject into ChatKit via drag-and-drop simulation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && containerRef.current) {
      const files = Array.from(e.target.files)
      const container = containerRef.current

      // Find the textarea or input within ChatKit
      // ChatKit usually puts the composer in a textarea
      const composerInput = container.querySelector('textarea') || container.querySelector('input[type="text"]')

      if (composerInput) {
        // Create a DataTransfer object to simulate drag-and-drop
        const dt = new DataTransfer()
        files.forEach(file => dt.items.add(file))

        // Dispatch drop event
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer: dt
        })

        composerInput.dispatchEvent(dropEvent)

        // Also dispatch input event to ensure state update if needed, though drop usually handles it
        // Or if ChatKit listens to 'change' on a file input we can't see...
        // But drop is the standard way to inject files into a complex editor

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        console.warn('ChatKit composer input not found, cannot attach file')
        toast.error('Could not attach file: Editor input not found')
      }
    }
  }

  // Force theme refresh when popover opens
  // This helps apply styles that may not have been ready during initial mount
  // Force theme refresh when popover opens
  // This helps apply styles that may not have been ready during initial mount
  React.useEffect(() => {
    if (isOpen) {
      // Delay the setOptions call to ensure ChatKit iframe is ready
      const refreshTheme = () => {
        try {
          // Check if control exists and supports setOptions
          // Some engine types or initialization states might not support it
          if (chatkitControlRef.current && typeof chatkitControlRef.current.setOptions === 'function') {
            // Only update if we have options
            if (chatkitOptionsRef.current) {
                try {
                    chatkitControlRef.current.setOptions(chatkitOptionsRef.current)
                } catch (err: any) {
                    // Suppress "Command onSetOptions not supported" as it is non-fatal usually
                    if (err?.message?.includes('not supported')) return
                    console.warn('[ChatKitWrapper] setOptions error:', err)
                }
            }
          }
        } catch (e) {
          console.warn('[ChatKitWrapper] setOptions failed:', e)
        }
      }

      // Try multiple times with increasing delays to catch the iframe becoming ready
      const t1 = setTimeout(refreshTheme, 500) // Increased initial delay
      const t2 = setTimeout(refreshTheme, 1500)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [isOpen])

  // Dynamically load Google Fonts if specified in theme
  React.useEffect(() => {
    const fontFamily = theme?.typography?.fontFamily || chatbot.fontFamily
    if (fontFamily) {
      loadGoogleFont(fontFamily)
    }
  }, [theme, chatbot.fontFamily])

  // Force font application in embed mode (moved outside try block)
  React.useEffect(() => {
    if (isEmbed) {
      const fontFamily = theme?.typography?.fontFamily || chatbot.fontFamily
      if (fontFamily && fontFamily !== 'inherit') {
        // 1. Force load the font
        loadGoogleFont(fontFamily)

        // 2. Force apply to body to ensure inheritance works if ChatKit falls back to inherit
        document.body.style.setProperty('font-family', fontFamily, 'important')

        // 3. Create a hidden element to force browser to download the font immediately
        // This fixes issues where the font is defined but not downloaded until used
        const probe = document.createElement('span')
        probe.textContent = 'font-probe'
        probe.style.fontFamily = fontFamily
        probe.style.position = 'absolute'
        probe.style.top = '-9999px'
        probe.style.left = '-9999px'
        probe.style.opacity = '0'
        probe.style.pointerEvents = 'none'
        document.body.appendChild(probe)

        // Allow some time for download, then cleanup
        const cleanup = setTimeout(() => {
          if (document.body.contains(probe)) {
            document.body.removeChild(probe)
          }
        }, 3000)

        return () => {
          clearTimeout(cleanup)
          if (document.body.contains(probe)) {
            document.body.removeChild(probe)
          }
        }
      }
    }
  }, [isEmbed, theme, chatbot.fontFamily])

  // Get useChatKit hook from the chatkit module
  // This must be called unconditionally at the top level
  const { useChatKit, ChatKit } = chatkitModule

  // Get the server origin for API calls
  // IMPORTANT: When embedded via iframe, relative URLs would go to the host website
  // We need to use the origin of the chatbot server (where the iframe is loaded from)
  const serverOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  // Build chatkit options for the hook
  const chatkitHookOptions = useChatKitHookOptions({
    agentId,
    apiKey,
    chatbot,
    chatkitOptions,
    deploymentType,
    serverOrigin,
    theme,
    useChatKitInRegularStyle
  })

  // Call useChatKit hook unconditionally at the top level
  const { control } = useChatKit(chatkitHookOptions)

  // Store control and options in refs for runtime updates
  React.useEffect(() => {
    chatkitControlRef.current = control
    chatkitOptionsRef.current = chatkitHookOptions
  }, [control, chatkitHookOptions])

  // Report any initialization errors
  React.useEffect(() => {
    if (initError) {
      onError(initError)
      toast.error(`Failed to initialize ChatKit: ${initError}`)
    }
  }, [initError, onError])

  // If there's an error, show error UI
  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-500 mb-4">
          <h2 className="text-xl font-semibold mb-2">ChatKit Error</h2>
          <p className="text-sm">{initError}</p>
        </div>
      </div>
    )
  }

  // Hide ChatKit widget button when:
  // - using regular style header
  // - OR on mobile when chat is open (fullpage covers screen)
  // NOTE: In embed mode, the widget button MUST be shown inside the iframe because
  // the parent embed script (chat-widget.js) does NOT render its own button.
  // The iframe IS the button container.
  const shouldShowWidgetButton = (deploymentType === 'popover' || deploymentType === 'popup-center') &&
    !useChatKitInRegularStyle &&
    !(isMobile && isOpen && !isPreview)  // Don't hide in emulator preview mode

  const shouldShowContainer = deploymentType === 'fullpage' ? true : isOpen

  const chatkitOptionsArg = (chatbot as any).chatkitOptions
  const containerStyle = getContainerStyle(
    chatbot, 
    deploymentType as any, 
    {} as any, 
    isMobile, 
    isEmbed, 
    isPreview, 
    chatkitOptionsArg
  )

  const overlayStyle = getOverlayStyle(deploymentType as any, chatbot, isOpen, chatkitOptionsArg)

  const widgetButtonStyle = getWidgetButtonStyle(chatbot, chatkitOptionsArg)
  const widgetPopoverPositionStyle = getPopoverPositionStyle(chatbot, isEmbed, isOpen)

  // Handler for closing that also notifies parent
  const handleBackdropClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(false)
    // Also notify parent window for embed mode
    if (isEmbed) {
      window.parent.postMessage({ type: 'close-chat' }, '*')
    }
  }

  // No longer needed: re-implemented widget button logic removed in favor of shared ChatWidgetButton component.
  // The styling is now handled by getWidgetButtonStyle and getPopoverPositionStyle from chatStyling.ts.

  return (
    <>
      {/* Transparent click-to-close backdrop for embed mode (when no visible overlay) */}
      {isEmbed && (deploymentType === 'popover' || deploymentType === 'popup-center') && isOpen && !overlayStyle && !useChatKitInRegularStyle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            zIndex: Z_INDEX.chatWidgetOverlay,
          }}
          aria-hidden="true"
          onClick={handleBackdropClose}
        />
      )}

      {overlayStyle && !useChatKitInRegularStyle && (
        <div style={overlayStyle} onClick={handleBackdropClose} />
      )}

      {shouldShowWidgetButton && !useChatKitInRegularStyle && (
        <div style={{ pointerEvents: 'auto', position: 'fixed', bottom: 0, right: 0, zIndex: Z_INDEX.chatWidget }}>
          <ChatWidgetButton
            chatbot={chatbot}
            isOpen={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            widgetButtonStyle={widgetButtonStyle}
            popoverPositionStyle={widgetPopoverPositionStyle}
          />
        </div>
      )}

      {shouldShowContainer && (
        <div
          id="chatbot-native-container"
          ref={containerRef}
          className={`chatkit-embedded-container ${((deploymentType === 'popover' || deploymentType === 'popup-center') && !isMobile) ? 'chatbot-popover-enter' : ''}`}
          style={{
            ...(useChatKitInRegularStyle ? { flex: 1, minHeight: 0 } : containerStyle),
            '--container-border-radius': useChatKitInRegularStyle ? '0px' : (containerStyle.borderRadius || '8px'),
            '--container-border': useChatKitInRegularStyle ? 'none' : (containerStyle.border || 'none'),
            '--container-outline': useChatKitInRegularStyle ? 'none' : (containerStyle.outline || 'none'),
            '--container-width': useChatKitInRegularStyle ? '100%' : (containerStyle.width || 'auto'),
            '--container-height': useChatKitInRegularStyle ? '100%' : (containerStyle.height || 'auto'),
            '--container-max-height': useChatKitInRegularStyle ? 'none' : (containerStyle.maxHeight || 'none'),
            '--container-max-width': useChatKitInRegularStyle ? 'none' : (containerStyle.maxWidth || 'none'),
            '--container-min-height': useChatKitInRegularStyle ? '0' : (containerStyle.minHeight || '0'),
            '--container-min-width': useChatKitInRegularStyle ? '0' : (containerStyle.minWidth || '0'),
            '--container-box-shadow': useChatKitInRegularStyle ? 'none' : (containerStyle.boxShadow || 'none'),
            '--container-overflow': useChatKitInRegularStyle ? 'hidden' : 'visible',
            zIndex: (deploymentType === 'popover' || deploymentType === 'popup-center')
              ? (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
              : undefined,
          } as any}
        >
          <ChatKitContainerStyleTags />
          
          {/* Inner wrapper for shadow and clipping */}
          <div id="chatbot-native-inner">
            <div id="chatbot-content-wrapper">
              <ChatKitGlobalStyles chatbot={chatbot} chatkitOptions={chatkitOptions} />
              <ChatKitStyleEnforcer chatbot={chatbot} containerRef={containerRef} isOpen={isOpen} />

              <ChatKit
                  control={control}
                  style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  }}
              />
            </div>

            {/* CSS transitions for animations */}
          </div>
        </div>
      )}

      {/* Debug overlay removed */}


      {/* Hidden File Input for manual upload handling */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
        onChange={handleFileSelect}
      />
    </>
  )
}
