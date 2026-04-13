import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getLangfuseClient, isLangfuseEnabled } from '@/lib/langfuse'
import { getCachedResponse, setCachedResponse, getCacheConfig } from '@/lib/response-cache'
import { retryWithBackoff } from '@/lib/retry-handler'
import { calculateCost, recordCost } from '@/lib/cost-tracker'
import { getRetryConfigFromDB } from '../utils/agent-helpers'

interface AssistantHandlerOptions {
  agentId: string
  apiKey: string
  message: string
  attachments?: any[]
  conversationHistory?: any[]
  model?: string
  instructions?: string
  reasoningEffort?: string
  store?: boolean
  vectorStoreId?: string
  enableWebSearch?: boolean
  enableCodeInterpreter?: boolean
  enableComputerUse?: boolean
  enableImageGeneration?: boolean
  requestStream?: boolean
  existingThreadId?: string
  chatbotId?: string
  spaceId?: string
  session?: any
  threadMessages?: any[]
  maxPromptTokens?: number
  maxCompletionTokens?: number
  truncationStrategy?: {
    type: 'auto' | 'last_messages'
    last_messages?: number
  }
}

export async function handleAssistantRequest(options: AssistantHandlerOptions) {
  const {
    agentId,
    apiKey,
    message,
    attachments = [],
    conversationHistory = [],
    model,
    instructions,
    reasoningEffort,
    store,
    requestStream,
    existingThreadId,
    chatbotId,
    spaceId,
    session,
    threadMessages,
    maxPromptTokens,
    maxCompletionTokens,
    truncationStrategy,
  } = options

  const startTime = Date.now()

  // Initialize Langfuse tracing
  const langfuse = (await isLangfuseEnabled()) ? await getLangfuseClient() : null
  const trace = langfuse?.trace({
    name: 'openai-assistant-chat',
    userId: session?.user?.id || undefined,
    metadata: {
      chatbotId,
      spaceId: spaceId || undefined,
      agentId,
      model: model || 'default',
      agentType: 'assistant',
      threadId: existingThreadId || undefined,
    },
  })
  
  const traceId = trace?.id || undefined

  const requestBody: any = {
    assistant_id: agentId,
    stream: true,
    model: model || undefined,
    instructions: instructions || undefined,
    reasoning_effort: (reasoningEffort as any) || undefined,
    store: store !== undefined ? store : undefined,
    metadata: {
      chatbotId,
      spaceId: spaceId || undefined,
      traceId: traceId || startTime.toString(),
    },
    max_prompt_tokens: maxPromptTokens || undefined,
    max_completion_tokens: maxCompletionTokens || undefined,
    truncation_strategy: truncationStrategy || undefined,
  }

  // Thread management
  let threadId: string | null = null
  
  if (existingThreadId && chatbotId && session?.user?.id) {
    const dbThread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId: existingThreadId,
        chatbotId,
        userId: session.user.id,
        deletedAt: null,
      },
    })
    if (dbThread) {
      threadId = existingThreadId
    }
  }

  // Create or update thread
  if (!threadId) {
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        messages: threadMessages
      }),
    })

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: threadResponse.status })
      } catch {
        return NextResponse.json(
          { error: errorText || 'Failed to create thread' },
          { status: threadResponse.status }
        )
      }
    }

    const threadData = await threadResponse.json()
    threadId = threadData.id

    if (threadId && chatbotId && session?.user?.id) {
      try {
        const firstUserMessage = threadMessages?.find((m: any) => m.role === 'user')
        const title = firstUserMessage?.content?.substring(0, 50) || 'New Conversation'
        
        await prisma.openAIAgentThread.create({
          data: {
            threadId,
            chatbotId,
            userId: session.user.id,
            spaceId: spaceId || null,
            title,
            metadata: {
              agentId,
              model,
              assistantId: agentId,
            },
            messageCount: threadMessages?.length || 0,
            lastMessageAt: new Date(),
          },
        })
      } catch (dbError) {
        console.warn('Failed to save thread to database:', dbError)
      }
    }
  } else {
    const addMessageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: message || ''
      }),
    })

    if (!addMessageResponse.ok) {
      if (addMessageResponse.status === 404) {
        return NextResponse.json({ error: 'thread_expired', details: 'The conversation thread has expired or was not found.' }, { status: 404 })
      }
      const errorText = await addMessageResponse.text()
      try {
        const errorData = JSON.parse(errorText)
        return NextResponse.json(errorData, { status: addMessageResponse.status })
      } catch {
        return NextResponse.json(
          { error: errorText || 'Failed to add message to thread' },
          { status: addMessageResponse.status }
        )
      }
    }

    if (chatbotId && session?.user?.id) {
      try {
        await prisma.openAIAgentThread.updateMany({
          where: {
            threadId: threadId ?? undefined,
            chatbotId,
            userId: session.user.id,
          },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        })
      } catch (dbError) {
        console.warn('Failed to update thread in database:', dbError)
      }
    }
  }

  // Create Langfuse generation span
  const generation = trace?.generation({
    name: 'assistant-run',
    model: model || 'gpt-4',
    modelParameters: {
      assistant_id: agentId,
      instructions: instructions || null,
    },
    input: message || '',
    metadata: {
      threadId,
      hasAttachments: attachments && attachments.length > 0,
      attachmentCount: attachments?.length || 0,
    },
  })

  const retryConfig = chatbotId ? await getRetryConfigFromDB(chatbotId) : null

  // Create run on thread
  const runResponse = await (retryConfig && retryConfig.enabled
    ? retryWithBackoff(
        () => fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify(requestBody),
        }),
        { ...retryConfig, chatbotId },
        (error: any) => {
          return error?.status >= 500 || error?.response?.status >= 500
        }
      )
    : fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify(requestBody),
      }))

  if (!runResponse.ok) {
    if (runResponse.status === 404) {
      return NextResponse.json({ error: 'thread_expired', details: 'The conversation thread has expired or was not found.' }, { status: 404 })
    }
    const errorText = await runResponse.text()
    const latency = Date.now() - startTime
    
    generation?.end({
      metadata: {
        statusCode: runResponse.status,
        latency,
        error: errorText,
      },
    })
    // Note: Error information is already captured in the generation span above

    try {
      const errorData = JSON.parse(errorText)
      return NextResponse.json(errorData, { status: runResponse.status })
    } catch {
      return NextResponse.json(
        { error: errorText || 'OpenAI Agent SDK API request failed' },
        { status: runResponse.status }
      )
    }
  }

  const contentType = runResponse.headers.get('content-type')
  const isStreaming = contentType?.includes('text/event-stream') || requestBody.stream

  if (isStreaming && runResponse.body) {
    if (threadId && chatbotId && session?.user?.id) {
      prisma.openAIAgentThread.updateMany({
        where: {
          threadId: threadId ?? undefined,
          chatbotId,
          userId: session.user.id,
        },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
      }).catch((err: any) => console.warn('Failed to update thread:', err))
    }

    const latency = Date.now() - startTime
    generation?.end({
      output: '[Streaming response]',
      metadata: {
        streaming: true,
        latency,
      },
    })

    return new NextResponse(runResponse.body, {
      status: runResponse.status,
      headers: {
        'Content-Type': contentType || 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...(threadId ? { 'X-Thread-Id': threadId } : {}),
        ...(traceId ? { 'X-Trace-Id': traceId } : {}),
      },
    })
  } else {
    const data = await runResponse.json()
    const latency = Date.now() - startTime
    
    const usage = data.usage || {}
    const outputText = data.choices?.[0]?.message?.content || data.content || ''
    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || 0
    
    if (chatbotId && model && (inputTokens > 0 || outputTokens > 0)) {
      try {
        const cost = calculateCost(model, inputTokens, outputTokens)
        await recordCost({
          chatbotId,
          userId: session?.user?.id,
          threadId: threadId || undefined,
          traceId: traceId || undefined,
          cost,
          inputTokens,
          outputTokens,
          totalTokens,
          model,
          metadata: {
            agentId,
            latency,
          },
        })
      } catch (costError) {
        console.warn('Failed to record cost:', costError)
      }
    }
    
    generation?.end({
      output: outputText,
      usage: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      metadata: {
        latency,
        runId: data.id,
        status: data.status,
      },
    })

    if (chatbotId) {
      const { recordMetric } = await import('@/lib/performance-metrics')
      await recordMetric({
        chatbotId,
        metricType: 'response_time',
        value: latency,
        metadata: { model, threadId },
      }).catch(() => {})
    }

    if (chatbotId && message && !requestStream) {
      const cacheConfig = await getCacheConfig(chatbotId)
      if (cacheConfig && cacheConfig.enabled) {
        const context = conversationHistory?.map((m: any) => m.content).join(' ') || ''
        await setCachedResponse(
          chatbotId,
          message,
          {
            content: outputText,
            threadId,
            traceId,
          },
          cacheConfig,
          cacheConfig.includeContext ? [context] : undefined
        ).catch((err: any) => console.warn('Failed to cache response:', err))
      }
    }

    if (threadId && chatbotId && session?.user?.id) {
      try {
        await prisma.openAIAgentThread.updateMany({
          where: {
            threadId: threadId ?? undefined,
            chatbotId,
            userId: session.user.id,
          },
          data: {
            messageCount: { increment: 1 },
            lastMessageAt: new Date(),
          },
        })
      } catch (dbError) {
        console.warn('Failed to update thread in database:', dbError)
      }
    }

    return NextResponse.json({
      ...data,
      threadId,
      traceId,
    }, { 
      status: runResponse.status,
      headers: {
        ...(traceId && { 'X-Trace-Id': traceId }),
      },
    })
  }
}

