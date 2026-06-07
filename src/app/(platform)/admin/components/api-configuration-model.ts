export interface AIProvider {
  id: string
  name: string
  icon: string
  description: string
  website: string
  isSupported: boolean
  models: AIModel[]
  configFields: ConfigField[]
  status: 'active' | 'inactive' | 'error' | 'pending'
  apiKey?: string
  baseUrl?: string
  isConfigured: boolean
  lastTested?: Date
}

export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'image' | 'code' | 'multimodal'
  description: string
  maxTokens: number
  costPerToken: number
  isAvailable: boolean
  capabilities: string[]
}

export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'number' | 'textarea'
  required: boolean
  placeholder?: string
  description?: string
  defaultValue?: string
}

export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  customHeaders?: Record<string, string>
  timeout?: number
  retryAttempts?: number
}

export const getDefaultProviders = (): AIProvider[] => [
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '🤖',
      description: 'Leading AI research company with GPT models',
      website: 'https://openai.com',
      isSupported: true,
      models: [],
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'sk-...',
          description: 'Your OpenAI API key from platform.openai.com'
        },
        {
          name: 'baseUrl',
          label: 'Base URL',
          type: 'url',
          required: false,
          placeholder: 'https://api.openai.com/v1',
          description: 'Custom API endpoint (optional)'
        }
      ],
      status: 'inactive',
      isConfigured: false
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      icon: '🧠',
      description: 'AI safety company with Claude models',
      website: 'https://anthropic.com',
      isSupported: true,
      models: [],
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'sk-ant-...',
          description: 'Your Anthropic API key from console.anthropic.com'
        }
      ],
      status: 'inactive',
      isConfigured: false
    },
    {
      id: 'google',
      name: 'Google AI',
      icon: '🔍',
      description: 'Google\'s AI models including Gemini',
      website: 'https://ai.google.dev',
      isSupported: true,
      models: [],
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'AI...',
          description: 'Your Google AI API key from ai.google.dev'
        }
      ],
      status: 'inactive',
      isConfigured: false
    },
    {
      id: 'cohere',
      name: 'Cohere',
      icon: '⚡',
      description: 'Enterprise AI platform for text generation',
      website: 'https://cohere.ai',
      isSupported: true,
      models: [],
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'cohere-...',
          description: 'Your Cohere API key from dashboard.cohere.ai'
        }
      ],
      status: 'inactive',
      isConfigured: false
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      icon: '🤗',
      description: 'Open source AI models and datasets',
      website: 'https://huggingface.co',
      isSupported: true,
      models: [],
      configFields: [
        {
          name: 'apiKey',
          label: 'API Key',
          type: 'password',
          required: true,
          placeholder: 'hf_...',
          description: 'Your Hugging Face API token from huggingface.co/settings/tokens'
        },
        {
          name: 'baseUrl',
          label: 'Inference Endpoint',
          type: 'url',
          required: false,
          placeholder: 'https://api-inference.huggingface.co',
          description: 'Custom inference endpoint (optional)'
        }
      ],
      status: 'inactive',
      isConfigured: false
    }
  ]

export const getDefaultModels = (): AIModel[] => [
    // OpenAI Models
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      type: 'text',
      description: 'Most advanced GPT-4 model with vision capabilities',
      maxTokens: 128000,
      costPerToken: 0.00003,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function-calling']
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      type: 'text',
      description: 'Faster, cheaper GPT-4 model',
      maxTokens: 128000,
      costPerToken: 0.000015,
      isAvailable: true,
      capabilities: ['text', 'vision', 'function-calling']
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      type: 'text',
      description: 'Fast and efficient text generation',
      maxTokens: 16384,
      costPerToken: 0.000002,
      isAvailable: true,
      capabilities: ['text', 'function-calling']
    },
    // Anthropic Models
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      type: 'text',
      description: 'Most capable Claude model for complex tasks',
      maxTokens: 200000,
      costPerToken: 0.000003,
      isAvailable: true,
      capabilities: ['text', 'vision', 'code']
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      type: 'text',
      description: 'Fast and efficient Claude model',
      maxTokens: 200000,
      costPerToken: 0.00000025,
      isAvailable: true,
      capabilities: ['text', 'vision']
    },
    // Google Models
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      type: 'multimodal',
      description: 'Google\'s advanced multimodal model',
      maxTokens: 30720,
      costPerToken: 0.0000005,
      isAvailable: true,
      capabilities: ['text', 'vision', 'code']
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      provider: 'google',
      type: 'multimodal',
      description: 'Vision-enabled Gemini model',
      maxTokens: 16384,
      costPerToken: 0.0000005,
      isAvailable: true,
      capabilities: ['text', 'vision']
    },
    // Cohere Models
    {
      id: 'command',
      name: 'Command',
      provider: 'cohere',
      type: 'text',
      description: 'Cohere\'s flagship text generation model',
      maxTokens: 4096,
      costPerToken: 0.0000015,
      isAvailable: true,
      capabilities: ['text', 'summarization']
    },
    // Hugging Face Models
    {
      id: 'llama-2-70b',
      name: 'Llama 2 70B',
      provider: 'huggingface',
      type: 'text',
      description: 'Meta\'s open source large language model',
      maxTokens: 4096,
      costPerToken: 0.0000007,
      isAvailable: true,
      capabilities: ['text', 'code']
    }
  ]

