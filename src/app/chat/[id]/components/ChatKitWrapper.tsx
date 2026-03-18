'use client'

import React from 'react'
import { X, Bot, Menu, Loader2, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatbotConfig } from '../types'
import { getOverlayStyle, getContainerStyle, getWidgetButtonStyle, getPopoverPositionStyle, ensureUnits, SHADOW_BUFFER } from '../utils/chatStyling'
import { Z_INDEX } from '@/lib/z-index'
import { extractNumericValue, convertToHex, isLightColor, hexToRgb } from './chatkit/themeUtils'
import { buildChatKitTheme } from './chatkit/configBuilder'
import { loadGoogleFont } from './chatkit/fontLoader'
import { ChatKitGlobalStyles } from './chatkit/ChatKitStyles'
import { ChatWidgetButton } from './ChatWidgetButton'
import { ChatKitStyleEnforcer } from './chatkit/ChatKitStyleEnforcer'
import { PWAInstallBanner } from './PWAInstallBanner'

// Helper function to get icon component by name dynamically
const getIconComponent = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return module[iconName as keyof typeof module] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  } catch {
    return Bot
  }
}

// Separate component for dynamic icon to avoid hooks in conditionals
function DynamicIcon({ iconName, iconColor, size = 'h-5 w-5' }: { iconName: string; iconColor?: string; size?: string }) {
  const [IconComponent, setIconComponent] = React.useState<React.ComponentType<any>>(Bot)

  React.useEffect(() => {
    if (typeof iconName === 'string' && iconName.trim() !== '' && iconName !== 'Bot') {
      getIconComponent(iconName).then(setIconComponent)
    } else {
      setIconComponent(Bot)
    }
  }, [iconName])

  return <IconComponent className={size} style={{ color: iconColor }} />
}

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
  const chatkitHookOptions = React.useMemo(() => ({
    api: {
      async getClientSecret(existing: any) {
        try {
          // Use absolute URL to ensure API calls go to the chatbot server, not the host website
          // Using /next-api/ prefix to bypass Nginx /api collision with PostgREST
          const apiUrl = `${serverOrigin}/next-api/chatkit/session`
          
          if (existing) {
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'omit', // Don't send cookies - this is a public API
              body: JSON.stringify({
                agentId: agentId,
                chatbotId: chatbot.id,
                existing
              }),
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
              console.error('❌ Session refresh failed:', errorData)
              const errorMessage = errorData.details
                ? `${errorData.error}: ${errorData.details}`
                : errorData.error || 'Failed to refresh ChatKit session'
              throw new Error(errorMessage)
            }
            const { client_secret } = await res.json()
            return client_secret
          }

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit', // Don't send cookies - this is a public API
            body: JSON.stringify({
              agentId: agentId,
              chatbotId: chatbot.id
            }),
          })
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
            console.error('❌ ChatKit session creation failed:', {
              status: res.status,
              statusText: res.statusText,
              errorData
            })
            const errorMessage = errorData.details
              ? `${errorData.error}: ${errorData.details}`
              : errorData.error || 'Failed to create ChatKit session'
            throw new Error(errorMessage)
          }
          const sessionData = await res.json()
          if (!sessionData.client_secret) {
            console.error('❌ No client secret in response')
            throw new Error('No client secret received from session endpoint')
          }
          const clientSecret = String(sessionData.client_secret).trim()
          if (!clientSecret) {
            console.error('❌ Client secret is empty after trimming')
            throw new Error('Client secret is empty')
          }
          return clientSecret
        } catch (error) {
          console.error('❌ Error in getClientSecret:', error)
          throw error
        }
      },
    },
    theme: theme as any,
    locale: chatkitOptions.locale as any,
    composer: (() => {
      // Build composer tools array
      const composerTools: any[] = []

      // Add file upload tool if enabled
      if (chatbot.enableFileUpload) {
        composerTools.push({
          id: 'file-upload',
          label: 'Attach file',
          icon: 'document',
          pinned: true
        })
      }

      // Add custom tools from chatkitOptions
      if (chatkitOptions.composer?.tools && Array.isArray(chatkitOptions.composer.tools)) {
        const customTools = chatkitOptions.composer.tools.map((tool: any) => {
          const supportedTool: any = {}
          if (tool.id !== undefined && tool.id !== null && tool.id !== '') supportedTool.id = tool.id
          if (tool.label !== undefined && tool.label !== null && tool.label !== '') supportedTool.label = tool.label
          if (tool.shortLabel !== undefined && tool.shortLabel !== null && tool.shortLabel !== '') supportedTool.shortLabel = tool.shortLabel
          
          // Only include valid icon names
          if (tool.icon !== undefined && tool.icon !== null && tool.icon !== '') {
            supportedTool.icon = tool.icon
          }
          
          if (tool.pinned !== undefined) supportedTool.pinned = tool.pinned
          if (tool.placeholderOverride !== undefined && tool.placeholderOverride !== null && tool.placeholderOverride !== '') supportedTool.placeholderOverride = tool.placeholderOverride
          
          return supportedTool
        }).filter((tool: any) => tool.id && tool.label)
        composerTools.push(...customTools)
      }

      // Return composer config if there's any configuration
      if (chatkitOptions.composer?.placeholder || composerTools.length > 0) {
        return {
          placeholder: chatkitOptions.composer?.placeholder,
          tools: composerTools.length > 0 ? composerTools : undefined
        }
      }
      return undefined
    })(),
    // Don't pass header config to ChatKit when using regular style header (regular header will be used instead)
    // Note: ChatKit header only supports specific properties - description, logo are NOT supported
    // The title should be an object with 'text' property, not a plain string
    header: useChatKitInRegularStyle ? undefined : (() => {
      const header = { ...(chatkitOptions.header || {}) }
      const supportedHeader: any = {}

      // ChatKit expects title as an object with 'text' property
      if (header.title !== undefined) {
        if (typeof header.title === 'object' && header.title !== null) {
          // Already an object, pass through
          supportedHeader.title = header.title
        } else if (typeof header.title === 'string' && header.title !== '') {
          // Convert string to expected object format
          supportedHeader.title = { text: header.title }
        }
      } else if ((chatbot as any).headerTitle) {
        // Support legacy formData.headerTitle - convert to object format
        supportedHeader.title = { text: (chatbot as any).headerTitle }
      }

      // Note: 'description' and 'logo' are NOT supported by ChatKit header
      // These fields are ignored to prevent "Unrecognized keys" errors

      // Force removal of rightAction if it exists in source config to prevent errors
      if (supportedHeader.rightAction) {
        delete supportedHeader.rightAction
      }

      if (Object.keys(supportedHeader).length > 0) {
        return supportedHeader
      }
      return undefined
    })(),
    startScreen: chatkitOptions.startScreen ? (() => {
      const supportedStartScreen: any = {}

      if (chatkitOptions.startScreen.greeting) {
        supportedStartScreen.greeting = chatkitOptions.startScreen.greeting
      } else {
        // Fallback to chatbot config greeting if not explicitly set in chatkitOptions
        const fallbackGreeting = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener
        if (fallbackGreeting) {
          supportedStartScreen.greeting = fallbackGreeting
        }
      }

      if (chatkitOptions.startScreen.prompts && chatkitOptions.startScreen.prompts.length > 0) {
        // Valid ChatKit icon names (ChatKitIcon type)
        const validChatKitIcons = [
          'agent', 'analytics', 'atom', 'bolt', 'book-open', 'calendar', 'chart', 'check', 'check-circle',
          'chevron-left', 'chevron-right', 'circle-question', 'compass', 'confetti', 'cube', 'document',
          'dots-horizontal', 'empty-circle', 'globe', 'keys', 'lab', 'images', 'info', 'lifesaver',
          'lightbulb', 'mail', 'map-pin', 'maps', 'name', 'notebook', 'notebook-pencil', 'page-blank',
          'phone', 'plus', 'profile', 'profile-card', 'star', 'star-filled', 'search', 'sparkle',
          'sparkle-double', 'square-code', 'square-image', 'square-text', 'suitcase', 'settings-slider',
          'user', 'wreath', 'write', 'write-alt', 'write-alt2', 'bug'
        ]

        const filteredPrompts = chatkitOptions.startScreen.prompts.map((prompt: any) => {
          const supportedPrompt: any = {}
          // ChatKit supports 'label', 'prompt', and 'icon' properties
          // 'name' is not supported and will cause errors
          if (prompt.label !== undefined && prompt.label !== null && prompt.label !== '') {
            supportedPrompt.label = prompt.label
          }
          if (prompt.prompt !== undefined && prompt.prompt !== null && prompt.prompt !== '') {
            supportedPrompt.prompt = prompt.prompt
          }
          // Only include icon if it's a valid ChatKitIcon value
          if (prompt.icon !== undefined && prompt.icon !== null && prompt.icon !== '' &&
            validChatKitIcons.includes(prompt.icon)) {
            supportedPrompt.icon = prompt.icon
          }
          return supportedPrompt
        }).filter((prompt: any) => prompt.label || prompt.prompt)

        if (filteredPrompts.length > 0) {
          supportedStartScreen.prompts = filteredPrompts
        }
      }

      return Object.keys(supportedStartScreen).length > 0 ? supportedStartScreen : undefined
    })() : undefined,
    entities: chatkitOptions.entities ? (() => {
      const e: any = {}
      if (chatkitOptions.entities.onTagSearch) e.onTagSearch = chatkitOptions.entities.onTagSearch
      if (chatkitOptions.entities.onRequestPreview) e.onRequestPreview = chatkitOptions.entities.onRequestPreview
      return Object.keys(e).length > 0 ? e : undefined
    })() : undefined,
    disclaimer: chatkitOptions.disclaimer && chatkitOptions.disclaimer.text && chatkitOptions.disclaimer.text.trim() !== '' ? {
      text: chatkitOptions.disclaimer.text.trim(),
    } : undefined,
    threadItemActions: (chatkitOptions.threadItemActions &&
      (chatkitOptions.threadItemActions.feedback === true || chatkitOptions.threadItemActions.retry === true)) ? {
      feedback: chatkitOptions.threadItemActions.feedback === true,
      retry: chatkitOptions.threadItemActions.retry === true,
    } : undefined,
    // History panel configuration
    history: chatkitOptions.history !== undefined ? (() => {
      const historyConfig: any = {}
      if (chatkitOptions.history.enabled !== undefined) {
        historyConfig.enabled = chatkitOptions.history.enabled
      }
      if (chatkitOptions.history.showDelete !== undefined) {
        historyConfig.showDelete = chatkitOptions.history.showDelete
      }
      if (chatkitOptions.history.showRename !== undefined) {
        historyConfig.showRename = chatkitOptions.history.showRename
      }
      return Object.keys(historyConfig).length > 0 ? historyConfig : undefined
    })() : undefined,
  }), [agentId, apiKey, chatbot, theme, chatkitOptions, useChatKitInRegularStyle, serverOrigin])

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
  const widgetPopoverPositionStyle = getPopoverPositionStyle(chatbot)

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
            ...containerStyle,
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
            zIndex: (deploymentType === 'popover' || deploymentType === 'popup-center')
              ? (chatbot as any).widgetZIndex || Z_INDEX.chatWidgetWindow
              : undefined,
          } as any}
        >
          <style>{`
            /* Use ID selector to achieve maximum specificity */
            #chatbot-native-container {
                border-radius: var(--container-border-radius) !important;
                border: var(--container-border) !important;
                outline: var(--container-outline) !important;
                
                width: var(--container-width) !important;
                height: var(--container-height) !important;
                max-height: var(--container-max-height) !important;
                max-width: var(--container-max-width) !important;
                min-height: var(--container-min-height) !important;
                min-width: var(--container-min-width) !important;
                /* Removed box-shadow here, moved to inner container */
                
                /* Explicitly allow overflow so shadow is visible */
                overflow: visible !important;
            }

            /* Inner container handles clipping */
            #chatbot-native-inner {
                width: 100%;
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                /* Explicitly use the variable instead of inherit to ensure it works */
                border-radius: var(--container-border-radius) !important;
                /* Allow overflow to show shadow */
                overflow: visible !important;
                display: flex;
                flex-direction: column;
                background: inherit;
                box-shadow: var(--container-box-shadow) !important;
            }
            
            /* Inner wrapper that actually clips to border radius */
            #chatbot-content-wrapper {
                width: 100%;
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: inherit;
                overflow: hidden !important;
                display: flex;
                flex-direction: column;
                background: inherit;
                -webkit-mask-image: -webkit-radial-gradient(white, black) !important;
            }
            
            /* Clean up iframes - remove any default borders */
            #chatbot-native-inner iframe {
                border: none !important;
                outline: none !important;
                box-shadow: none !important;
            }
          `}</style>
          
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
            <style>{`
                @keyframes chatbotPopoverFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                }

                @keyframes chatbotPopoverFadeOut {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                }

                .chatbot-popover-container {
                transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
                }

                .chatbot-popover-enter {
                animation: chatbotPopoverFadeIn 0.25s ease-out forwards;
                }

                .chatbot-popover-exit {
                animation: chatbotPopoverFadeOut 0.2s ease-in forwards;
                }
            `}</style>
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
