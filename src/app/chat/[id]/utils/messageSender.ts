import { Message, ChatbotConfig } from '../types'

export interface SendMessageOptions {
  chatbot: ChatbotConfig
  content: string
  attachments?: Array<{ type: 'image' | 'video', url: string, name?: string }>
  conversationHistory: Message[]
  onStreamingUpdate?: (content: string) => void
  threadId?: string | null // Optional: existing thread ID to reuse
  chatbotId?: string // Required for thread management
  spaceId?: string | null // Optional: for space-scoped threads
}

export interface SendMessageResult {
  message: Message
  conversationId?: string
  threadId?: string // OpenAI Agent SDK thread ID
  traceId?: string // Langfuse trace ID for observability
}

export async function sendMessageToEngine(options: SendMessageOptions): Promise<SendMessageResult> {
  const { chatbot, content, attachments, conversationHistory, onStreamingUpdate, threadId, chatbotId, spaceId } = options

  // Handle OpenAI Agent SDK
  if (chatbot.engineType === 'openai-agent-sdk' && chatbot.openaiAgentSdkAgentId) {
    return await sendToOpenAIAgentSDK(chatbot, content, attachments, conversationHistory, onStreamingUpdate, threadId, chatbotId, spaceId)
  }

  // Handle Dify
  if (chatbot.engineType === 'dify') {
    return await sendToDify(chatbot, content, attachments, conversationHistory, onStreamingUpdate)
  }

  // Handle custom/other engines
  return await sendToCustomAPI(chatbot, content, attachments, conversationHistory)
}

async function sendToOpenAIAgentSDK(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[],
  onStreamingUpdate?: (content: string) => void,
  threadId?: string | null,
  chatbotId?: string,
  spaceId?: string | null
): Promise<SendMessageResult> {
  // Validate required fields
  if (!chatbot.openaiAgentSdkAgentId) {
    throw new Error('Agent ID is required for OpenAI Agent SDK')
  }

  const proxyUrl = '/chat-handler/openai-agent-sdk/chat-messages'

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: chatbot.openaiAgentSdkAgentId,
      // API Key is looked up server-side using chatbotId
      model: chatbot.openaiAgentSdkModel,
      instructions: chatbot.openaiAgentSdkInstructions,
      reasoningEffort: chatbot.openaiAgentSdkReasoningEffort,
      store: chatbot.openaiAgentSdkStore,
      vectorStoreId: chatbot.openaiAgentSdkVectorStoreId,
      enableWebSearch: chatbot.openaiAgentSdkEnableWebSearch,
      enableCodeInterpreter: chatbot.openaiAgentSdkEnableCodeInterpreter,
      enableComputerUse: chatbot.openaiAgentSdkEnableComputerUse,
      enableImageGeneration: chatbot.openaiAgentSdkEnableImageGeneration,
      useWorkflowConfig: chatbot.openaiAgentSdkUseWorkflowConfig,
      message: content.trim() || '',
      attachments: attachments || [],
      conversationHistory: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments
      })),
      stream: !!onStreamingUpdate, // Enable streaming if callback is provided
      threadId: threadId || undefined,
      chatbotId: chatbotId || chatbot.id,
      spaceId: spaceId || undefined
    })
  })

  if (!response.ok) {
    let errorText = 'Unknown error'
    try {
      const errorData = await response.json().catch(() => null)
      if (errorData) {
        // Try to extract meaningful error message from response
        errorText = errorData.error || errorData.message || errorData.details || JSON.stringify(errorData)
      } else {
        errorText = await response.text().catch(() => 'Unknown error')
      }
    } catch {
      errorText = await response.text().catch(() => 'Unknown error')
    }

    // Create a more descriptive error message
    let errorMessage = `OpenAI Agent SDK API request failed`
    if (errorText === 'thread_expired' || errorText === 'session_expired') {
      errorMessage = errorText
    } else if (response.status === 400) {
      errorMessage = `Invalid request: ${errorText}`
    } else if (response.status === 401) {
      errorMessage = `Authentication failed: Please check your API key`
    } else if (response.status === 403) {
      errorMessage = `Access forbidden: ${errorText}`
    } else if (response.status === 404) {
      errorMessage = `Agent not found: ${errorText}`
    } else if (response.status === 429) {
      errorMessage = `Rate limit exceeded: Please try again later`
    } else if (response.status >= 500) {
      errorMessage = `Server error: ${errorText}`
    } else {
      errorMessage = `${errorMessage} (${response.status}): ${errorText}`
    }

    throw new Error(errorMessage)
  }

  // Extract thread ID and trace ID from response headers if available
  const responseThreadId = response.headers.get('X-Thread-Id') || threadId
  const responseTraceId = response.headers.get('X-Trace-Id') || undefined

  const contentType = response.headers.get('content-type')
  const isStreaming = contentType?.includes('text/event-stream') || contentType?.includes('text/plain')

  if (isStreaming && response.body && onStreamingUpdate) {
    const result = await handleStreamingResponse(response, onStreamingUpdate, chatbot)
    return {
      ...result,
      threadId: responseThreadId || undefined,
      traceId: result.traceId || responseTraceId
    }
  } else {
    const data = await response.json()
    return {
      message: {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || data.message || data.text || data.response || 'No response received',
        timestamp: new Date(),
        citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined,
        traceId: data.traceId || responseTraceId
      },
      threadId: data.threadId || responseThreadId || undefined,
      traceId: data.traceId || responseTraceId
    }
  }
}

