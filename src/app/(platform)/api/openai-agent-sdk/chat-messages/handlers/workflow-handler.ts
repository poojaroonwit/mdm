import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface WorkflowHandlerOptions {
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
  useWorkflowConfig?: boolean
}

// Helper function to merge version config into chatbot object
function mergeVersionConfig(chatbot: any): any {
  if (!chatbot) return chatbot
  
  // Get the latest version config (first in the array since it's ordered by createdAt desc)
  const latestVersion = chatbot.versions && chatbot.versions.length > 0 ? chatbot.versions[0] : null
  const versionConfig = latestVersion?.config || {}
  
  // Merge version config into chatbot object (version config takes precedence for config fields)
  return {
    ...chatbot,
    ...versionConfig,
    // Preserve essential chatbot fields
    id: chatbot.id,
    createdAt: chatbot.createdAt,
    updatedAt: chatbot.updatedAt,
    createdBy: chatbot.createdBy,
    spaceId: chatbot.spaceId,
    versions: chatbot.versions,
    creator: chatbot.creator,
    space: chatbot.space,
  }
}

export async function handleWorkflowRequest(options: WorkflowHandlerOptions) {
  const {
    agentId,
    apiKey,
    message,
    requestStream,
    chatbotId,
  } = options

  // Get workflow file from chatbot config if available
  let workflowFile = 'qsncc-workflow' // Default workflow
  if (chatbotId) {
    try {
      const chatbot = await db.chatbot.findFirst({
        where: {
          id: chatbotId,
          deletedAt: null,
        },
        include: {
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (chatbot) {
        const mergedChatbot = mergeVersionConfig(chatbot)
        const selectedWorkflowFile = mergedChatbot?.openaiAgentSdkWorkflowFile
        if (selectedWorkflowFile && typeof selectedWorkflowFile === 'string' && selectedWorkflowFile.trim().length > 0) {
          workflowFile = selectedWorkflowFile.trim()
        }
      }
    } catch (error) {
      console.error('AgentSDK: Error fetching chatbot config for workflow file:', error)
    }
  }

  // Execute workflow from repository
  console.log('AgentSDK: Using workflow from repository', {
    workflowId: agentId,
    workflowFile,
    hasInput: !!message,
    inputLength: message?.length || 0,
  })

  try {
    // Dynamically import the selected workflow
    // Note: Dynamic imports with template literals need to be handled carefully
    // We'll use a switch or mapping to ensure TypeScript can resolve the paths
    let runWorkflow: any
    try {
      // Try to import the workflow file dynamically
      const workflowModule = await import(`@/lib/workflows/${workflowFile}`)
      runWorkflow = workflowModule.runWorkflow || workflowModule.default
    } catch (importError) {
      // Fallback to default workflow if import fails
      console.warn(`Failed to import workflow ${workflowFile}, falling back to qsncc-workflow:`, importError)
      const defaultModule = await import('@/lib/workflows/qsncc-workflow')
      runWorkflow = defaultModule.runWorkflow || (defaultModule as any).default
    }
    
    if (!runWorkflow || typeof runWorkflow !== 'function') {
      throw new Error(`runWorkflow function not found in workflow file: ${workflowFile}`)
    }
    
    // Pass API key from config to workflow (not from environment)
    const result = await runWorkflow(
      { input_as_text: message || '' },
      agentId,
      apiKey // Pass API key from config
    )

    const output = result?.output_text || ''

    if (requestStream) {
      // For streaming, send the output as chunks
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          const chunks = output.split(' ')
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            await new Promise(resolve => setTimeout(resolve, 10))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      return NextResponse.json({
        message: output,
        cached: false,
      })
    }
  } catch (error) {
    console.error('AgentSDK: Error executing static workflow:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json(
      { 
        error: `Failed to execute workflow: ${errorMessage}`,
        details: 'The workflow code could not be executed. Please check the logs for details.',
        stack: errorStack,
      },
      { status: 500 }
    )
  }
}
