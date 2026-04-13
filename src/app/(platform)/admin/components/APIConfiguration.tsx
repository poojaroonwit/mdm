'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Key, 
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  TestTube,
  Copy,
  ExternalLink,
  Info,
  Shield,
  Globe,
  Database,
  Sparkles,
  FileText,
  Image,
  Code
} from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'

interface AIProvider {
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

interface AIModel {
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

interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'number' | 'textarea'
  required: boolean
  placeholder?: string
  description?: string
  defaultValue?: string
}

interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  customHeaders?: Record<string, string>
  timeout?: number
  retryAttempts?: number
}

export function APIConfiguration() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
  const [config, setConfig] = useState<ProviderConfig>({
    apiKey: '',
    baseUrl: '',
    customHeaders: {},
    timeout: 30000,
    retryAttempts: 3
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  useEffect(() => {
    loadProviders()
    loadModels()
  }, [])

  const loadProviders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || getDefaultProviders())
      } else {
        setProviders(getDefaultProviders())
      }
    } catch (error) {
      console.error('Error loading AI providers:', error)
      setProviders(getDefaultProviders())
    } finally {
      setIsLoading(false)
    }
  }

  const loadModels = async () => {
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || getDefaultModels())
      } else {
        setModels(getDefaultModels())
      }
    } catch (error) {
      console.error('Error loading AI models:', error)
      setModels(getDefaultModels())
    }
  }

  const getDefaultProviders = (): AIProvider[] => [
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

  const getDefaultModels = (): AIModel[] => [
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

  const configureProvider = async () => {
    if (!selectedProvider) return

    try {
      const response = await fetch(`/api/admin/ai-providers/${selectedProvider.id}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        showSuccess(`${selectedProvider.name} configured successfully`)
        setShowConfigDialog(false)
        setConfig({
          apiKey: '',
          baseUrl: '',
          customHeaders: {},
          timeout: 30000,
          retryAttempts: 3
        })
        loadProviders()
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to configure provider')
      }
    } catch (error) {
      console.error('Error configuring provider:', error)
      showError('Failed to configure provider')
    }
  }

  const testProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-providers/${providerId}/test`, {
        method: 'POST'
      })

      const result = await response.json()
      setTestResults(prev => ({ ...prev, [providerId]: result }))

      if (response.ok) {
        showSuccess(`${providerId} test successful`)
      } else {
        showError(result.error || 'Provider test failed')
      }
    } catch (error) {
      console.error('Error testing provider:', error)
      showError('Provider test failed')
    }
  }

  const deleteProviderConfig = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return

    try {
      const response = await fetch(`/api/admin/ai-providers/${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showSuccess(ToastMessages.DELETED)
        loadProviders()
      } else {
        const error = await response.json()
        showError(error.error || ToastMessages.DELETE_ERROR)
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      showError(ToastMessages.DELETE_ERROR)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-muted text-foreground'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-muted text-foreground'
    }
  }

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'code':
        return <Code className="h-4 w-4" />
      case 'multimodal':
        return <Sparkles className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const openProviderWebsite = (website: string) => {
    window.open(website, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Provider Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure API keys and settings for AI model providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadProviders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="providers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="models">Available Models</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configured Providers</h3>
            <Alert className="max-w-md">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure at least one provider to use AI features in the AI Analyst.
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(provider => (
              <Card key={provider.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">{provider.icon}</span>
                      {provider.name}
                    </CardTitle>
                    {getStatusIcon(provider.status)}
                  </div>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(provider.status)}>
                      {provider.status}
                    </Badge>
                    <Badge variant={provider.isConfigured ? 'default' : 'secondary'}>
                      {provider.isConfigured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </div>

                  {provider.lastTested && (
                    <div className="text-sm text-muted-foreground">
                      Last tested: {provider.lastTested.toLocaleString()}
                    </div>
                  )}

                  {testResults[provider.id] && (
                    <div className="text-sm">
                      <div className="font-medium">Test Results:</div>
                      <div className="text-green-600">
                        ✓ {testResults[provider.id].message || 'Test successful'}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProvider(provider)
                        setConfig({
                          apiKey: provider.apiKey || '',
                          baseUrl: provider.baseUrl || '',
                          customHeaders: {},
                          timeout: 30000,
                          retryAttempts: 3
                        })
                        setShowConfigDialog(true)
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      {provider.isConfigured ? 'Edit' : 'Configure'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testProvider(provider.id)}
                      disabled={!provider.isConfigured}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openProviderWebsite(provider.website)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    {provider.isConfigured && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProviderConfig(provider.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <h3 className="text-lg font-semibold">Available AI Models</h3>
          <div className="space-y-4">
            {providers.map(provider => {
              const providerModels = models.filter(model => model.provider === provider.id)
              if (providerModels.length === 0) return null

              return (
                <Card key={provider.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-xl">{provider.icon}</span>
                      {provider.name} Models
                    </CardTitle>
                    <CardDescription>
                      {providerModels.length} model(s) available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {providerModels.map(model => (
                        <div
                          key={model.id}
                          className={cn(
                            "p-4 border rounded-lg",
                            model.isAvailable ? "border-green-200 bg-green-50" : "border-border bg-muted"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getModelIcon(model.type)}
                              <span className="font-medium">{model.name}</span>
                            </div>
                            <Badge variant={model.isAvailable ? 'default' : 'secondary'}>
                              {model.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {model.description}
                          </p>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>Max tokens: {model.maxTokens.toLocaleString()}</div>
                            <div>Cost: ${model.costPerToken.toFixed(8)}/token</div>
                            <div>Capabilities: {model.capabilities.join(', ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Configuration Dialog */}
      {selectedProvider && (
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-xl">{selectedProvider.icon}</span>
                Configure {selectedProvider.name}
              </DialogTitle>
              <DialogDescription>
                Set up API credentials and configuration for {selectedProvider.name}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-4 pr-4">
                {selectedProvider.configFields.map(field => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={config[field.name as keyof ProviderConfig] as string || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    ) : (
                      <div className="relative mt-1">
                        <Input
                          id={field.name}
                          type={field.type === 'password' && !showApiKey ? 'password' : 'text'}
                          value={config[field.name as keyof ProviderConfig] as string || ''}
                          onChange={(e) => setConfig(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={cn(field.type === 'password' && 'pr-10')}
                        />
                        {field.type === 'password' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    )}
                    {field.description && (
                      <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
                    )}
                  </div>
                ))}

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Advanced Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={config.timeout}
                        onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                        placeholder="30000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="retryAttempts">Retry Attempts</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={config.retryAttempts}
                        onChange={(e) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))}
                        placeholder="3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={configureProvider} 
                disabled={!config.apiKey || selectedProvider.configFields.some(f => f.required && !config[f.name as keyof ProviderConfig])}
              >
                <Shield className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
