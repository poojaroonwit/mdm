'use client'

import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, RotateCcw, Bot, User, BookOpen, Search } from 'lucide-react'
import * as Icons from 'lucide-react'
import toast from 'react-hot-toast'
import { Message, ChatbotConfig } from '../types'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

// Component to convert URLs in plain text to clickable links
function LinkifiedText({ content }: { content: string }) {
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g

  // Split content by URLs and convert URLs to anchor tags
  const parts = content.split(urlRegex)

  return (
    <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 underline hover:underline"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </p>
  )
}

interface MessageBubbleProps {
  message: Message
  chatbot: ChatbotConfig
  messages: Message[]
  messageFeedback: Record<string, 'liked' | 'disliked' | null>
  setMessageFeedback: React.Dispatch<React.SetStateAction<Record<string, 'liked' | 'disliked' | null>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  sendMessage: (content: string, attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>) => Promise<void>
  isLoading: boolean
  chatbotId?: string
  threadId?: string | null
}

export function MessageBubble({
  message,
  chatbot,
  messages,
  messageFeedback,
  setMessageFeedback,
  setMessages,
  sendMessage,
  isLoading,
  chatbotId,
  threadId,
}: MessageBubbleProps) {
  const showAvatar = chatbot.showMessageAvatar !== undefined ? chatbot.showMessageAvatar : true
  const showUserAvatar = chatbot.showUserAvatar !== undefined ? chatbot.showUserAvatar : showAvatar
  const showName = chatbot.showMessageName !== undefined ? chatbot.showMessageName : false
  const namePosition = (chatbot.messageNamePosition || 'top-of-message') as 'top-of-message' | 'top-of-avatar' | 'right-of-avatar'
  const avatarPosition = (chatbot as any).messageAvatarPosition || 'top-of-message'
  const displayName = chatbot.messageName || chatbot.headerTitle || chatbot.name || 'Assistant'

  const renderBotAvatar = () => {
    if (!showAvatar) return null
    const avatarType = chatbot.avatarType || 'icon'
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
      const chatKitAccent = (chatbot as any).chatkitOptions?.theme?.color?.accent?.primary
      // Ensure bgColor is never empty
      let bgColor = chatbot.avatarBackgroundColor || chatKitAccent || chatbot.primaryColor || '#1e40af'
      if (!bgColor || bgColor.trim() === '') {
        bgColor = '#1e40af'
      }
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

  const renderUserAvatar = () => {
    if (!showUserAvatar) return null
    const userAvatarType = (chatbot as any).userAvatarType || 'icon'
    if (userAvatarType === 'image' && (chatbot as any).userAvatarImageUrl) {
      return (
        <img
          src={(chatbot as any).userAvatarImageUrl}
          alt="User"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )
    } else {
      const UserIconName = (chatbot as any).userAvatarIcon || 'User'
      const UserIconComponent = (Icons as any)[UserIconName] || User
      const userIconColor = (chatbot as any).userAvatarIconColor || '#6b7280'
      const userBgColor = (chatbot as any).userAvatarBackgroundColor || '#e5e7eb'
      return (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: userBgColor }}
        >
          <UserIconComponent className="h-5 w-5" style={{ color: userIconColor }} />
        </div>
      )
    }
  }

  return (
    <div className={message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
      {/* Name and Avatar Row - Above message (when avatar position is top-of-message) */}
      {message.role === 'assistant' && avatarPosition === 'top-of-message' && (showName || showAvatar) && (
        <div className="flex items-center gap-2 mb-1 justify-start">
          {showName && namePosition === 'top-of-avatar' && (
            <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
              {displayName}
            </span>
          )}
          {renderBotAvatar()}
          {showName && namePosition === 'right-of-avatar' && (
            <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
              {displayName}
            </span>
          )}
        </div>
      )}
      {message.role === 'assistant' && avatarPosition === 'top-of-message' && showName && namePosition === 'right-of-avatar' && !showAvatar && (
        <div className="flex items-center gap-2 mb-1 justify-start">
          {renderBotAvatar()}
          <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
            {displayName}
          </span>
        </div>
      )}
      {message.role === 'assistant' && showName && namePosition === 'top-of-message' && (
        <div className="mb-1">
          <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
            {displayName}
          </span>
        </div>
      )}
      {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'top-of-avatar' && (
        <div className="mb-1">
          <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
            {displayName}
          </span>
        </div>
      )}
      {message.role === 'assistant' && avatarPosition === 'left-of-message' && showName && namePosition === 'right-of-avatar' && (
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: chatbot.fontColor || '#000000' }}>
            {displayName}
          </span>
        </div>
      )}
      {/* Message Bubble */}
      <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.role === 'assistant' && avatarPosition === 'left-of-message' && renderBotAvatar()}
        <div
          className={`max-w-[80%] rounded-lg ${message.role === 'user'
            ? 'rounded-br-none'
            : 'rounded-bl-none'
            }`}
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            // Apply conversation opener styling if this is the opener message
            ...(message.id === 'opener' ? {
              fontSize: (chatbot as any).conversationOpenerFontSize || chatbot.fontSize,
              color: (chatbot as any).conversationOpenerFontColor || chatbot.fontColor,
              fontFamily: (chatbot as any).conversationOpenerFontFamily || chatbot.fontFamily,
              fontWeight: (chatbot as any).conversationOpenerFontWeight || '400',
              lineHeight: (chatbot as any).conversationOpenerLineHeight || '1.5',
              textAlign: (chatbot as any).conversationOpenerAlignment || 'left',
              backgroundColor: (chatbot as any).conversationOpenerBackgroundColor || chatbot.botMessageBackgroundColor || '#f3f4f6' || '#ffffff',
              padding: (chatbot as any).conversationOpenerPadding || (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px',
              borderRadius: (chatbot as any).conversationOpenerBorderRadius || chatbot.bubbleBorderRadius || chatbot.borderRadius,
            } : {}),
            ...(message.role === 'user'
              ? {
                ...((chatbot as any).userBubblePaddingTop || (chatbot as any).userBubblePaddingRight || (chatbot as any).userBubblePaddingBottom || (chatbot as any).userBubblePaddingLeft
                  ? {
                    paddingTop: (chatbot as any).userBubblePaddingTop || (chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingRight: (chatbot as any).userBubblePaddingRight || (chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingBottom: (chatbot as any).userBubblePaddingBottom || (chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingLeft: (chatbot as any).userBubblePaddingLeft || (chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px',
                  }
                  : {
                    padding: (chatbot as any).userBubblePadding || (chatbot as any).bubblePadding || '12px'
                  }
                )
              }
              : {
                ...((chatbot as any).botBubblePaddingTop || (chatbot as any).botBubblePaddingRight || (chatbot as any).botBubblePaddingBottom || (chatbot as any).botBubblePaddingLeft
                  ? {
                    paddingTop: (chatbot as any).botBubblePaddingTop || (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingRight: (chatbot as any).botBubblePaddingRight || (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingBottom: (chatbot as any).botBubblePaddingBottom || (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px',
                    paddingLeft: (chatbot as any).botBubblePaddingLeft || (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px',
                  }
                  : {
                    padding: (chatbot as any).botBubblePadding || (chatbot as any).bubblePadding || '12px'
                  }
                )
              }),
            backgroundColor: message.role === 'user'
              ? (chatbot.userMessageBackgroundColor || chatbot.primaryColor || '#1e40af')
              : (chatbot.botMessageBackgroundColor || '#f3f4f6'),
            color: message.role === 'user'
              ? (chatbot.userMessageFontColor || 'white')
              : ((chatbot as any).botMessageFontColor || chatbot.fontColor || '#000000'),
            fontFamily: message.role === 'user'
              ? (chatbot.userMessageFontFamily || chatbot.fontFamily)
              : ((chatbot as any).botMessageFontFamily || chatbot.fontFamily),
            fontSize: message.role === 'user'
              ? (chatbot.userMessageFontSize || chatbot.fontSize)
              : ((chatbot as any).botMessageFontSize || chatbot.fontSize),
            borderColor: message.role === 'user'
              ? ((chatbot as any).userBubbleBorderColor || chatbot.bubbleBorderColor || chatbot.borderColor)
              : ((chatbot as any).botBubbleBorderColor || chatbot.bubbleBorderColor || chatbot.borderColor),
            borderWidth: message.role === 'user'
              ? ((chatbot as any).userBubbleBorderWidth || chatbot.bubbleBorderWidth || chatbot.borderWidth)
              : ((chatbot as any).botBubbleBorderWidth || chatbot.bubbleBorderWidth || chatbot.borderWidth),
            ...(message.role === 'user'
              ? ((chatbot as any).userBubbleBorderRadiusTopLeft || (chatbot as any).userBubbleBorderRadiusTopRight || (chatbot as any).userBubbleBorderRadiusBottomRight || (chatbot as any).userBubbleBorderRadiusBottomLeft
                ? {
                  borderTopLeftRadius: (chatbot as any).userBubbleBorderRadiusTopLeft || (chatbot as any).userBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderTopRightRadius: (chatbot as any).userBubbleBorderRadiusTopRight || (chatbot as any).userBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderBottomRightRadius: (chatbot as any).userBubbleBorderRadiusBottomRight || (chatbot as any).userBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderBottomLeftRadius: (chatbot as any).userBubbleBorderRadiusBottomLeft || (chatbot as any).userBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                }
                : {
                  borderRadius: (chatbot as any).userBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                })
              : ((chatbot as any).botBubbleBorderRadiusTopLeft || (chatbot as any).botBubbleBorderRadiusTopRight || (chatbot as any).botBubbleBorderRadiusBottomRight || (chatbot as any).botBubbleBorderRadiusBottomLeft
                ? {
                  borderTopLeftRadius: (chatbot as any).botBubbleBorderRadiusTopLeft || (chatbot as any).botBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderTopRightRadius: (chatbot as any).botBubbleBorderRadiusTopRight || (chatbot as any).botBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderBottomRightRadius: (chatbot as any).botBubbleBorderRadiusBottomRight || (chatbot as any).botBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                  borderBottomLeftRadius: (chatbot as any).botBubbleBorderRadiusBottomLeft || (chatbot as any).botBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                }
                : {
                  borderRadius: (chatbot as any).botBubbleBorderRadius || chatbot.bubbleBorderRadius || undefined,
                })),
          }}
        >
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  {attachment.type === 'image' ? (
                    <img
                      src={attachment.url}
                      alt={attachment.name || 'Image'}
                      className="max-w-full h-auto max-h-64 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <video
                      src={attachment.url}
                      controls
                      className="max-w-full h-auto max-h-64 rounded"
                      onError={(e) => {
                        (e.target as HTMLVideoElement).style.display = 'none'
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {attachment.name && (
                    <p className="text-xs text-muted-foreground mt-1">{attachment.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {message.content && (
            message.role === 'assistant' ? (
              <div className="text-sm break-words overflow-wrap-anywhere prose prose-sm max-w-none dark:prose-invert [&_p]:whitespace-pre-wrap [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a]:hover:underline">
                <MarkdownRenderer content={message.content} />
              </div>
            ) : (
              <LinkifiedText content={message.content} />
            )
          )}
          
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="sources" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 text-xs flex gap-2 font-semibold">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3" />
                      Sources ({message.citations.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2">
                    <div className="space-y-1.5 pl-5 border-l-2 ml-1" style={{ borderColor: chatbot.borderColor || 'rgba(0,0,0,0.1)' }}>
                      {message.citations.map((citation, idx) => (
                        <a
                          key={idx}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline block opacity-80 hover:opacity-100 transition-opacity truncate"
                        >
                          {citation}
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* Message Actions (Like, Dislike, Retry) - Only for assistant messages */}
          {message.role === 'assistant' && ((chatbot.showMessageFeedback) || (chatbot.showMessageRetry)) && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: chatbot.borderColor }}>
              {chatbot.showMessageFeedback && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={async () => {
                      const currentFeedback = messageFeedback[message.id]
                      const newFeedback = currentFeedback === 'liked' ? null : 'liked'
                      setMessageFeedback(prev => ({ ...prev, [message.id]: newFeedback }))

                      if (newFeedback && chatbot.engineType === 'openai-agent-sdk' && chatbot.openaiAgentSdkAgentId && chatbot.openaiAgentSdkApiKey) {
                        try {
                          const response = await fetch('/chat-handler/openai-agent-sdk/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              agentId: chatbot.openaiAgentSdkAgentId,
                              apiKey: chatbot.openaiAgentSdkApiKey,
                              messageId: message.id,
                              feedback: 'liked',
                              messageContent: message.content,
                              conversationContext: messages.slice(0, messages.findIndex(m => m.id === message.id) + 1),
                              chatbotId: chatbotId || chatbot.id,
                              threadId: threadId || undefined,
                              traceId: message.traceId || undefined,
                            })
                          })

                          if (response.ok) {
                            const result = await response.json()
                            toast.success(result.message || 'Feedback sent to workflow')
                          } else {
                            const error = await response.json()
                            toast.success('Feedback recorded locally')
                            console.warn('Feedback API error:', error)
                          }
                        } catch (error) {
                          toast.success('Feedback recorded locally')
                          console.error('Error sending feedback:', error)
                        }
                      } else if (newFeedback) {
                        toast.success('Feedback recorded: Liked')
                      }
                    }}
                  >
                    <ThumbsUp
                      className={`h-4 w-4 ${messageFeedback[message.id] === 'liked' ? 'text-blue-600 fill-blue-600' : 'text-muted-foreground'}`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={async () => {
                      const currentFeedback = messageFeedback[message.id]
                      const newFeedback = currentFeedback === 'disliked' ? null : 'disliked'
                      setMessageFeedback(prev => ({ ...prev, [message.id]: newFeedback }))

                      if (newFeedback && chatbot.engineType === 'openai-agent-sdk' && chatbot.openaiAgentSdkAgentId && chatbot.openaiAgentSdkApiKey) {
                        try {
                          const response = await fetch('/chat-handler/openai-agent-sdk/feedback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              agentId: chatbot.openaiAgentSdkAgentId,
                              apiKey: chatbot.openaiAgentSdkApiKey,
                              messageId: message.id,
                              feedback: 'disliked',
                              messageContent: message.content,
                              conversationContext: messages.slice(0, messages.findIndex(m => m.id === message.id) + 1),
                              chatbotId: chatbotId || chatbot.id,
                              threadId: threadId || undefined,
                              traceId: message.traceId || undefined,
                            })
                          })

                          if (response.ok) {
                            const result = await response.json()
                            toast.success(result.message || 'Feedback sent to workflow')
                          } else {
                            const error = await response.json()
                            toast.success('Feedback recorded locally')
                            console.warn('Feedback API error:', error)
                          }
                        } catch (error) {
                          toast.success('Feedback recorded locally')
                          console.error('Error sending feedback:', error)
                        }
                      } else if (newFeedback) {
                        toast.success('Feedback recorded: Disliked')
                      }
                    }}
                  >
                    <ThumbsDown
                      className={`h-4 w-4 ${messageFeedback[message.id] === 'disliked' ? 'text-red-600 fill-red-600' : 'text-muted-foreground'}`}
                    />
                  </Button>
                </>
              )}
              {chatbot.showMessageRetry && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={async () => {
                    const messageIndex = messages.findIndex(m => m.id === message.id)
                    if (messageIndex > 0) {
                      const previousUserMessage = messages[messageIndex - 1]
                      if (previousUserMessage.role === 'user') {
                        const messagesBefore = messages.slice(0, messageIndex)
                        setMessages(messagesBefore)
                        await sendMessage(previousUserMessage.content, previousUserMessage.attachments)
                      }
                    } else {
                      toast.error('Cannot retry: No previous user message found')
                    }
                  }}
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          )}

          <div className="text-[10px] opacity-50 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
        {message.role === 'user' && renderUserAvatar()}
      </div>
    </div>
  )
}

