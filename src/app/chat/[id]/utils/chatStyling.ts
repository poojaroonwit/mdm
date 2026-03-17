import { ChatbotConfig } from '../types'
import React from 'react'
import { Z_INDEX } from '@/lib/z-index'

interface EmulatorConfig {
  backgroundColor?: string
  backgroundImage?: string
  text?: string
  description?: string
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `${r}, ${g}, ${b}`
}

// Buffer to prevent shadow clipping in iframes
export const SHADOW_BUFFER = 20

export function getChatStyle(chatbot: ChatbotConfig, chatkitOptions?: any): React.CSSProperties {
  const options = chatkitOptions || (chatbot as any).chatkitOptions
  const theme = options?.theme || {}
  const typography = theme.typography || {}

  return {
    fontFamily: typography.fontFamily || chatbot.fontFamily,
    fontSize: typography.fontSize ? `${typography.fontSize}px` : chatbot.fontSize,
    color: theme.color?.text || theme.textColor || chatbot.fontColor,
    backgroundColor: theme.color?.background || theme.backgroundColor || chatbot.openaiAgentSdkBackgroundColor || chatbot.messageBoxColor,
  }
}

// Helper to ensure units
export const ensureUnits = (val: string | number | undefined, defaultVal: string) => {
  if (!val) return defaultVal
  const strVal = String(val)
  return /^\d+$/.test(strVal) ? `${strVal}px` : strVal
}

export function getPopoverPositionStyle(chatbot: ChatbotConfig, isEmbed: boolean = false): React.CSSProperties {
  if (!chatbot) return { position: 'fixed' }
  const x = chatbot as any
  const pos = (x.widgetPosition || 'bottom-right') as string
  
  // In embed mode, the parent frame handles the main offset (widgetOffsetX/Y).
  // The internal container should only use the SHADOW_BUFFER to avoid clipping and double-offset.
  const offsetX = isEmbed ? `${SHADOW_BUFFER}px` : ensureUnits(x.widgetOffsetX, '20px')
  const offsetY = isEmbed ? `${SHADOW_BUFFER}px` : ensureUnits(x.widgetOffsetY, '20px')
  
  const style: React.CSSProperties = { position: 'fixed' }
  if (pos.includes('bottom')) (style as any).bottom = offsetY
  else (style as any).top = offsetY
  if (pos.includes('right')) (style as any).right = offsetX
  if (pos.includes('left')) (style as any).left = offsetX
  if (pos.includes('center')) {
    ; (style as any).left = '50%'
      ; (style as any).transform = 'translateX(-50%)'
  }
  return style
}

// ... (getContainerStyle is already updated)


// Helper to determine if ChatKit styles should be applied (border removal)
const isChatKit = (chatbot: ChatbotConfig) => {
  return chatbot.engineType === 'chatkit' || 
         chatbot.engineType === 'openai-agent-sdk' || 
         (chatbot as any).useChatKitInRegularStyle === true
}

