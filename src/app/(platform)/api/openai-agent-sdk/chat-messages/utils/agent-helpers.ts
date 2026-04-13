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

/**
 * Extract text content from AgentInputItem content array
 * According to Agents SDK documentation:
 * - User messages use: input_text, input_image
 * - Assistant messages use: output_text
 */
export function extractTextFromContent(content: any[]): string {
  if (!Array.isArray(content)) return ''
  
  let text = ''
  for (const item of content) {
    if (item.type === 'input_text' || item.type === 'output_text' || item.type === 'text') {
      if (typeof item.text === 'string') {
        text += item.text + '\n'
      } else if (item.text?.value) {
        text += item.text.value + '\n'
      }
    }
  }
  return text.trim()
}

/**
 * Extract text from runner.run() result
 * Based on Agents SDK documentation, results have:
 * - newItems: Array of new message items added to the conversation
 * - finalOutput: The final output from the agent
 * - Also handles various other result structures
 */
export function extractTextFromResult(result: any): string {
  if (!result) {
    console.warn('AgentSDK: extractTextFromResult received null/undefined result')
    return ''
  }
  
  // If result is a string, return it directly
  if (typeof result === 'string') {
    console.log('AgentSDK: Result is a string, returning directly')
    return result
  }
  
  let outputText = ''
  
  // Log result structure for debugging
  console.log('AgentSDK: Extracting text from result structure:', {
    hasNewItems: !!result.newItems,
    hasFinalOutput: !!result.finalOutput,
    resultType: typeof result,
    resultKeys: Object.keys(result),
    resultConstructor: result.constructor?.name,
    isArray: Array.isArray(result),
    arrayLength: Array.isArray(result) ? result.length : undefined
  })
  
  // If result is an array, try to extract from it
  if (Array.isArray(result)) {
    console.log(`AgentSDK: Result is an array with ${result.length} items`)
    for (let i = 0; i < result.length; i++) {
      const item = result[i]
      if (typeof item === 'string') {
        outputText += item + '\n'
        console.log(`AgentSDK: Extracted string from array[${i}]`)
      } else if (item?.content) {
        if (typeof item.content === 'string') {
          outputText += item.content + '\n'
          console.log(`AgentSDK: Extracted content from array[${i}].content`)
        } else if (Array.isArray(item.content)) {
          const extracted = extractTextFromContent(item.content)
          if (extracted) {
            outputText += extracted + '\n'
            console.log(`AgentSDK: Extracted from array[${i}].content (array)`)
          }
        }
      } else if (item?.text) {
        outputText += (typeof item.text === 'string' ? item.text : item.text?.value || '') + '\n'
        console.log(`AgentSDK: Extracted from array[${i}].text`)
      } else {
        const foundText = findTextInObject(item)
        if (foundText) {
          outputText += foundText + '\n'
          console.log(`AgentSDK: Extracted from array[${i}] using recursive search`)
        }
      }
    }
    if (outputText) {
      return outputText.trim()
    }
  }
  
  // Extract from newItems (assistant messages added during execution)
  if (result.newItems && Array.isArray(result.newItems)) {
    console.log(`AgentSDK: Processing ${result.newItems.length} newItems`)
    for (let i = 0; i < result.newItems.length; i++) {
      const item = result.newItems[i]
      
      // Check rawItem structure (standard SDK format)
      if (item.rawItem?.role === 'assistant' && item.rawItem.content) {
        if (Array.isArray(item.rawItem.content)) {
          const extracted = extractTextFromContent(item.rawItem.content)
          if (extracted) {
            outputText += extracted + '\n'
            console.log(`AgentSDK: Extracted text from newItems[${i}].rawItem.content (array)`)
          }
        } else if (typeof item.rawItem.content === 'string') {
          outputText += item.rawItem.content + '\n'
          console.log(`AgentSDK: Extracted text from newItems[${i}].rawItem.content (string)`)
        }
      }
      // Check direct structure
      else if (item.role === 'assistant' && item.content) {
        if (Array.isArray(item.content)) {
          const extracted = extractTextFromContent(item.content)
          if (extracted) {
            outputText += extracted + '\n'
            console.log(`AgentSDK: Extracted text from newItems[${i}].content (array)`)
          }
        } else if (typeof item.content === 'string') {
          outputText += item.content + '\n'
          console.log(`AgentSDK: Extracted text from newItems[${i}].content (string)`)
        }
      }
      // Check for direct text property
      else if (item.text) {
        const textValue = typeof item.text === 'string' ? item.text : item.text?.value || ''
        if (textValue) {
          outputText += textValue + '\n'
          console.log(`AgentSDK: Extracted text from newItems[${i}].text`)
        }
      }
      // Check for message property
      else if (item.message) {
        if (typeof item.message === 'string') {
          outputText += item.message + '\n'
          console.log(`AgentSDK: Extracted text from newItems[${i}].message (string)`)
        } else if (item.message.content) {
          if (typeof item.message.content === 'string') {
            outputText += item.message.content + '\n'
            console.log(`AgentSDK: Extracted text from newItems[${i}].message.content (string)`)
          } else if (Array.isArray(item.message.content)) {
            const extracted = extractTextFromContent(item.message.content)
            if (extracted) {
              outputText += extracted + '\n'
              console.log(`AgentSDK: Extracted text from newItems[${i}].message.content (array)`)
            }
          }
        }
      }
      // Check for any content-like property
      else {
        // Try to find any text-like properties recursively
        const foundText = findTextInObject(item)
        if (foundText) {
          outputText += foundText + '\n'
          console.log(`AgentSDK: Extracted text from newItems[${i}] using recursive search`)
        }
      }
    }
  }
  
  // Extract from finalOutput (the final response)
  if (!outputText && result.finalOutput) {
    console.log('AgentSDK: Processing finalOutput')
    if (typeof result.finalOutput === 'string') {
      outputText = result.finalOutput
      console.log('AgentSDK: Extracted text from finalOutput (string)')
    } else if (typeof result.finalOutput === 'object') {
      // Try text property
      if (result.finalOutput.text) {
        outputText = typeof result.finalOutput.text === 'string' 
          ? result.finalOutput.text 
          : result.finalOutput.text?.value || ''
        if (outputText) {
          console.log('AgentSDK: Extracted text from finalOutput.text')
        }
      }
      // Try value property
      else if (result.finalOutput.value) {
        outputText = String(result.finalOutput.value)
        console.log('AgentSDK: Extracted text from finalOutput.value')
      }
      // Try content array
      else if (Array.isArray(result.finalOutput.content)) {
        outputText = extractTextFromContent(result.finalOutput.content)
        if (outputText) {
          console.log('AgentSDK: Extracted text from finalOutput.content (array)')
        }
      }
      // Try content string
      else if (typeof result.finalOutput.content === 'string') {
        outputText = result.finalOutput.content
        console.log('AgentSDK: Extracted text from finalOutput.content (string)')
      }
      // Try recursive search
      else {
        const foundText = findTextInObject(result.finalOutput)
        if (foundText) {
          outputText = foundText
          console.log('AgentSDK: Extracted text from finalOutput using recursive search')
        }
      }
    }
  }
  
  // Try other common result properties
  if (!outputText) {
    // Check for response property
    if (result.response) {
      if (typeof result.response === 'string') {
        outputText = result.response
        console.log('AgentSDK: Extracted text from result.response (string)')
      } else if (result.response.content) {
        outputText = typeof result.response.content === 'string' ? result.response.content : ''
        if (outputText) {
          console.log('AgentSDK: Extracted text from result.response.content')
        }
      }
    }
    // Check for message property
    else if (result.message) {
      if (typeof result.message === 'string') {
        outputText = result.message
        console.log('AgentSDK: Extracted text from result.message (string)')
      } else if (result.message.content) {
        outputText = typeof result.message.content === 'string' ? result.message.content : ''
        if (outputText) {
          console.log('AgentSDK: Extracted text from result.message.content')
        }
      }
    }
    // Check for text property
    else if (result.text) {
      outputText = typeof result.text === 'string' ? result.text : String(result.text)
      console.log('AgentSDK: Extracted text from result.text')
    }
    // Check for output property
    else if (result.output) {
      if (typeof result.output === 'string') {
        outputText = result.output
        console.log('AgentSDK: Extracted text from result.output (string)')
      } else {
        const foundText = findTextInObject(result.output)
        if (foundText) {
          outputText = foundText
          console.log('AgentSDK: Extracted text from result.output using recursive search')
        }
      }
    }
    // Last resort: recursive search
    else {
      const foundText = findTextInObject(result)
      if (foundText) {
        outputText = foundText
        console.log('AgentSDK: Extracted text using recursive search on entire result')
      }
    }
  }
  
  const finalText = outputText.trim()
  if (finalText) {
    console.log(`AgentSDK: Successfully extracted ${finalText.length} characters of text`)
  } else {
    console.warn('AgentSDK: No text could be extracted from result. Full structure:', JSON.stringify(result, null, 2))
  }
  
  return finalText
}

/**
 * Recursively search for text content in an object
 */
function findTextInObject(obj: any, depth = 0, maxDepth = 5): string {
  if (depth > maxDepth || !obj || typeof obj !== 'object') {
    return ''
  }
  
  // Check common text properties
  const textProperties = ['text', 'content', 'message', 'value', 'output', 'response']
  for (const prop of textProperties) {
    if (obj[prop]) {
      if (typeof obj[prop] === 'string' && obj[prop].trim()) {
        return obj[prop].trim()
      } else if (Array.isArray(obj[prop])) {
        for (const item of obj[prop]) {
          if (typeof item === 'string' && item.trim()) {
            return item.trim()
          } else if (typeof item === 'object' && item.text) {
            const found = findTextInObject(item, depth + 1, maxDepth)
            if (found) return found
          }
        }
      } else if (typeof obj[prop] === 'object') {
        const found = findTextInObject(obj[prop], depth + 1, maxDepth)
        if (found) return found
      }
    }
  }
  
  // Recursively check all properties
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !textProperties.includes(key)) {
      const found = findTextInObject(obj[key], depth + 1, maxDepth)
      if (found) return found
    }
  }
  
  return ''
}

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