async function sendToDify(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[],
  onStreamingUpdate?: (content: string) => void
): Promise<SendMessageResult> {
  const difyOptions = chatbot.difyOptions || {}

  const files = (attachments || []).map(att => ({
    type: att.type === 'image' ? 'image' : att.type === 'video' ? 'video' : 'document',
    transfer_method: 'remote_url' as const,
    url: att.url
  }))

  const requestBody: any = {
    inputs: difyOptions.inputs || {},
    query: content.trim() || '',
    response_mode: difyOptions.responseMode || 'streaming',
    conversation_id: difyOptions.conversationId || '',
    user: difyOptions.user || 'user-' + Date.now(),
  }

  if (files.length > 0) {
    requestBody.files = files
  }

  const proxyUrl = '/api/dify/chat-messages'
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatbotId: chatbot.id,
      requestBody
      // API Key and Base URL are looked up server-side
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Dify API request failed: ${response.status} ${errorText}`)
  }

  if (difyOptions.responseMode === 'streaming' && response.body && onStreamingUpdate) {
    return await handleDifyStreamingResponse(response, onStreamingUpdate, chatbot)
  } else {
    const data = await response.json()
    return {
      message: {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.message || 'No response received',
        timestamp: new Date(),
        citations: chatbot.showCitations ? (data.metadata?.retriever_resources || []) : undefined
      }
    }
  }
}

async function sendToCustomAPI(
  chatbot: ChatbotConfig,
  content: string,
  attachments: Array<{ type: 'image' | 'video', url: string, name?: string }> | undefined,
  conversationHistory: Message[]
): Promise<SendMessageResult> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' }

  if (chatbot.apiAuthType !== 'none' && chatbot.apiAuthValue) {
    if (chatbot.apiAuthType === 'bearer') {
      headers['Authorization'] = `Bearer ${chatbot.apiAuthValue}`
    } else if (chatbot.apiAuthType === 'api_key') {
      headers['X-API-Key'] = chatbot.apiAuthValue
    } else if (chatbot.apiAuthType === 'custom') {
      headers['X-Custom-Auth'] = chatbot.apiAuthValue
    }
  }

  const response = await fetch(chatbot.apiEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: content.trim() || '',
      attachments: attachments || [],
      conversation_history: conversationHistory.map(m => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments
      }))
    })
  })

  if (!response.ok) {
    throw new Error('API request failed')
  }

  const data = await response.json()
  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: data.response || data.message || data.text || 'No response received',
      timestamp: new Date(),
      citations: chatbot.showCitations ? (data.citations || data.sources || []) : undefined
    }
  }
}

async function handleStreamingResponse(
  response: Response,
  onStreamingUpdate: (content: string) => void,
  chatbot: ChatbotConfig
): Promise<SendMessageResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  let currentEvent = ''
  let buffer = ''
  let citations: string[] | undefined = undefined

  // Check if this is OpenAI Agent SDK format (SSE with event types)
  const isOpenAIAgentSDK = chatbot.engineType === 'openai-agent-sdk'

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))

          if (isOpenAIAgentSDK) {
            // Handle OpenAI Agent SDK SSE format
            // Handle thread.message.delta events (content deltas)
            if (currentEvent === 'thread.message.delta' && data.delta) {
              // Extract text content from delta
              if (data.delta.content && Array.isArray(data.delta.content)) {
                for (const contentItem of data.delta.content) {
                  if (contentItem.type === 'text' && contentItem.text?.value) {
                    fullResponse += contentItem.text.value
                    onStreamingUpdate(fullResponse)
                  }
                }
              }
            }
            // Handle thread.message.completed (final message)
            else if (currentEvent === 'thread.message.completed' && data.content) {
              // Extract full content from completed message
              if (Array.isArray(data.content)) {
                for (const contentItem of data.content) {
                  if (contentItem.type === 'text' && contentItem.text?.value) {
                    fullResponse = contentItem.text.value
                    onStreamingUpdate(fullResponse)
                  }
                }
              }
              // Extract citations if available
              if (chatbot.showCitations && data.metadata) {
                citations = data.metadata.citations || data.metadata.sources || undefined
              }
            }
            // Handle done event
            else if (line.trim() === 'data: [DONE]' || data === '[DONE]') {
              // Stream is complete
              break
            }
            // Fallback: if no specific event but has content, use it
            else if (data.content !== undefined) {
              fullResponse += (typeof data.content === 'string' ? data.content : '')
              onStreamingUpdate(fullResponse)
            }
          } else {
            // Handle standard streaming format
            if (data.content !== undefined) {
              fullResponse += (typeof data.content === 'string' ? data.content : '')
              onStreamingUpdate(fullResponse)
            }
            // Extract citations if available in standard format
            if (chatbot.showCitations && data.citations) {
              citations = data.citations
            } else if (chatbot.showCitations && data.sources) {
              citations = data.sources
            }
          }
        } catch (e) {
          // Skip invalid JSON
          console.debug('Failed to parse SSE data:', line, e)
        }
      } else if (line.trim() === '' && currentEvent === 'done') {
        // Stream complete
        break
      } else if (line.trim() && !line.startsWith('data:') && !line.startsWith('event:')) {
        // Fallback for non-SSE format
        fullResponse += line
        onStreamingUpdate(fullResponse)
      }
    }
  }

  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse || 'No response received',
      timestamp: new Date(),
      citations: chatbot.showCitations ? citations : undefined,
      traceId: undefined // Trace ID will be extracted from response headers in sendToOpenAIAgentSDK
    },
    threadId: undefined, // Thread ID will be extracted from response headers in sendToOpenAIAgentSDK
    traceId: undefined // Trace ID will be extracted from response headers in sendToOpenAIAgentSDK
  }
}

async function handleDifyStreamingResponse(
  response: Response,
  onStreamingUpdate: (content: string) => void,
  chatbot: ChatbotConfig
): Promise<SendMessageResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ''
  let conversationId = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.event === 'message') {
            fullResponse += data.answer || ''
            onStreamingUpdate(fullResponse)
          } else if (data.event === 'message_end') {
            conversationId = data.conversation_id || conversationId
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  return {
    message: {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: fullResponse || 'No response received',
      timestamp: new Date()
    },
    conversationId
  }
}