export function getContainerStyle(
  chatbot: ChatbotConfig,
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center',
  emulatorConfig: EmulatorConfig,
  isMobile: boolean = false,
  isEmbed: boolean = false,
  isPreview: boolean = false,
  chatkitOptions?: any
): React.CSSProperties {
  const options = (chatbot as any).chatkitOptions || {}
  const theme = options.theme || {}

  // Add direct window check for resilience in case the isMobile prop hasn't propagated yet
  // but we are definitely in a small viewport
  const effectiveIsMobile = isMobile || (typeof window !== 'undefined' && window.innerWidth < 1024)

  const shadowColor = (chatbot as any).chatWindowShadowColor || chatbot.shadowColor || '#000000'
  const shadowBlurRaw = (chatbot as any).chatWindowShadowBlur || chatbot.shadowBlur || '4px'
  const shadowBlur = `${extractNumericValue(shadowBlurRaw)}px`

  // Base background style from emulator config
  const backgroundStyle: React.CSSProperties = {}
  if (emulatorConfig.backgroundColor) {
    backgroundStyle.backgroundColor = emulatorConfig.backgroundColor
  }
  if (emulatorConfig.backgroundImage) {
    backgroundStyle.backgroundImage = `url(${emulatorConfig.backgroundImage})`
    backgroundStyle.backgroundSize = 'cover'
    backgroundStyle.backgroundPosition = 'center'
    backgroundStyle.backgroundRepeat = 'no-repeat'
  }

  console.log('[chatStyling] getContainerStyle:', {
    engineType: chatbot.engineType,
    id: chatbot.id,
    deploymentType: previewDeploymentType,
    isChatKit: isChatKit(chatbot)
  })


    // Build box-shadow - Reverted to simple logic as per previous working version
    // This ignores X/Y/Spread for now to ensure reliability matching the "working" state
    const simpleShadow = `0 0 ${shadowBlur} ${shadowColor}`

    // Common background logic helper
    const getBackgroundStyle = () => {
    // Priority: Emulator Config > Chatbot Config (Theme) > Chatbot Config (Root) > Default

    // FIX: Do NOT use emulator config here for the Chat Container.
    // Emulator config (Page Background) should only apply to the outer page container (in page.tsx),
    // not to the Chat Window itself. The Chat Window should always use the chatbot's theme config.
    /*
    if (emulatorConfig.backgroundColor || emulatorConfig.backgroundImage) {
      return {
        backgroundColor: emulatorConfig.backgroundColor,
        backgroundImage: emulatorConfig.backgroundImage ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: emulatorConfig.backgroundImage ? 'cover' : undefined,
        backgroundPosition: emulatorConfig.backgroundImage ? 'center' : undefined,
        backgroundRepeat: emulatorConfig.backgroundImage ? 'no-repeat' : undefined,
      }
    }
    */

    // Get background value with proper fallback - ensure it's never empty
    // Fallback Priority:
    // 1. Explicit chatkitOptions theme colors
    // 2. Explicit legacy theme background/color (from theme.color.background or legacy theme.backgroundColor)
    // 3. ChatKit surface background (often used for main container)
    // 4. User configured page/message-box background
    // 5. Default white
    const theme = chatkitOptions?.theme || {}
    let bgValue = theme.color?.background || 
                 theme.backgroundColor || 
                 theme.color?.surface?.background || 
                 chatbot.openaiAgentSdkBackgroundColor || 
                 chatbot.pageBackgroundColor || 
                 chatbot.messageBoxColor || 
                 '#ffffff'
                 
    if (!bgValue || (typeof bgValue === 'string' && bgValue.trim() === '')) {
      bgValue = '#ffffff'
    }
    
    const opacity = (chatbot as any).chatWindowBackgroundOpacity !== undefined ? (chatbot as any).chatWindowBackgroundOpacity : 100

    // Check if it's an image URL
    if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
      const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`
      return {
        backgroundImage: imageUrl,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: opacity < 100 ? `rgba(255, 255, 255, ${opacity / 100})` : '#ffffff',
      }
    }
    
    // Check if it's a gradient
    if (bgValue && bgValue.toLowerCase().includes('gradient')) {
        return {
            backgroundImage: bgValue, // Use backgroundImage for gradients too
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }
    }

    // It's a color value - ensure we always set a valid background color
    const bgColor = bgValue || '#ffffff'
    if (opacity < 100) {
      // Check if it's already rgba/rgb
      if (bgColor && (bgColor.startsWith('rgba') || bgColor.startsWith('rgb'))) {
        const rgbMatch = bgColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          return { backgroundColor: `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})` }
        }
      }
      // Convert hex to rgba
      return { backgroundColor: bgColor ? `rgba(${hexToRgb(bgColor)}, ${opacity / 100})` : '#ffffff' }
    }
    return { backgroundColor: bgColor || '#ffffff' }
  }

  if (previewDeploymentType === 'popover') {
    // On mobile only, popover becomes fullpage layout (fills the container/iframe)
    // Desktop embed should still show as popover with proper positioning
    // Mobile conversion: whether embedded or not, the internal container should be fullpage
    // so it fills the 100% x 100% iframe when open on mobile
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0px',
        zIndex: Z_INDEX.chatWidget,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...getBackgroundStyle(),
      }
    }

    const x = chatbot as any
    const pos = (x.widgetPosition || 'bottom-right') as string
    const offsetX = x.widgetOffsetX || '20px'
    const offsetY = x.widgetOffsetY || '20px'
    const widgetSize = parseFloat(x.widgetSize || '60px') || 60
    const widgetSizePx =
      typeof x.widgetSize === 'string' && x.widgetSize.includes('px') ? parseFloat(x.widgetSize) : widgetSize

    const popoverMargin = x.widgetPopoverMargin || '10px'
    const popoverMarginPx = parseFloat(popoverMargin) || 10
    const popoverPos = (x.popoverPosition || 'top') as 'top' | 'left'
    const marginLeftPx = parseFloat(x.widgetPopoverMarginLeft || '0') || 0
    const marginRightPx = parseFloat(x.widgetPopoverMarginRight || '0') || 0

    // Border logic: Mobile gets no border/radius by default unless specifically overridden? 
    // User requested "border is setup differanace mobile and desktop"
    // Usually mobile is full screen so no border/radius.
    // But if isPreview is true on mobile device, we might want to see it?
    // Let's assume on Mobile (even in preview if it simulates mobile view properly) we want:
    // - No border (full width)
    // - No radius (full width)
    // - No shadow (full width)
    // UNLESS it's a "floating" mobile window? Typically mobile chat is full screen.
    
    const popoverStyle: React.CSSProperties = {
      position: 'fixed',
      width: ensureUnits((chatbot as any).chatWindowWidth, '380px'),
      height: ensureUnits((chatbot as any).chatWindowHeight, '600px'),
      // Remove duplicate height check
      border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth || '1px'} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor || '#e2e8f0'}`,
      borderRadius: ensureUnits(chatbot.chatWindowBorderRadius || chatbot.borderRadius, '12px'),
      boxShadow: effectiveIsMobile ? 'none' : simpleShadow,
      outline: undefined,
      zIndex: (chatbot as any).widgetZIndex || Z_INDEX.chatWidget,
      // Note: Emulator background should NOT be applied to popover - only to page background
      overflow: 'hidden',
      // Glassmorphism effect
      ...((chatbot as any).chatWindowBackgroundBlur && (chatbot as any).chatWindowBackgroundBlur > 0 ? {
        backdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
        WebkitBackdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
      } : {}),
      // Background color or image with opacity support
      ...getBackgroundStyle(),
      paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
      paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
      paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
      paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
      maxWidth: '100vw',
      // In embed mode, constrain height so chat window never clips above the iframe top.
      // The chat window bottom is at: SHADOW_BUFFER + widgetSizePx + popoverMarginPx (for 'top' position).
      // We need SHADOW_BUFFER of space above the window, so max-height = 100vh - bottomOffset - SHADOW_BUFFER.
      maxHeight: (isEmbed && !isPreview)
        ? (popoverPos === 'left'
          ? `calc(100vh - ${SHADOW_BUFFER * 2}px)`
          : `calc(100vh - ${SHADOW_BUFFER + widgetSizePx + popoverMarginPx + SHADOW_BUFFER}px)`)
        : '100vh',
      // boxSizing removed to match old version
    }

    // Logic ported from embed/route.ts
    if (popoverPos === 'top') {
      // Position popover above the widget button
      if (pos.includes('bottom')) {
        // Widget is at bottom, popover appears above it
        const bottomOffset = `calc(${offsetY} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).bottom = bottomOffset
      } else {
        const topOffset = `calc(${offsetY} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).top = topOffset
      }

      // Horizontal alignment matches widget position, with optional left/right margin
      if (pos.includes('right')) {
        ; (popoverStyle as any).right = marginRightPx > 0 ? `calc(${offsetX} + ${marginRightPx}px)` : offsetX
      } else if (pos.includes('left')) {
        ; (popoverStyle as any).left = marginLeftPx > 0 ? `calc(${offsetX} + ${marginLeftPx}px)` : offsetX
      } else if (pos.includes('center')) {
        ; (popoverStyle as any).left = '50%'
          ; (popoverStyle as any).transform = 'translateX(-50%)'
      }
    } else {
      // Position popover to the left/right of widget button (side-by-side)
      if (pos.includes('bottom')) {
        ; (popoverStyle as any).bottom = offsetY
      } else {
        ; (popoverStyle as any).top = offsetY
      }

      // Place popover beside the widget, with optional left/right margin
      if (pos.includes('right')) {
        // Widget is on right side, popover appears to the left of widget
        const rightOffset = marginRightPx > 0
          ? `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px + ${marginRightPx}px)`
          : `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).right = rightOffset
      } else if (pos.includes('left')) {
        // Widget is on left side, popover appears to the right of widget
        const leftOffset = marginLeftPx > 0
          ? `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px + ${marginLeftPx}px)`
          : `calc(${offsetX} + ${widgetSizePx}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).left = leftOffset
      } else if (pos.includes('center')) {
        // For center positions, place popover to the right of widget (default)
        ; (popoverStyle as any).left = `calc(50% + ${widgetSizePx / 2}px + ${popoverMarginPx}px)`
          ; (popoverStyle as any).transform = 'translateX(0)'
      }
    }

    return popoverStyle
  }

  if (previewDeploymentType === 'popup-center') {
    // On mobile or EMBED, popup-center logic needs careful handling. 
    // If embedded, it should probably fill the frame too if the frame is already the popup.
    // For now assuming popup-center embed script is full page overlay? 
    // Usually popup-center embed script creates a full-page overlay div with the iframe inside.
    // So if isEmbed is true, we want the content to be centered in that full frame? 
    // OR if the iframe itself is the popup box.
    // Current embed script (route.ts) doesn't seem to handle 'popup-center' explicitly with a different container structure 
    // other than 'popover' logic or default. 
    // Let's assume for now isEmbed mainly affects popover/fullpage.
    // Mobile conversion
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0px',
        zIndex: Z_INDEX.chatWidgetWindow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: 'none',
        ...getBackgroundStyle(), // Use updated background style helper
      }
    }

    return {
      width: ensureUnits((chatbot as any).chatWindowWidth, '90%'),
      // If user sets a custom width, that should be the max-width (or unconstrained). 
      // If NO width is specified, default to 640px constraint.
      maxWidth: (chatbot as any).chatWindowWidth ? '100vw' : '640px',
      maxHeight: ensureUnits((chatbot as any).chatWindowHeight, '700px'),
      height: ensureUnits((chatbot as any).chatWindowHeight, '700px'),
      // Remove duplicate height check
      border: `${chatbot.chatWindowBorderWidth || chatbot.borderWidth || '1px'} solid ${chatbot.chatWindowBorderColor || chatbot.borderColor || '#e2e8f0'}`,
      borderRadius: ensureUnits(chatbot.chatWindowBorderRadius || chatbot.borderRadius, '12px'),
      boxShadow: simpleShadow,
      outline: undefined,
      zIndex: Z_INDEX.chatWidgetWindow,
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      ...getBackgroundStyle(), // Use updated background style helper
      // Note: Emulator background should NOT be applied to popup-center - only to page background
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
      paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
      paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
      paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
      // boxSizing removed to match old version
    }
  }

  // fullpage
  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    // For fullpage/embed, we should apply the chatbot theme unless emulator/preview config overrides it
    ...getBackgroundStyle(),
    paddingLeft: (chatbot as any).chatWindowPaddingX || '0px',
    paddingRight: (chatbot as any).chatWindowPaddingX || '0px',
    paddingTop: (chatbot as any).chatWindowPaddingY || '0px',
    paddingBottom: (chatbot as any).chatWindowPaddingY || '0px',
    // Apply blur if configured
    ...((chatbot as any).chatWindowBackgroundBlur && (chatbot as any).chatWindowBackgroundBlur > 0 ? {
      backdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
      WebkitBackdropFilter: `blur(${(chatbot as any).chatWindowBackgroundBlur}px)`,
    } : {}),
  }
}

