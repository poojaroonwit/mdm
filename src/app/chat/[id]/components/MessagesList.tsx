'use client'

import React, { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Message, ChatbotConfig } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

// Helper function to dynamically load icon components
const getIconComponent = async (iconName: string): Promise<React.ComponentType<{ className?: string }> | null> => {
  if (!iconName) return null

  try {
    const module = await import('lucide-react')


    // Try exact match first
    let IconComponent = module[iconName as keyof typeof module] as any
    if (IconComponent) return IconComponent as React.ComponentType<{ className?: string }>

    // Try Pascal Case
    const pascalCase = iconName.charAt(0).toUpperCase() + iconName.slice(1)
    IconComponent = module[pascalCase as keyof typeof module] as any
    if (IconComponent) return IconComponent as React.ComponentType<{ className?: string }>

    // Try common variations
    const variations: Record<string, string> = {
      'Bolt': 'Zap',
      'Sparkle': 'Sparkles',
      'CheckCircle': 'CheckCircle2',
    }
    const mappedName = variations[iconName] || iconName
    IconComponent = module[mappedName as keyof typeof module] as any
    if (IconComponent) return IconComponent as React.ComponentType<{ className?: string }>

    return null
  } catch {
    return null
  }
}

// Component for rendering a start screen prompt icon
const PromptIcon = ({ iconName, className }: { iconName?: string; className?: string }) => {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string }> | null>(null)

  useEffect(() => {
    if (iconName) {
      getIconComponent(iconName).then(setIconComponent)
    }
  }, [iconName])

  if (!IconComponent) return null
  return <IconComponent className={className} />
}

interface MessagesListProps {
  messages: Message[]
  chatbot: ChatbotConfig
  isLoading: boolean
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => Promise<void>
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  chatbotId?: string
  threadId?: string | null
  isSessionExpired?: boolean
  resetChat?: () => void
}

