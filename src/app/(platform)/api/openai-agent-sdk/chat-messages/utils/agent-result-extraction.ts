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