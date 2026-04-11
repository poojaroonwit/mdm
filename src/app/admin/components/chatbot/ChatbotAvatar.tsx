'use client'

import React, { useState, useEffect } from 'react'
import { Bot } from 'lucide-react'
import { Chatbot } from './types'

// Helper to dynamically load icon
const loadIcon = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || Bot
  } catch {
    return Bot
  }
}

interface ChatbotAvatarProps {
  chatbot: Chatbot
  size?: 'sm' | 'md' | 'lg'
}

export function ChatbotAvatar({ chatbot, size = 'md' }: ChatbotAvatarProps) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any>>(Bot)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const avatarType = (chatbot.avatarType || 'icon') as 'icon' | 'image'
  const IconName = (chatbot.avatarIcon || 'Bot') as string

  useEffect(() => {
    if (avatarType === 'icon') {
      loadIcon(IconName).then(setIconComponent)
    }
  }, [IconName, avatarType])

  if (avatarType === 'image' && chatbot.avatarImageUrl) {
    return (
      <img
        src={chatbot.avatarImageUrl}
        alt={chatbot.name || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  const iconColor = chatbot.avatarIconColor || '#ffffff'
  const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#1e40af'
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: bgColor as string }}
    >
      <IconComponent className={iconSizeClasses[size]} style={{ color: iconColor as string }} />
    </div>
  )
}

