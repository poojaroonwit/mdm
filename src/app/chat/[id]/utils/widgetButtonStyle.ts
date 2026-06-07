import React from 'react'

import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../types'
import { extractNumericValue, hexToRgb } from './chatStyleUtils'

export function getWidgetButtonStyle(chatbot: ChatbotConfig, chatkitOptions?: any): React.CSSProperties {
  if (!chatbot) return {}
  const options = chatkitOptions || (chatbot as any).chatkitOptions || {}
  const theme = options.theme || {}

  let widgetBgValue = (chatbot as any).widgetBackgroundColor ||
                     (chatbot as any).widgetBackground ||
                     theme.color?.background ||
                     theme.backgroundColor ||
                     theme.color?.accent?.primary ||
                     theme.primaryColor ||
                     chatbot.primaryColor ||
                     '#1e40af'

  if (!widgetBgValue || (typeof widgetBgValue === 'string' && widgetBgValue.trim() === '')) {
    widgetBgValue = '#1e40af'
  }

  const blurAmount = (chatbot as any).widgetBackgroundBlur || 0
  const opacity = (chatbot as any).widgetBackgroundOpacity !== undefined ? (chatbot as any).widgetBackgroundOpacity : 100

  const shadowX = extractNumericValue((chatbot as any).widgetShadowX || '0px')
  const shadowY = extractNumericValue((chatbot as any).widgetShadowY || '0px')
  const shadowBlur = extractNumericValue((chatbot as any).widgetShadowBlur || '0px')
  const shadowSpread = extractNumericValue((chatbot as any).widgetShadowSpread || '0px')
  const shadowColor = (chatbot as any).widgetShadowColor || 'rgba(0,0,0,0.2)'

  const boxShadow = (shadowBlur !== '0' || shadowX !== '0' || shadowY !== '0' || shadowSpread !== '0')
    ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
    : undefined

  const widgetAvatarStyle = (chatbot as any).widgetAvatarStyle || 'circle'
  let borderRadius: string

  if (widgetAvatarStyle === 'circle') {
    borderRadius = '50%'
  } else if (widgetAvatarStyle === 'rounded-diagonal') {
    borderRadius = '30px 0px 30px 0px'
  } else {
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
    borderRadius,
    border: widgetAvatarStyle === 'custom' ? 'none' : `${(chatbot as any).widgetBorderWidth || '0px'} solid ${(chatbot as any).widgetBorderColor || 'transparent'}`,
    boxShadow: widgetAvatarStyle === 'custom' ? 'none' : boxShadow,
    zIndex: ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) >= Z_INDEX.chatWidget
      ? ((chatbot as any).widgetZIndex || Z_INDEX.chatWidget) + 1
      : Z_INDEX.chatWidgetWindow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden'
  }

  if (blurAmount > 0 && widgetAvatarStyle !== 'custom') {
    baseStyle.backdropFilter = `blur(${blurAmount}px)`
    baseStyle.WebkitBackdropFilter = `blur(${blurAmount}px)`
  }

  if (widgetAvatarStyle === 'custom') {
    baseStyle.backgroundColor = 'transparent'
    baseStyle.backgroundImage = 'none'
    return baseStyle
  }

  if (widgetBgValue && (widgetBgValue.startsWith('url(') || widgetBgValue.startsWith('http://') || widgetBgValue.startsWith('https://') || widgetBgValue.startsWith('/'))) {
    const imageUrl = widgetBgValue.startsWith('url(') ? widgetBgValue : `url(${widgetBgValue})`
    baseStyle.backgroundImage = imageUrl
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'

    if (opacity < 100) {
      baseStyle.backgroundColor = `rgba(255, 255, 255, ${opacity / 100})`
    }
  } else if (widgetBgValue && widgetBgValue.toLowerCase().includes('gradient')) {
    baseStyle.backgroundImage = widgetBgValue
    baseStyle.backgroundSize = 'cover'
    baseStyle.backgroundPosition = 'center'
    baseStyle.backgroundRepeat = 'no-repeat'
  } else if (opacity < 100) {
    if (widgetBgValue && (widgetBgValue.startsWith('rgba') || widgetBgValue.startsWith('rgb'))) {
      const rgbMatch = widgetBgValue.match(/(\d+),\s*(\d+),\s*(\d+)/)
      baseStyle.backgroundColor = rgbMatch
        ? `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity / 100})`
        : widgetBgValue || '#1e40af'
    } else {
      baseStyle.backgroundColor = widgetBgValue ? `rgba(${hexToRgb(widgetBgValue)}, ${opacity / 100})` : '#1e40af'
    }
  } else {
    baseStyle.backgroundColor = widgetBgValue || '#1e40af'
  }

  return baseStyle
}
