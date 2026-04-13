import { Chatbot, ChatbotVersion } from './types'

// Generate a proper UUID for database compatibility
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateEmbedCode(chatbot: Chatbot): string {
  const type = chatbot.deploymentType || 'popover'
  // Use custom domain if provided, otherwise use current origin
  const baseUrl = chatbot.customEmbedDomain?.replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '')
  // Using /next-api/ prefix to bypass Nginx /api collision
  const src = `${baseUrl}/chat-handler/embed?id=${chatbot.id}&type=${type}`
  return `<script>(function(){var s=document.createElement('script');s.src='${src}';s.async=true;document.head.appendChild(s);})();</script>`
}

export function createNewVersion(currentVersion: string): ChatbotVersion {
  const current = parseFloat(currentVersion) || 1.0
  const newVersionNumber = (current + 0.1).toFixed(1)
  
  return {
    id: `version-${Date.now()}`,
    version: newVersionNumber,
    createdAt: new Date(),
    createdBy: 'current-user',
    isPublished: false,
    changes: 'Configuration updated'
  }
}

export function validateChatbot(formData: Partial<Chatbot>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!formData.name || formData.name.trim() === '') {
    errors.push('Name is required')
  }
  
  if (!formData.website || formData.website.trim() === '') {
    errors.push('Website is required')
  }
  
  const engineType = formData.engineType || 'custom'
  
  if (engineType === 'custom') {
    if (!formData.apiEndpoint || formData.apiEndpoint.trim() === '') {
      errors.push('API Endpoint is required for custom engine type')
    }
    
    if (formData.apiEndpoint && !formData.apiEndpoint.startsWith('http://') && !formData.apiEndpoint.startsWith('https://')) {
      errors.push('API Endpoint must be a valid URL (http:// or https://)')
    }
  } else if (engineType === 'openai') {
    if (!formData.selectedModelId || formData.selectedModelId.trim() === '') {
      errors.push('OpenAI Model is required')
    }
  } else if (engineType === 'chatkit') {
    if (!formData.chatkitAgentId || formData.chatkitAgentId.trim() === '') {
      errors.push('Agent Builder Agent ID is required for ChatKit')
    }
  } else if (engineType === 'openai-agent-sdk') {
    if (!formData.openaiAgentSdkAgentId || formData.openaiAgentSdkAgentId.trim() === '') {
      errors.push('Agent/Workflow ID is required for OpenAI Agent SDK')
    }
    if (!formData.openaiAgentSdkApiKey || formData.openaiAgentSdkApiKey.trim() === '') {
      errors.push('OpenAI API Key is required for OpenAI Agent SDK')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function duplicateChatbot(chatbot: Chatbot, newName?: string): Chatbot {
  return {
    ...chatbot,
    id: generateUUID(),
    name: newName || `${chatbot.name} (Copy)`,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    versions: [{
      id: `version-${Date.now()}`,
      version: '1.0.0',
      createdAt: new Date(),
      createdBy: 'current-user',
      isPublished: false
    }],
    currentVersion: '1.0.0'
  }
}

export function exportChatbot(chatbot: Chatbot): void {
  const dataStr = JSON.stringify(chatbot, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${chatbot.name.replace(/[^a-z0-9]/gi, '_')}_config.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importChatbot(file: File): Promise<Chatbot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const chatbot = JSON.parse(content) as Chatbot
        // Reset id and dates for new import - use UUID for database compatibility
        chatbot.id = generateUUID()
        chatbot.createdAt = new Date()
        chatbot.updatedAt = new Date()
        chatbot.isPublished = false
        chatbot.currentVersion = '1.0.0'
        chatbot.versions = [{
          id: `version-${Date.now()}`,
          version: '1.0.0',
          createdAt: new Date(),
          createdBy: 'current-user',
          isPublished: false
        }]
        resolve(chatbot)
      } catch (error) {
        reject(new Error('Invalid chatbot configuration file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}





