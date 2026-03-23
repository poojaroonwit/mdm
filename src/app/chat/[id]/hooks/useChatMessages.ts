import { useState, useRef, useEffect } from 'react'
import { Message, ChatbotConfig } from '../types'
import { sendMessageToEngine } from '../utils/messageSender'
import toast from 'react-hot-toast'

interface UseChatMessagesOptions {
  chatbot: ChatbotConfig | null
  currentChatId: string | null
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  isInIframe: boolean
  threadId?: string | null // OpenAI Agent SDK thread ID
  chatbotId?: string // Chatbot ID for thread management
  spaceId?: string | null // Space ID for thread management
  onThreadIdChange?: (threadId: string | null) => void // Callback when thread ID changes
}

export function useChatMessages({
  chatbot,
  currentChatId,
  previewDeploymentType,
  isInIframe,
  threadId,
  chatbotId,
  spaceId,
  onThreadIdChange,
}: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when threadId changes (for OpenAI Agent SDK)
  useEffect(() => {
    if (!threadId || !chatbotId || !chatbot || chatbot.engineType !== 'openai-agent-sdk' || !chatbot.openaiAgentSdkApiKey) {
      // Clear messages if threadId is cleared
      if (!threadId) {
        setMessages([])
      }
      return
    }

    let cancelled = false

    const loadThreadMessages = async () => {
      try {
        setIsLoading(true)
        // Fetch messages from OpenAI API via proxy
        // Using /next-api/ prefix to bypass Nginx /api collision
        const response = await fetch(`/chat-handler/openai-agent-sdk/threads/${threadId}/messages`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          // Convert OpenAI thread messages to our Message format
          const loadedMessages: Message[] = (data.messages || []).map((msg: any) => {
            // Extract text content from message content array
            let content = ''
            if (Array.isArray(msg.content)) {
              content = msg.content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text?.value || '')
                .join('\n')
            } else if (typeof msg.content === 'string') {
              content = msg.content
            }

            return {
              id: msg.id || Date.now().toString(),
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: content,
              timestamp: new Date((msg.created_at || Date.now()) * 1000),
              traceId: msg.traceId,
            }
          })
          if (!cancelled) {
            setMessages(loadedMessages)
          }
        } else {
          console.error('Failed to load thread messages')
          if (!cancelled) {
            setMessages([])
          }
        }
      } catch (error) {
        console.error('Error loading thread messages:', error)
        if (!cancelled) {
          setMessages([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadThreadMessages()

    return () => {
      cancelled = true
    }
  }, [threadId, chatbotId, chatbot?.engineType, chatbot?.openaiAgentSdkApiKey, setMessages])

  const resetChat = () => {
    setMessages([])
    setIsSessionExpired(false)
    if (onThreadIdChange) {
      onThreadIdChange(null)
    }
  }

  const sendMessage = async (
    content: string,
    messageAttachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>
  ) => {
    if ((!content.trim() && (!messageAttachments || messageAttachments.length === 0)) || !chatbot) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim() || '',
      timestamp: new Date(),
      attachments: messageAttachments || undefined,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      let streamingContent = ''
      const streamingMessageId = (Date.now() + 1).toString()

      const result = await sendMessageToEngine({
        chatbot,
        content: content.trim() || '',
        attachments: messageAttachments,
        conversationHistory: messages,
        threadId: threadId || undefined,
        chatbotId: chatbotId || chatbot?.id,
        spaceId: spaceId || undefined,
        onStreamingUpdate: (content) => {
          streamingContent = content
          const streamingMessage: Message = {
            id: streamingMessageId,
            role: 'assistant',
            content: streamingContent,
            timestamp: new Date(),
          }
          setMessages([...updatedMessages, streamingMessage])
        },
      })

      // Update thread ID if returned from API
      if (result.threadId && onThreadIdChange && result.threadId !== threadId) {
        onThreadIdChange(result.threadId)
      }

      const assistantMessage: Message = {
        ...result.message,
        id: streamingMessageId,
        traceId: result.traceId, // Include traceId for feedback integration
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
    } catch (error) {
      console.error('Error sending message:', error)
      
      const isExpired = error instanceof Error && (error.message === 'thread_expired' || error.message === 'session_expired')
      
      if (isExpired) {
        if (chatbot.autoResetOnTimeout) {
          toast.success('Session expired. Starting new chat...')
          resetChat()
          return
        }
        setIsSessionExpired(true)
      }

      // Extract error message details
      let errorDetails = isExpired 
        ? 'Your session has expired. Please start a new chat.' 
        : 'Sorry, I encountered an error. Please try again later.'
      let toastMessage = isExpired ? 'Session expired' : 'Failed to send message'
      
      if (error instanceof Error) {
        errorDetails = error.message || errorDetails
        // Extract more specific error information
        if (error.message.includes('OpenAI Agent SDK')) {
          toastMessage = error.message.replace('OpenAI Agent SDK API request failed: ', '')
        } else if (error.message.includes('API request failed')) {
          toastMessage = error.message
        } else {
          toastMessage = error.message.length > 100 ? error.message.substring(0, 100) + '...' : error.message
        }
      } else if (typeof error === 'string') {
        errorDetails = error
        toastMessage = error.length > 100 ? error.substring(0, 100) + '...' : error
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorDetails,
        timestamp: new Date(),
      }
      const errorMessages = [...updatedMessages, errorMessage]
      setMessages(errorMessages)
      toast.error(toastMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowUpClick = (question: string) => {
    setSelectedFollowUp(question)
    sendMessage(question)
  }

  return {
    messages,
    setMessages,
    isLoading,
    isSessionExpired,
    selectedFollowUp,
    setSelectedFollowUp,
    sendMessage,
    resetChat,
    handleFollowUpClick,
    messagesEndRef,
    scrollAreaRef,
    scrollToBottom,
  }
}

