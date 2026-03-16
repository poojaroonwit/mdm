import { ChatbotConfig } from '../types'
import { Z_INDEX } from '@/lib/z-index'

export interface WidgetConfig {
    // Appearance
    avatarStyle: 'circle' | 'square' | 'circle-with-label' | 'custom' | 'rounded-diagonal'
    avatarType: 'icon' | 'image' | 'none'
    avatarImageUrl: string
    avatarCloseType?: 'icon' | 'image'
    avatarCloseIcon?: string
    avatarCloseImageUrl?: string
    avatarIcon: string
    avatarIconColor: string

    // Dimensions & Layout
    size: string
    position: string
    offsetX: string
    offsetY: string
    zIndex: number

    // Styling
    backgroundColor: string
    openBackgroundColor?: string
    openBackgroundImage?: string
    borderColor: string
    borderWidth: string
    borderRadius: string
    paddingX?: string
    paddingY?: string
    padding?: string
    paddingTop?: string
    paddingRight?: string
    paddingBottom?: string
    paddingLeft?: string

    // Shadow
    shadowColor: string
    shadowBlur: string
    shadowX: string
    shadowY: string
    shadowSpread: string
    boxShadow: string

    // Label (Specific to circle-with-label)
    labelText: string
    labelColor: string
    labelBorderRadius: string
    labelShowIcon: boolean
    labelIconPosition: 'left' | 'right'

    // Badge
    showBadge: boolean
    badgeColor: string

    // Animation
    animation: string

    // Overlay
    overlayEnabled: boolean
    overlayColor: string
    overlayOpacity: number
    overlayBlur: number

    // Chat Window Config (Passed through for convenience)
    chatWidth: string
    chatHeight: string
    popoverPosition: 'left' | 'top'
    popoverMargin: string
    widgetBlur: number
    widgetOpacity: number
    chatBlur: number
    chatOpacity: number

    // Chat Window Specifics (Synced with Emulator)
    chatWindowShadowColor: string
    chatWindowShadowBlur: string
    chatWindowBoxShadow: string
    chatWindowBorderWidth: string
    chatWindowBorderColor: string
    chatWindowBorder: string
    chatWindowBorderRadius: string
    chatBackgroundColor: string
    chatPaddingX?: string
    chatPaddingY?: string

    fontFamily: string
    fontSize: string
    fontColor: string
}