export function MessagesList({
  messages,
  chatbot,
  isLoading,
  messageFeedback,
  setMessageFeedback,
  setMessages,
  sendMessage,
  scrollAreaRef,
  messagesEndRef,
  chatbotId,
  threadId,
  isSessionExpired,
  resetChat,
}: MessagesListProps) {
  return (
    <ScrollArea className="flex-1 px-6 py-5 pb-28" ref={scrollAreaRef as any}>
      <div className="space-y-5 max-w-4xl mx-auto">
        {messages.length === 0 && !isLoading && (chatbot as any).showStartConversation !== false && (() => {
          const openerText = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener || 'Start a conversation'
          const position = (chatbot as any).conversationOpenerPosition || 'center'
          const alignment = (chatbot as any).conversationOpenerAlignment || 'center'
          const fontSize = (chatbot as any).conversationOpenerFontSize || '16px'
          const fontColor = (chatbot as any).conversationOpenerFontColor || '#6b7280'
          const fontFamily = (chatbot as any).conversationOpenerFontFamily || chatbot.fontFamily || 'Inter'
          const fontWeight = (chatbot as any).conversationOpenerFontWeight || '400'
          const lineHeight = (chatbot as any).conversationOpenerLineHeight || '1.5'
          const backgroundColor = (chatbot as any).conversationOpenerBackgroundColor
          const padding = (chatbot as any).conversationOpenerPadding || '16px'
          const borderRadius = (chatbot as any).conversationOpenerBorderRadius || '8px'

          // Position classes
          const positionClasses = {
            center: 'items-center justify-center',
            left: 'items-start justify-start',
            right: 'items-end justify-end',
            top: 'items-start justify-center',
            bottom: 'items-end justify-center',
          }

          const containerClass = `flex flex-col py-12 ${positionClasses[position as keyof typeof positionClasses] || positionClasses.center}`

          const openerStyle: React.CSSProperties = {
            fontSize,
            color: fontColor,
            fontFamily,
            fontWeight,
            lineHeight,
            textAlign: alignment as any,
            backgroundColor: backgroundColor || 'transparent',
            padding: backgroundColor ? padding : undefined,
            borderRadius: backgroundColor ? borderRadius : undefined,
            maxWidth: '80%',
            margin: '0 auto',
          }

          // Get start screen prompts (for Agent SDK and other engines)
          const startScreenPrompts = (chatbot as any).startScreenPrompts || []
          const promptsPosition = (chatbot as any).startScreenPromptsPosition || 'center'
          const iconDisplay = (chatbot as any).startScreenPromptsIconDisplay || 'suffix'
          const promptsBgColor = (chatbot as any).startScreenPromptsBackgroundColor || chatbot.botMessageBackgroundColor || '#f3f4f6'
          const promptsFontColor = (chatbot as any).startScreenPromptsFontColor || (chatbot as any).botMessageFontColor || chatbot.fontColor || '#000000'
          const promptsBorderColor = (chatbot as any).startScreenPromptsBorderColor || chatbot.bubbleBorderColor || chatbot.borderColor || '#e5e7eb'
          const promptsBorderWidth = (chatbot as any).startScreenPromptsBorderWidth || '1px'
          const promptsBorderRadius = (chatbot as any).startScreenPromptsBorderRadius || '8px'

          // Determine container class based on position
          const getPromptsContainerClass = () => {
            switch (promptsPosition) {
              case 'bottom':
                return 'flex flex-wrap gap-2 justify-center mt-auto pt-4'
              case 'list':
                return 'flex flex-col gap-2 mt-4 w-full max-w-md mx-auto'
              case 'center':
              default:
                return 'flex flex-wrap gap-2 justify-center mt-4'
            }
          }

          return (
            <div className={containerClass}>
              <p className="mb-2" style={openerStyle}>
                {openerText}
              </p>

              {/* Start Screen Prompts */}
              {startScreenPrompts.length > 0 && (
                <div className={getPromptsContainerClass()}>
                  {startScreenPrompts.map((prompt: { label?: string; prompt: string; icon?: string }, index: number) => {
                    const showIcon = iconDisplay !== 'none' && prompt.icon
                    const showIconAsSuffix = iconDisplay === 'suffix' && showIcon
                    const showIconOnly = iconDisplay === 'show-all' && showIcon

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (prompt.prompt) {
                            sendMessage(prompt.prompt)
                          }
                        }}
                        className={`px-4 py-2 transition-colors hover:opacity-80 flex items-center gap-2 ${promptsPosition === 'list' ? 'w-full justify-start' : ''
                          }`}
                        style={{
                          backgroundColor: promptsBgColor,
                          color: promptsFontColor,
                          borderColor: promptsBorderColor,
                          borderWidth: promptsBorderWidth,
                          borderRadius: promptsBorderRadius,
                          borderStyle: 'solid',
                          fontFamily: chatbot.fontFamily || 'Inter',
                          fontSize: chatbot.fontSize || '14px',
                        }}
                      >
                        {showIconOnly && prompt.icon && <PromptIcon iconName={prompt.icon} className="h-4 w-4" />}
                        <span>{prompt.label || prompt.prompt}</span>
                        {showIconAsSuffix && prompt.icon && <PromptIcon iconName={prompt.icon} className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {chatbot.followUpQuestions && chatbot.followUpQuestions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-4" style={{ color: chatbot.fontColor }}>
                  Try asking one of the suggested questions below
                </p>
              )}
            </div>
          )
        })()}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            chatbot={chatbot}
            messages={messages}
            messageFeedback={messageFeedback}
            setMessageFeedback={setMessageFeedback}
            setMessages={setMessages}
            sendMessage={sendMessage}
            isLoading={isLoading}
            chatbotId={chatbotId}
            threadId={threadId}
          />
        ))}
        {isLoading && <TypingIndicator chatbot={chatbot} />}
        
        {isSessionExpired && (
          <div className="flex flex-col items-center justify-center p-6 border rounded-md animate-in fade-in slide-in-from-bottom-4 duration-500"
               style={{ 
                 borderColor: chatbot.borderColor, 
                 backgroundColor: chatbot.botMessageBackgroundColor + '20', // Add some transparency
                 borderStyle: 'dashed'
               }}>
            <p className="text-sm font-medium mb-4" style={{ color: chatbot.fontColor }}>
              Your session has expired or was not found.
            </p>
            <button
              onClick={resetChat}
              className="px-6 py-2 rounded-lg text-white font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: chatbot.primaryColor }}
            >
              Start New Chat
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}

