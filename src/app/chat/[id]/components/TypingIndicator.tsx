'use client'

import { Loader2, Bot } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ChatbotConfig } from '../types'

interface TypingIndicatorProps {
  chatbot: ChatbotConfig
}

export function TypingIndicator({ chatbot }: TypingIndicatorProps) {
  const avatarType = chatbot.avatarType || 'icon'
  const c = chatbot.typingIndicatorColor || '#6b7280'

  const renderAvatar = () => {
    if (avatarType === 'image' && chatbot.avatarImageUrl) {
      return (
        <img
          src={chatbot.avatarImageUrl}
          alt={chatbot.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )
    } else {
      const IconName = chatbot.avatarIcon || 'Bot'
      const IconComponent = (Icons as any)[IconName] || Bot
      const iconColor = chatbot.avatarIconColor || '#ffffff'
      const bgColor = chatbot.avatarBackgroundColor || chatbot.primaryColor || '#1e40af'
      return (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          <IconComponent className="h-5 w-5" style={{ color: iconColor }} />
        </div>
      )
    }
  }

  const renderIndicator = () => {
    switch (chatbot.typingIndicatorStyle || 'spinner') {
      case 'dots':
        return (
          <div className="flex gap-1 items-end" aria-label="Assistant is typing">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.15s' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-dot 1s infinite ease-in-out 0.3s' }} />
            <style jsx>{`
              @keyframes ai-dot { 0%, 80%, 100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-3px); opacity: 1 } }
            `}</style>
          </div>
        )
      case 'pulse':
        return (
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c, animation: 'ai-pulse 1.2s infinite ease-in-out' }} aria-label="Assistant is typing">
            <style jsx>{`
              @keyframes ai-pulse { 0% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.2); opacity: 1 } 100% { transform: scale(1); opacity: .6 } }
            `}</style>
          </div>
        )
      case 'bounce':
        return (
          <div className="flex gap-1 items-end" aria-label="Assistant is typing">
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0s' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.2s' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c, animation: 'ai-bounce 1s infinite', animationDelay: '0.4s' }} />
            <style jsx>{`
              @keyframes ai-bounce { 0%, 80%, 100% { transform: translateY(0) } 40% { transform: translateY(-5px) } }
            `}</style>
          </div>
        )
      case 'spinner':
      default:
        return <Loader2 className="h-4 w-4 animate-spin" style={{ color: c }} aria-label="Assistant is typing" />
    }
  }

  const showThinking = chatbot.showThinkingMessage !== undefined ? chatbot.showThinkingMessage : false
  const thinkingText = chatbot.thinkingMessageText || 'Thinking...'

  return (
    <div className="flex gap-3 justify-start items-center">
      {renderAvatar()}
      <div
        className="rounded-lg p-3 rounded-bl-none flex items-center gap-2"
        style={{
          backgroundColor: '#f3f4f6',
          borderColor: chatbot.bubbleBorderColor || chatbot.borderColor,
          borderWidth: chatbot.bubbleBorderWidth || chatbot.borderWidth,
          color: chatbot.typingIndicatorColor || '#6b7280'
        }}
      >
        {renderIndicator()}
        {showThinking && (
          <span className="text-sm" style={{ color: chatbot.typingIndicatorColor || '#6b7280' }}>
            {thinkingText}
          </span>
        )}
      </div>
    </div>
  )
}

