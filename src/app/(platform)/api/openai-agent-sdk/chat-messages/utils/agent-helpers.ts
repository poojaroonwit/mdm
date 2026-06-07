import { AgentInputItem } from '@openai/agents'
import { db as prisma } from '@/lib/db'

// Helper to get retry config from database
export async function getRetryConfigFromDB(chatbotId: string) {
  const config = await prisma.chatbotRetryConfig.findUnique({
    where: { chatbotId },
  })
  
  if (!config) {
    return {
      enabled: true,
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2.0,
      retryableStatusCodes: ['500', '502', '503', '504'],
      jitter: true,
    }
  }

  return {
    enabled: config.enabled,
    maxRetries: config.maxRetries,
    initialDelay: config.initialDelay,
    maxDelay: config.maxDelay,
    backoffMultiplier: config.backoffMultiplier,
    retryableStatusCodes: config.retryableStatusCodes,
    jitter: config.jitter,
  }
}

// Helper function to get tools from @openai/agents package if available
export function getTool(toolName: string): (() => any) | null {
  try {
    const agentsModule = require('@openai/agents')
    return agentsModule[toolName] || null
  } catch (e) {
    return null
  }
}

/**
 * Create MCP tools from MCP server configuration
 * Supports multiple MCP transport types: hosted, HTTP SSE, stdio
 */
export async function createMCPTools(mcpServers: any[]): Promise<any[]> {
  if (!mcpServers || mcpServers.length === 0) {
    return []
  }

  const tools: any[] = []
  
  try {
    const agentsModule = require('@openai/agents')
    
    // Check if MCP functions are available in the SDK
    const mcpFunctions = [
      'mcpHostedServerTool',
      'mcpHttpSSEServerTool',
      'mcpStdioServerTool',
      'mcpServerTool'
    ]
    
    let mcpToolFunction: any = null
    for (const funcName of mcpFunctions) {
      if (agentsModule[funcName]) {
        mcpToolFunction = agentsModule[funcName]
        break
      }
    }
    
    if (!mcpToolFunction) {
      console.warn('AgentSDK: MCP functions not found in @openai/agents package. MCP servers will not be available.')
      return []
    }
    
    // Process each MCP server configuration
    for (const serverConfig of mcpServers) {
      if (!serverConfig.enabled) continue
      
      try {
        let mcpTool: any = null
        
        // Handle different transport types
        switch (serverConfig.transport) {
          case 'hosted':
            // Hosted MCP Server - publicly reachable
            if (serverConfig.url) {
              mcpTool = mcpToolFunction({
                url: serverConfig.url,
                name: serverConfig.name || 'mcp-server',
                toolFilter: serverConfig.toolFilter || undefined, // Optional: filter which tools to expose
                cache: serverConfig.cache !== false, // Enable caching by default
              })
            }
            break
            
          case 'http-sse':
            // HTTP with Server-Sent Events (SSE)
            if (serverConfig.url) {
              mcpTool = mcpToolFunction({
                url: serverConfig.url,
                name: serverConfig.name || 'mcp-server',
                transport: 'http-sse',
                toolFilter: serverConfig.toolFilter || undefined,
                cache: serverConfig.cache !== false,
              })
            }
            break
            
          case 'stdio':
            // Stdio MCP Server - local process
            if (serverConfig.command) {
              mcpTool = mcpToolFunction({
                command: serverConfig.command,
                args: serverConfig.args || [],
                name: serverConfig.name || 'mcp-server',
                transport: 'stdio',
                toolFilter: serverConfig.toolFilter || undefined,
                cache: serverConfig.cache !== false,
              })
            }
            break
            
          default:
            // Try generic MCP server tool
            if (serverConfig.url) {
              mcpTool = mcpToolFunction({
                url: serverConfig.url,
                name: serverConfig.name || 'mcp-server',
                ...(serverConfig.transport && { transport: serverConfig.transport }),
                toolFilter: serverConfig.toolFilter || undefined,
                cache: serverConfig.cache !== false,
              })
            }
        }
        
        if (mcpTool) {
          tools.push(mcpTool)
          console.log(`AgentSDK: Created MCP tool for server: ${serverConfig.name || 'unnamed'} (${serverConfig.transport || 'default'})`)
        }
      } catch (mcpError) {
        console.error(`AgentSDK: Failed to create MCP tool for server ${serverConfig.name || 'unnamed'}:`, mcpError)
        // Continue with other servers
      }
    }
  } catch (e) {
    console.error('AgentSDK: Error setting up MCP tools:', e)
  }
  
  return tools
}

export { extractTextFromContent, extractTextFromResult } from './agent-result-extraction'

/**
 * Build AgentInputItem array from conversation history
 * Properly formats content types according to Agents SDK:
 * - User messages: input_text, input_image
 * - Assistant messages: output_text
 */
export function buildAgentInputHistory(
  conversationHistory: any[],
  currentMessage: string,
  currentAttachments: any[]
): AgentInputItem[] {
  const history: AgentInputItem[] = []
  
  // Add conversation history
  if (conversationHistory && Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      const isUser = msg.role === 'user'
      const content: any[] = []
      
      // Add text content with correct type
      if (msg.content && msg.content.trim() && msg.content !== 'No response received') {
        content.push({
          type: isUser ? 'input_text' : 'output_text',
          text: msg.content.trim()
        })
      }
      
      // Add attachments (only for user messages)
      if (isUser && msg.attachments && Array.isArray(msg.attachments)) {
        for (const attachment of msg.attachments) {
          if (attachment.type === 'image' && attachment.url) {
            content.push({
              type: 'input_image',
              image_url: { url: attachment.url }
            })
          }
        }
      }
      
      // Only add if has content
      if (content.length > 0) {
        if (isUser) {
          history.push({
            role: 'user',
            content
          } as AgentInputItem)
        } else {
          history.push({
            role: 'assistant',
            status: 'completed',
            content
          } as AgentInputItem)
        }
      }
    }
  }
  
  // Add current message
  const currentContent: any[] = []
  if (currentMessage && currentMessage.trim()) {
    currentContent.push({
      type: 'input_text',
      text: currentMessage.trim()
    })
  }
  
  if (currentAttachments && Array.isArray(currentAttachments)) {
    for (const attachment of currentAttachments) {
      if (attachment.type === 'image' && attachment.url) {
        currentContent.push({
          type: 'input_image',
          image_url: { url: attachment.url }
        })
      }
    }
  }
  
  if (currentContent.length > 0) {
    history.push({
      role: 'user',
      content: currentContent
    })
  }
  
  return history
}

