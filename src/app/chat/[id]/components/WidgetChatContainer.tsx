import React from 'react'
import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../types'
import { ChatHeader } from './ChatHeader'
import { motion } from 'framer-motion'
import { PWAInstallBanner } from './PWAInstallBanner'


interface WidgetChatContainerProps {
    chatbot: ChatbotConfig
    containerStyle: React.CSSProperties
    chatStyle: React.CSSProperties
    emulatorConfig: any
    isMobile: boolean
    isEmbed: boolean
    isPreview?: boolean
    useChatKitInRegularStyle: boolean
    shouldRenderChatKit: boolean
    effectiveDeploymentType: 'popover' | 'fullpage' | 'popup-center'
    handleClose: () => void
    onClearSession: () => void
    children: React.ReactNode
}

export function WidgetChatContainer({
    chatbot,
    containerStyle,
    chatStyle,
    emulatorConfig,
    isMobile,
    isEmbed,
    isPreview,
    useChatKitInRegularStyle,
    shouldRenderChatKit,
    effectiveDeploymentType,
    handleClose,
    onClearSession,
    children
}: WidgetChatContainerProps) {
    const showEmulatorOverlay = emulatorConfig.text || emulatorConfig.description

    const showDesktopHeader = ((chatbot as any).headerEnabled !== false) &&
        ((!shouldRenderChatKit || useChatKitInRegularStyle) && !isMobile && effectiveDeploymentType !== 'fullpage')

    const showMobileHeader = isMobile && ((chatbot as any).headerEnabled !== false)

    // On mobile, show close button when:
    // - popover/popup-center modes (widget-based)
    // OR when popover is open on mobile (since CSS makes it 100% fullpage, let user close it)
    // Do NOT show close for true fullpage deployment (user intentionally chose fullpage)
    const mobileHeaderCloseCallback = (
        effectiveDeploymentType === 'popover' ||
        effectiveDeploymentType === 'popup-center'
    )
        ? handleClose
        : undefined

    // Extract padding to apply selectively (Header should not have top padding)
    const { paddingTop, paddingBottom, paddingLeft, paddingRight, ...stylesWithoutPadding } = containerStyle as any
    // Reconstruct container style without padding
    const isFullPage = effectiveDeploymentType === 'fullpage' || isMobile
    const adaptedContainerStyle = {
        ...stylesWithoutPadding,
        paddingLeft,
        paddingRight,
        paddingBottom,
        paddingTop: (showDesktopHeader || showMobileHeader) ? 0 : paddingTop,
        // For fullpage views, ensure we use full height. 
        // For popovers, we MUST respect the configured height from getContainerStyle (stylesWithoutPadding.height)
        ...(isFullPage ? {
            minHeight: '100%',
            height: '100%',
            flex: 1
        } : {
            // Respect height from containerStyle
            height: stylesWithoutPadding.height || 'auto'
        })
    }

    // Default config values

    // Map old widgetAnimation to widgetAnimationEntry for backward compatibility
    const legacyEntryType = chatbot.widgetAnimation
    const mappedEntryType = legacyEntryType === 'slide' ? 'slide-up' 
      : legacyEntryType === 'bounce' ? 'scale'
      : legacyEntryType === 'none' ? 'fade'
      : legacyEntryType || undefined
    
    const entryType = chatbot.widgetAnimationEntry || mappedEntryType || (isFullPage ? 'slide-up' : 'scale')
    const exitType = chatbot.widgetAnimationExit || (isFullPage ? 'slide-down' : 'scale')
    const duration = chatbot.widgetAnimationDuration || 0.3
    const animType = chatbot.widgetAnimationType || 'spring'

    // Helper to get variants
    const getVariant = (type: string, state: 'initial' | 'animate' | 'exit') => {
        switch (type) {
            case 'slide-up':
                // Slides up from bottom (y: 100%) to center (y: 0)
                return state === 'animate' ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }
            case 'slide-down':
                // Slides down from top (y: -100%) to center (y: 0) when entering
                // Slides down from center (y: 0) to bottom (y: 100%) when exiting
                if (state === 'exit') {
                    return { y: '100%', opacity: 0 }
                }
                return state === 'animate' ? { y: 0, opacity: 1 } : { y: '-100%', opacity: 0 }
            case 'slide-side':
                // Slides in from right (x: 100%) to center (x: 0)
                return state === 'animate' ? { x: 0, opacity: 1 } : { x: '100%', opacity: 0 }
            case 'scale':
                return state === 'animate' ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.95, opacity: 0, y: 10 }
            case 'fade':
                return state === 'animate' ? { opacity: 1 } : { opacity: 0 }
            default:
                return state === 'animate' ? { opacity: 1 } : { opacity: 0 }
        }
    }

    const animationProps = {
        initial: getVariant(entryType, 'initial'),
        animate: getVariant(entryType, 'animate'),
        exit: getVariant(exitType, 'exit'),
        transition: animType === 'spring' ? {
            type: 'spring' as const,
            duration: duration,
            damping: 25,
            stiffness: 200,
        } : {
            type: 'tween' as const,
            duration: duration,
            ease: "easeOut" as const
        }
    }

    // Pass border radius and dimensions as CSS variables for the style tag to pick up
    const rawRadius = adaptedContainerStyle.borderRadius
    const containerBorderRadius = isFullPage ? '0px' : (rawRadius !== undefined && rawRadius !== null ? (typeof rawRadius === 'number' ? `${rawRadius}px` : rawRadius) : '8px')
    const containerBorder = isFullPage ? 'none' : (adaptedContainerStyle.border || 'none')
    const containerWidth = adaptedContainerStyle.width || 'auto'
    const containerHeight = adaptedContainerStyle.height || 'auto'
    const containerMaxHeight = adaptedContainerStyle.maxHeight || 'none'
    const containerMaxWidth = adaptedContainerStyle.maxWidth || 'none'
    const containerMinHeight = adaptedContainerStyle.minHeight || '0'
    const containerMinWidth = adaptedContainerStyle.minWidth || '0'
    const containerBoxShadow = isFullPage ? 'none' : (adaptedContainerStyle.boxShadow || 'none')

    console.log('[WidgetChatContainer] Debug Styles:', {
        containerWidth,
        containerHeight,
        containerMaxWidth,
        containerMaxHeight,
        containerBorderRadius,
        containerBoxShadow, // Added for debugging
        deploymentType: effectiveDeploymentType,
        chatbotId: chatbot.id
    })

    return (
        <motion.div
            id="chatbot-widget-container"
            className="flex flex-col relative"
            style={{
                ...adaptedContainerStyle,
                '--container-border-radius': containerBorderRadius,
                '--container-width': containerWidth,
                '--container-height': containerHeight,
                '--container-max-height': containerMaxHeight,
                '--container-max-width': containerMaxWidth,
                '--container-min-height': containerMinHeight,
                '--container-min-width': containerMinWidth,
                '--container-box-shadow': containerBoxShadow,
            } as any}
            data-widget-container="true"
            {...animationProps}
        >
            <style>{`
                /* Use ID selector to achieve maximum specificity */
                #chatbot-widget-container {
                    border-radius: var(--container-border-radius) !important;
                    width: var(--container-width) !important;
                    height: var(--container-height) !important;
                    max-height: var(--container-max-height) !important;
                    max-width: var(--container-max-width) !important;
                    min-height: var(--container-min-height) !important;
                    min-width: var(--container-min-width) !important;
                    box-shadow: var(--container-box-shadow) !important;
                    
                    /* Explicitly allow overflow so shadow is visible */
                    overflow: visible !important;
                    box-sizing: border-box !important;
                }

                /* Inner container handles clipping */
                #chatbot-widget-inner {
                    width: 100%;
                    height: 100%;
                    /* Explicitly use the variable instead of inherit to ensure it works */
                    border-radius: var(--container-border-radius) !important;
                    overflow: hidden !important;
                    transform: translateZ(0) !important;
                    -webkit-mask-image: -webkit-radial-gradient(white, black) !important;
                    display: flex;
                    flex-direction: column;
                }
            `}</style>
            
            {/* Inner wrapper for strict clipping */}
            <div id="chatbot-widget-inner">
                {/* Emulator text and description overlay - positioned below header */}
                {showEmulatorOverlay && (
                    <div className="absolute top-0 left-0 right-0 p-4 bg-black/50 text-white backdrop-blur-sm" style={{ zIndex: Z_INDEX.chatWidgetOverlayText }}>
                        {emulatorConfig.text && <h2 className="text-lg font-semibold mb-2">{emulatorConfig.text}</h2>}
                        {emulatorConfig.description && <p className="text-sm opacity-90">{emulatorConfig.description}</p>}
                    </div>
                )}

                {/* Main Chat Header (Desktop/Regular Style) - Fallback/Safety check */}
                {showDesktopHeader && (
                    <ChatHeader
                        chatbot={chatbot}
                        onClearSession={onClearSession}
                        onClose={handleClose}
                        isMobile={false}
                    />
                )}

                {/* Mobile header (back button layout) - Always show on mobile regardless of deployment type if enabled */}
                {showMobileHeader && (
                    <ChatHeader
                        chatbot={chatbot}
                        onClearSession={onClearSession}
                        onClose={mobileHeaderCloseCallback}
                        isMobile={true}
                    />
                )}

                {/* PWA Install Banner - Only render inside widget if scope is 'chat' (Inline) */}
                {/* If scope is 'website' (Overlay), it is rendered in page.tsx to persist when widget is closed */}
                {((chatbot as any).pwaInstallScope !== 'website') && (
                    <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
                )}

                <div className="flex-1 min-h-0 flex flex-col" style={{ ...chatStyle, paddingTop: (showDesktopHeader || showMobileHeader) ? paddingTop : 0 }}>
                    {children}
                </div>
            </div>
        </motion.div>
    )
}
