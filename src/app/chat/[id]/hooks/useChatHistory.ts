import { useState, useEffect, useRef, useCallback } from 'react'
import { Message, ChatbotConfig } from '../types'

export interface ChatHistoryItem {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

interface UseChatHistoryOptions {
  chatbotId: string
  chatbot: ChatbotConfig | null
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  isInIframe: boolean
  messages: Message[]
  setMessages: (messages: Message[]) => void
  currentChatId: string | null
  setCurrentChatId: (id: string | null) => void
}

// Returns or creates an anonymous session ID persisted in localStorage
function getSessionId(): string {
  try {
    const key = 'widget_session_id'
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}

function deserializeConversation(conv: any): ChatHistoryItem {
  return {
    id: conv.id,
    title: conv.title,
    messages: (conv.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
    createdAt: new Date(conv.createdAt),
  }
}

export function useChatHistory({
  chatbotId,
  chatbot,
  previewDeploymentType,
  isInIframe,
  messages,
  setMessages,
  currentChatId,
  setCurrentChatId,
}: UseChatHistoryOptions) {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const sessionId = useRef(getSessionId())
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFullPage = previewDeploymentType === 'fullpage' && !isInIframe

  const apiBase = `/api/public/chatbots/${chatbotId}/conversations`

  // Load conversations from DB on mount
  useEffect(() => {
    if (!isFullPage) return

    const load = async () => {
      try {
        const res = await fetch(`${apiBase}?sessionId=${sessionId.current}`)
        if (!res.ok) return
        const data = await res.json()
        const loaded: ChatHistoryItem[] = (data.conversations || []).map(deserializeConversation)
        setChatHistory(loaded)

        if (loaded.length > 0 && !currentChatId) {
          setCurrentChatId(loaded[0].id)
          setMessages(loaded[0].messages)
        }
      } catch (e) {
        console.error('Error loading chat history:', e)
      }
    }

    load()
  }, [chatbotId, isFullPage])

  // Auto-create first conversation when none exist
  useEffect(() => {
    if (!isFullPage || !chatbot || currentChatId || chatHistory.length > 0) return

    const create = async () => {
      const initialMessages: Message[] = []
      const greeting = chatbot.openaiAgentSdkGreeting || chatbot.conversationOpener
      if (greeting) {
        initialMessages.push({
          id: 'opener',
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        })
      }

      try {
        const res = await fetch(apiBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId.current, title: 'New Chat', messages: initialMessages }),
        })
        if (!res.ok) return
        const data = await res.json()
        const newConv = deserializeConversation({ ...data.conversation, messages: initialMessages })
        setChatHistory([newConv])
        setCurrentChatId(newConv.id)
        setMessages(initialMessages)
      } catch (e) {
        console.error('Error creating initial conversation:', e)
      }
    }

    create()
  }, [isFullPage, chatbot, currentChatId, chatHistory.length])

  // Debounced save of current conversation messages to DB
  const saveConversation = useCallback((convId: string, convMessages: Message[], title?: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`${apiBase}/${convId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId.current, messages: convMessages, ...(title && { title }) }),
        })
      } catch (e) {
        console.error('Error saving conversation:', e)
      }
    }, 1000)
  }, [apiBase])

  // Update title from first user message and save messages on change
  useEffect(() => {
    if (!currentChatId || !isFullPage || messages.length === 0) return

    const firstUserMessage = messages.find((m) => m.role === 'user')
    const title = firstUserMessage ? (firstUserMessage.content.substring(0, 50) || 'New Chat') : undefined

    setChatHistory((prev) =>
      prev.map((ch) => (ch.id === currentChatId ? { ...ch, messages, ...(title && { title }) } : ch))
    )

    saveConversation(currentChatId, messages, title)
  }, [messages, currentChatId, isFullPage])

  const handleNewChat = async () => {
    const initialMessages: Message[] = []
    const greeting = chatbot?.openaiAgentSdkGreeting || chatbot?.conversationOpener
    if (greeting) {
      initialMessages.push({
        id: 'opener',
        role: 'assistant',
        content: greeting,
        timestamp: new Date(),
      })
    }

    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, title: 'New Chat', messages: initialMessages }),
      })
      if (!res.ok) return
      const data = await res.json()
      const newConv = deserializeConversation({ ...data.conversation, messages: initialMessages })
      setChatHistory((prev) => [newConv, ...prev])
      setCurrentChatId(newConv.id)
      setMessages(initialMessages)
    } catch (e) {
      console.error('Error creating conversation:', e)
    }
  }

  const handleSelectChat = (chatId: string) => {
    const chat = chatHistory.find((ch) => ch.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
    }
  }

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch(`${apiBase}/${chatId}?sessionId=${sessionId.current}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Error deleting conversation:', e)
    }
    setChatHistory((prev) => prev.filter((ch) => ch.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  return {
    chatHistory,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
  }
}