// Logic extracted from ChatWidgetButton.tsx and route.ts
export function getWidgetConfig(chatbot: ChatbotConfig, theme?: any, baseUrl?: string): WidgetConfig {
    const c = chatbot as any; // Access potential loose props

    const isChatKit = c.engineType === 'chatkit';
    const chatKitAccentColor = isChatKit && theme?.color?.accent?.primary
        ? theme.color.accent.primary
        : null;

    // Helper to resolve relative URLs
    // baseUrl is used server-side (where window is undefined) to resolve relative URLs.
    // On the client, window.location.origin is used.
    const resolveUrl = (url: string | undefined) => {
        if (!url) return '';
        if (url.startsWith('data:') || url.startsWith('blob:')) return url;

        const origin = typeof window !== 'undefined' ? window.location.origin : (baseUrl || '');

        // Normalize /api/assets proxy URLs to use the current origin.
        // This handles the case where NEXTAUTH_URL was set to an internal hostname
        // (e.g. http://app-internal:3000) that external browsers cannot reach.
        if (url.startsWith('http') && url.includes('/api/assets')) {
            try {
                const parsed = new URL(url);
                if (parsed.pathname.startsWith('/api/assets') && origin) {
                    return origin + parsed.pathname + parsed.search;
                }
            } catch (_) {}
        }

        if (url.startsWith('http')) return url; // External absolute URL — keep as-is

        if (url.startsWith('/') && origin) {
            return origin + url;
        }

        return url;
    };

    // 1. Basic Style Props
    const avatarStyle = c.widgetAvatarStyle || 'circle'
    const avatarImageUrl = resolveUrl(c.widgetAvatarImageUrl || c.avatarImageUrl || c.headerAvatarImageUrl || c.headerLogo || '')
    let avatarType = c.widgetAvatarType || c.avatarType || c.headerAvatarType || (avatarImageUrl ? 'image' : 'icon')
    // If Custom / Image Only style is selected and an image exists, force image type
    if (avatarStyle === 'custom' && avatarImageUrl) {
        avatarType = 'image'
    }
    const avatarCloseType = c.widgetCloseAvatarType || 'icon' // default to icon for close state
    const avatarCloseIcon = c.widgetCloseAvatarIcon || 'X' // default to X for close icon
    const avatarCloseImageUrl = resolveUrl(c.widgetCloseImageUrl || '')
    const avatarIcon = c.widgetAvatarIcon || c.avatarIcon || 'Bot'

    // 2. Colors
    const backgroundColor = c.widgetBackgroundColor || chatKitAccentColor || c.primaryColor || '#3b82f6'
    const labelColor = c.widgetLabelColor || '#ffffff'

    // 3. Icon Color Logic (Smart Fallback)
    // If no specific icon color is set:
    // - If style is 'circle-with-label', use label color (usually contrasting with button bg)
    // - Otherwise default to white or black based on background luminance
    let avatarIconColor = c.avatarIconColor;
    if (!avatarIconColor) {
        if (avatarStyle === 'circle-with-label') {
            avatarIconColor = labelColor;
        } else {
            // Smart fallback based on background color
            avatarIconColor = isLightColorWidget(backgroundColor) ? '#000000' : '#ffffff';
        }
    }

    // 4. Dimensions
    const size = c.widgetSize || '60px'
    const width = size // Base width for circle/square

    // 5. Border Radius
    // For circle style, always use 50% regardless of widgetBorderRadius setting
    // For square style, use widgetBorderRadius or default to 8px
    let borderRadius: string
    if (avatarStyle === 'circle') {
        borderRadius = '50%' // Always circular for circle style
    } else {
        // Check for individual corner properties which are saved by the admin UI
        const tl = c.widgetBorderRadiusTopLeft
        const tr = c.widgetBorderRadiusTopRight
        const br = c.widgetBorderRadiusBottomRight
        const bl = c.widgetBorderRadiusBottomLeft

        if (tl || tr || br || bl) {
            borderRadius = `${tl || '0px'} ${tr || '0px'} ${br || '0px'} ${bl || '0px'}`
        } else {
            borderRadius = c.widgetBorderRadius || (avatarStyle === 'square' ? '8px' : '50%')
        }
    }

    const labelBorderRadius = c.widgetLabelBorderRadius || borderRadius || '8px'

    // 6. Button Shadows
    const shadowColor = c.widgetShadowColor || 'rgba(0,0,0,0.2)'
    const shadowBlur = extractNumericValue(c.widgetShadowBlur || '0px')
    const shadowX = extractNumericValue(c.widgetShadowX || '0px')
    const shadowY = extractNumericValue(c.widgetShadowY || '0px')
    const shadowSpread = extractNumericValue(c.widgetShadowSpread || '0px')

    const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
        ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
        : 'none'

    // 7. Chat Window Styles
    // Shadow
    const chatWindowShadowColor = c.chatWindowShadowColor || c.shadowColor || '#000000'
    const chatWindowShadowBlur = c.chatWindowShadowBlur || c.shadowBlur || '4px'
    const chatWindowBoxShadow = `0 0 ${chatWindowShadowBlur} ${chatWindowShadowColor}`

    // Border
    const chatWindowBorderWidth = c.chatWindowBorderWidth || c.borderWidth || '1px'
    const chatWindowBorderColor = c.chatWindowBorderColor || c.borderColor || '#e5e7eb'
    const chatWindowBorder = `${chatWindowBorderWidth} solid ${chatWindowBorderColor}`
    const chatWindowBorderRadius = c.chatWindowBorderRadius || c.borderRadius || '8px'

    // Background (Complex Logic)
    let chatWindowBackground = resolveUrl(c.messageBoxColor || '#ffffff');
    const bgValue = chatWindowBackground;
    const bgAlpha = c.chatWindowBackgroundOpacity !== undefined ? c.chatWindowBackgroundOpacity : 100;

    // Helper to generate background style string (mirrors script logic but computed here)
    if (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/')) {
        const imageUrl = bgValue.startsWith('url(') ? bgValue : `url(${bgValue})`;
        // We will return a serialized CSS string for the script to use, OR handle this in script?
        // Actually, scriptGenerator expects a CSS string for `background` or `background-image` etc
        // Let's simplified this: return the 'main' value, and script handles standard parsing, 
        // OR we return a fully composed "background: ..." string.
        // Given scriptGenerator has `getBackgroundStyle`, passing specific components is safer.
    }

    // Actually, `scriptGenerator` has `getBackgroundStyle` which is robust. 
    // Let's pass the raw components needed for that function, 
    // OR pre-calculate the CSS string if we want to remove logic from script.
    // Plan says "Remove manual calculation... Use new properties".
    // So let's return the computed `chatWindowBackgroundStyle` string.

    // Re-implementing simplified `getBackgroundStyle` logic for server-side computation
    // Note: We need hexToRgb here if we want to support opacity on hex colors.
    // Ensure hexToRgb is available or imported. It's not in this file. 
    // To avoid dependency hell, let's keep `getBackgroundStyle` in scriptGenerator for now 
    // but pass the CORRECT raw values (which we are doing: messageBoxColor, opacity, blur).
    // So we just need to pass the "Chat Window" specific ones cleanly.

    return {
        avatarStyle,
        avatarType,
        avatarImageUrl,
        avatarCloseType,
        avatarCloseIcon,
        avatarCloseImageUrl,
        avatarIcon,
        avatarIconColor,

        size,
        position: c.widgetPosition || 'bottom-right',
        offsetX: c.widgetOffsetX || '20px',
        offsetY: c.widgetOffsetY || '20px',
        zIndex: c.widgetZIndex || Z_INDEX.chatWidget,

        backgroundColor,
        openBackgroundColor: resolveUrl(c.widgetOpenBackgroundColor || undefined),
        openBackgroundImage: resolveUrl(c.widgetOpenBackgroundImage || undefined),
        borderColor: c.widgetBorderColor || '#ffffff',
        borderWidth: c.widgetBorderWidth || '2px',
        borderRadius,
        padding: c.widgetPadding,
        paddingX: c.widgetPaddingX,
        paddingY: c.widgetPaddingY,
        paddingTop: c.widgetPaddingTop,
        paddingRight: c.widgetPaddingRight,
        paddingBottom: c.widgetPaddingBottom,
        paddingLeft: c.widgetPaddingLeft,

        shadowColor,
        shadowBlur,
        shadowX,
        shadowY,
        shadowSpread,
        boxShadow,

        labelText: c.widgetLabelText || 'Chat',
        labelColor,
        labelBorderRadius,
        labelShowIcon: c.widgetLabelShowIcon !== false,
        labelIconPosition: c.widgetLabelIconPosition || 'left',

        showBadge: c.showNotificationBadge || false,
        badgeColor: c.notificationBadgeColor || '#ef4444',

        // Map widgetAnimation to widgetAnimationEntry for backward compatibility
        animation: (() => {
          if (c.widgetAnimationEntry) {
            return c.widgetAnimationEntry
          }
          // Map old widgetAnimation values to new ones
          if (c.widgetAnimation === 'slide') return 'slide-up'
          if (c.widgetAnimation === 'bounce') return 'scale'
          if (c.widgetAnimation === 'none') return 'fade' // 'none' not supported, use fade
          return c.widgetAnimation || 'fade'
        })(),

        overlayEnabled: c.overlayEnabled !== undefined ? c.overlayEnabled : false,
        overlayColor: c.overlayColor || '#000000',
        overlayOpacity: c.overlayOpacity !== undefined ? c.overlayOpacity : 50,
        overlayBlur: c.overlayBlur || 0,

        chatWidth: c.chatWindowWidth || '380px',
        chatHeight: c.chatWindowHeight || '600px',
        popoverPosition: c.popoverPosition || 'left',
        popoverMargin: c.widgetPopoverMargin || '10px',
        widgetBlur: c.widgetBackgroundBlur || 0,
        widgetOpacity: c.widgetBackgroundOpacity !== undefined ? c.widgetBackgroundOpacity : 100,

        // Window Specifics
        chatWindowShadowColor,
        chatWindowShadowBlur,
        chatWindowBoxShadow,
        chatWindowBorderWidth,
        chatWindowBorderColor,
        chatWindowBorder,
        chatWindowBorderRadius,

        chatBlur: c.chatWindowBackgroundBlur || 0,
        chatOpacity: c.chatWindowBackgroundOpacity !== undefined ? c.chatWindowBackgroundOpacity : 100,
        chatBackgroundColor: c.messageBoxColor || '#ffffff',

        chatPaddingX: c.chatWindowPaddingX,
        chatPaddingY: c.chatWindowPaddingY,

        fontFamily: c.fontFamily || 'Inter',
        fontSize: c.fontSize || '14px',
        fontColor: c.fontColor || '#000000'
    }
}

function extractNumericValue(value: string): string {
    if (!value) return '0';
    const match = value.toString().match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : '0';
}

/**
 * Simple luminance check to determine if a color is light or dark.
 * Supports hex only for simplicity here.
 */
function isLightColorWidget(color: string): boolean {
    if (!color || typeof color !== 'string') return true;

    let hex = color.trim();
    if (!hex.startsWith('#')) return false; // Fallback for gradients or non-hex

    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    if (hex.length !== 6) return false;

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Perceived brightness formula
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
}
