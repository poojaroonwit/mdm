import React, { useMemo } from 'react'
import { X, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from '../types'
import { getWidgetConfig } from '../utils/widgetConfigHelper'
import { buildChatKitTheme } from './chatkit/configBuilder'

interface ChatWidgetButtonProps {
    chatbot: ChatbotConfig
    isOpen: boolean
    onClick: () => void
    widgetButtonStyle: React.CSSProperties
    popoverPositionStyle: React.CSSProperties
    onDebugToggle?: () => void
}

export function ChatWidgetButton({
    chatbot,
    isOpen,
    onClick,
    widgetButtonStyle,
    popoverPositionStyle,
    onDebugToggle
}: ChatWidgetButtonProps) {
    // Re-use logic from shared helper to ensure 100% parity with embed script
    const config = useMemo(() => {
        // Theme is needed for accent color fallback
        const theme = buildChatKitTheme(chatbot)
        const computed = getWidgetConfig(chatbot, theme)
        return computed
    }, [chatbot])

    // Debug trigger (hold Alt + click)
    const handleClick = (e: React.MouseEvent) => {
        if (e.altKey && onDebugToggle) {
            e.preventDefault()
            e.stopPropagation()
            onDebugToggle()
            return
        }
        onClick()
    }

    const containerStyle = useMemo(() => {
        // Calculate the "ideal" background pieces from the utility
        // Strictly separate color from image/gradient to avoid shorthand issues
        let bgColor = widgetButtonStyle.backgroundColor || 'transparent'
        let bgImage = widgetButtonStyle.backgroundImage || widgetButtonStyle.background || 'none'

        // When chat is OPEN, swap to open-state background if configured
        if (isOpen) {
            if (config.openBackgroundImage) {
                // Open state has a background image
                const imgUrl = config.openBackgroundImage
                bgImage = imgUrl.startsWith('url(') ? imgUrl : `url(${imgUrl})`
                bgColor = 'transparent'
            } else if (config.openBackgroundColor) {
                const openBg = config.openBackgroundColor
                // Check if the open background is an image URL
                if (openBg.startsWith('url(') || openBg.startsWith('http://') || openBg.startsWith('https://') || openBg.startsWith('/')) {
                    bgImage = openBg.startsWith('url(') ? openBg : `url(${openBg})`
                    bgColor = 'transparent'
                } else if (openBg.toLowerCase().includes('gradient')) {
                    bgImage = openBg
                    bgColor = 'transparent'
                } else {
                    bgColor = openBg
                    bgImage = 'none'
                }
            }
        }
        
        // Final border radius calculation
        const finalBorderRadius = config.avatarStyle === 'circle' ? '50%' : (config.borderRadius || (widgetButtonStyle as any).borderRadius || '50%');
        const activeBorderRadius = (!isOpen && config.avatarStyle === 'circle-with-label') ? config.labelBorderRadius : finalBorderRadius;

        // Extract border and shadow for granular enforcement
        const borderParts = (widgetButtonStyle.border as string || '0px solid transparent').split(' ')
        const borderWidth = borderParts[0] || '0px'
        const borderColor = borderParts.slice(2).join(' ') || 'transparent'
        const boxShadow = (widgetButtonStyle.boxShadow as string) || 'none'

        // Determine avatar image/icon size
        const avatarSize = config.avatarStyle === 'circle-with-label' ? '24px' : '60%'

        // Base object - strictly avoid shorthand vs longhand conflicts here for React
        const style: any = {
            ...popoverPositionStyle,
            // Fallback for non-important rules
            borderRadius: activeBorderRadius,
            // Use CSS variables for !important overrides in the <style> tag
            '--widget-border-radius': activeBorderRadius,
            '--widget-bg-color': bgColor,
            '--widget-bg-image': bgImage,
            '--widget-bg-size': widgetButtonStyle.backgroundSize || 'cover',
            '--widget-bg-pos': widgetButtonStyle.backgroundPosition || 'center',
            '--widget-bg-repeat': widgetButtonStyle.backgroundRepeat || 'no-repeat',
            '--widget-border-width': borderWidth,
            '--widget-border-color': borderColor,
            '--widget-box-shadow': boxShadow,
            '--avatar-size': avatarSize,
            '--widget-padding-top': config.paddingTop || config.paddingY || config.padding || '0px',
            '--widget-padding-right': config.paddingRight || config.paddingX || config.padding || '0px',
            '--widget-padding-bottom': config.paddingBottom || config.paddingY || config.padding || '0px',
            '--widget-padding-left': config.paddingLeft || config.paddingX || config.padding || '0px',
            zIndex: config.zIndex,
            cursor: 'pointer',
        }

        // Apply shared layout props
        if (!isOpen && config.avatarStyle === 'circle-with-label') {
            style.width = 'auto'
            style.height = config.size
            style.paddingLeft = '16px'
            style.paddingRight = '16px'
            style.display = 'flex'
            style.alignItems = 'center'
            style.gap = '8px'
            style.flexDirection = 'row'
            style.justifyContent = 'center'
            style.minWidth = config.size
            style.boxShadow = config.boxShadow !== 'none' ? config.boxShadow : undefined
        } else {
            // Standard circle/square button layout
            Object.assign(style, {
                width: (chatbot as any).widgetSize || '60px',
                height: (chatbot as any).widgetSize || '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            })
        }

        return style as React.CSSProperties
    }, [isOpen, config, popoverPositionStyle, widgetButtonStyle, chatbot])

    return (
        <>
            <style>{`
                /* Use ID selector to achieve maximum specificity (1, 0, 0) and beat global styles */
                #chatbot-widget-button,
                button#chatbot-widget-button.transition-all {
                    border-radius: var(--widget-border-radius) !important;
                    /* Use longhand properties to avoid shorthand reset bugs */
                    background-color: var(--widget-bg-color) !important;
                    background-image: var(--widget-bg-image) !important;
                    background-size: var(--widget-bg-size) !important;
                    background-position: var(--widget-bg-pos) !important;
                    background-repeat: var(--widget-bg-repeat) !important;
                    
                    /* Border and Shadow Enforcement */
                    border-width: var(--widget-border-width) !important;
                    border-color: var(--widget-border-color) !important;
                    border-style: solid !important;
                    box-shadow: var(--widget-box-shadow) !important;

                    overflow: hidden !important;
                    box-sizing: border-box !important;
                    padding-top: var(--widget-padding-top) !important;
                    padding-right: var(--widget-padding-right) !important;
                    padding-bottom: var(--widget-padding-bottom) !important;
                    padding-left: var(--widget-padding-left) !important;
                    margin: 0 !important;
                    min-width: 0 !important;
                    min-height: 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    outline: none !important;
                    appearance: none !important;
                    -webkit-appearance: none !important;
                    text-transform: none !important;
                    text-decoration: none !important;
                }
                
                #chatbot-widget-button img {
                    border-radius: var(--widget-border-radius) !important;
                    width: var(--avatar-size) !important;
                    height: var(--avatar-size) !important;
                    object-fit: cover !important;
                    /* Ensure image doesn't have a background/border of its own that conflicts */
                    background: transparent !important;
                    border: none !important;
                }
                
                #chatbot-widget-button svg {
                    width: var(--avatar-size) !important;
                    height: var(--avatar-size) !important;
                }
            `}</style>
            <button
                id="chatbot-widget-button"
                type="button"
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
                onClick={handleClick}
                style={containerStyle}
                className="transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center relative"
                data-widget-button="true"
            >
            {isOpen ? (
                (() => {
                    if (config.avatarCloseType === 'image' && config.avatarCloseImageUrl) {
                        return (
                            <img
                                src={config.avatarCloseImageUrl}
                                alt="Close chat"
                                className="h-6 w-6 object-contain"
                                style={{
                                    width: '24px !important',
                                    height: '24px !important',
                                    background: 'transparent !important',
                                    borderRadius: '0 !important'
                                }}
                            />
                        )
                    }
                    const IconName = config.avatarCloseIcon as string
                    const IconComponent = (Icons as any)[IconName] || X
                    return <IconComponent className="h-6 w-6" style={{ color: config.avatarIconColor }} />
                })()
            ) : (
                (() => {
                    const renderIcon = () => {
                        if (config.avatarType === 'image' && config.avatarImageUrl) {
                            return (
                                <img
                                    src={config.avatarImageUrl}
                                    alt="Chat"
                                />
                            )
                        }
                        const IconName = config.avatarIcon as string
                        const IconComponent = (Icons as any)[IconName] || Bot
                        return <IconComponent
                            style={{ color: config.avatarIconColor }}
                        />
                    }

                    if (config.avatarStyle === 'circle-with-label') {
                        return (
                            <>
                                {(config.labelShowIcon && config.labelIconPosition === 'left') && renderIcon()}
                                <span style={{ color: config.labelColor, fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {config.labelText}
                                </span>
                                {(config.labelShowIcon && config.labelIconPosition === 'right') && renderIcon()}
                            </>
                        )
                    }

                    return renderIcon()
                })()
            )}

            {/* Badge Render Logic */}
            {config.showBadge && !isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: config.badgeColor,
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '2px solid white',
                    boxSizing: 'border-box',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    1
                </div>
            )}
        </button>
        </>
    )
}