export function getOverlayStyle(
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center',
  chatbot?: ChatbotConfig,
  isOpen?: boolean,
  chatkitOptions?: any
): React.CSSProperties | undefined {
  // For popup-center, always show overlay (legacy behavior)
  if (previewDeploymentType === 'popup-center') {
    return { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: Z_INDEX.chatWidgetOverlay }
  }

  // For popover mode, check if overlay is enabled and chat is open
  if (previewDeploymentType === 'popover' && chatbot && isOpen) {
    const overlayEnabled = (chatbot as any).overlayEnabled !== undefined
      ? (chatbot as any).overlayEnabled
      : false

    if (!overlayEnabled) {
      return undefined
    }

    const overlayColor = (chatbot as any).overlayColor || '#000000'
    const overlayOpacity = (chatbot as any).overlayOpacity !== undefined
      ? (chatbot as any).overlayOpacity
      : 50
    const overlayBlur = (chatbot as any).overlayBlur || 0

    // Calculate background color with opacity
    let backgroundColor: string
    if (overlayColor.startsWith('rgba') || overlayColor.startsWith('rgb')) {
      // Extract RGB values and apply new opacity
      const rgbMatch = overlayColor.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (rgbMatch) {
        backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${overlayOpacity / 100})`
      } else {
        backgroundColor = overlayColor
      }
    } else {
      // Convert hex to rgba
      backgroundColor = `rgba(${hexToRgb(overlayColor)}, ${overlayOpacity / 100})`
    }

    const overlayStyle: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      backgroundColor,
      zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
        ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) - 1
        : Z_INDEX.chatWidgetOverlay, // Place overlay below widget and popover
    }

    // Apply blur if specified
    if (overlayBlur > 0) {
      overlayStyle.backdropFilter = `blur(${overlayBlur}px)`
      overlayStyle.WebkitBackdropFilter = `blur(${overlayBlur}px)`
    }

    return overlayStyle
  }

  return undefined
}

// Helper to extract numeric value from string like "8px" -> "8"
function extractNumericValue(value: string | undefined): string {
  if (!value) return '0'
  const match = value.toString().match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : '0'
}

export function getWidgetButtonStyle(chatbot: ChatbotConfig, chatkitOptions?: any): React.CSSProperties {
  if (!chatbot) return {}
  const options = chatkitOptions || (chatbot as any).chatkitOptions || {}
  const theme = options.theme || {}

  // Get widget background color with proper fallback
  // Fallback order: widget background > theme background > theme accent > theme primary > default blue
  let widgetBgValue = (chatbot as any).widgetBackgroundColor || 
                     (chatbot as any).widgetBackground ||
                     theme.color?.background || 
                     theme.backgroundColor || 
                     theme.color?.accent?.primary || 
                     theme.primaryColor || 
                     chatbot.primaryColor || 
                     '#3b82f6'
                     
  // Ensure we have a valid color value (not empty string)
  if (!widgetBgValue || (typeof widgetBgValue === 'string' && widgetBgValue.trim() === '')) {
    widgetBgValue = '#3b82f6'
  }
  
  const blurAmount = (chatbot as any).widgetBackgroundBlur || 0
  const opacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100

  // Build box-shadow with all properties (offsetX offsetY blur spread color)
  const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
  const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
  const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
  const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
  const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'

  const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
    : undefined

  // Determine border radius based on avatar style - CRITICAL: must respect widgetAvatarStyle
  const widgetAvatarStyle = (chatbot as any).widgetAvatarStyle || 'circle'
  let borderRadius: string
  
  if (widgetAvatarStyle === 'circle') {
    borderRadius = '50%' // Always circular for circle style, ignore widgetBorderRadius and corners
  } else if (widgetAvatarStyle === 'rounded-diagonal') {
    borderRadius = '30px 0px 30px 0px' // top-left and bottom-right rounded
  } else {
    // Check for individual corner properties which are saved by the admin UI
    const tl = (chatbot as any).widgetBorderRadiusTopLeft
    const tr = (chatbot as any).widgetBorderRadiusTopRight
    const br = (chatbot as any).widgetBorderRadiusBottomRight
    const bl = (chatbot as any).widgetBorderRadiusBottomLeft

    if (tl || tr || br || bl) {
      borderRadius = `${tl || '0px'} ${tr || '0px'} ${br || '0px'} ${bl || '0px'}`
    } else {
      borderRadius = (chatbot as any).widgetBorderRadius || (widgetAvatarStyle === 'square' ? '8px' : '50%')
    }
  }

  const baseStyle: React.CSSProperties = {
    width: (chatbot as any).widgetSize || '60px',
    height: (chatbot as any).widgetSize || '60px',
    borderRadius: borderRadius,
    border: widgetAvatarStyle === 'custom' ? 'none' : `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
    boxShadow: widgetAvatarStyle === 'custom' ? 'none' : boxShadow,
    zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
      ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
      : Z_INDEX.chatWidgetWindow, // Higher than popover to stay on top
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  }

  // Apply glassmorphism effect - hide for custom
  if (blurAmount > 0 && widgetAvatarStyle !== 'custom') {
    baseStyle.backdropFilter = `blur(${blurAmount}px)`
    baseStyle.WebkitBackdropFilter = `blur(${blurAmount}px)`
  }

  // Skip background for custom style
  if (widgetAvatarStyle === 'custom') {
    baseStyle.backgroundColor = 'transparent'
    baseStyle.backgroundImage = 'none'
    return baseStyle
  }

  // Check if it's an image URL (starts with url(, http://, https://, or /)
  if (widgetBgValue && (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/'))) {
    const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
    baseStyle.backgroundImage = imageUrl
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'
    // Apply opacity to background image
    if (opacity < 100) {
      baseStyle.backgroundColor = `rgba(255, 255, 255, ${opacity / 100})` // Fallback color with opacity
    }
  } else if (widgetBgValue && widgetBgValue.toLowerCase().includes('gradient')) {
    // Apply gradient to backgroundImage property to ensure it's picked up by ChatWidgetButton as a graphic
    baseStyle.backgroundImage = widgetBgValue
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'
    // Gradients don't support simple opacity modifiers easily without parsing
  } else {
    // It's a color value - ensure we always set a background color
    if (opacity < 100) {
      if (widgetBgValue && (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb'))) {
        const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          baseStyle.backgroundColor = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
        } else {
          baseStyle.backgroundColor = widgetBgValue || '#3b82f6'
        }
      } else {
        baseStyle.backgroundColor = widgetBgValue ? `rgba(${hexToRgb(widgetBgValue)}, ${opacity / 100})` : '#3b82f6'
      }
    } else {
      // Always set background color, even if opacity is 100%
      baseStyle.backgroundColor = widgetBgValue || '#3b82f6'
    }
  }

  return baseStyle
}

