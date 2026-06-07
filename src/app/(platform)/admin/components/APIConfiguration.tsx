'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
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

import { getDefaultModels, getDefaultProviders, type AIModel, type AIProvider, type ProviderConfig } from './api-configuration-model'

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
                    <StatusBadge status={provider.status} />
                    <StatusBadge status={provider.isConfigured ? 'configured' : 'not-configured'} label={provider.isConfigured ? 'Configured' : 'Not Configured'} />
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
                            <StatusBadge status={model.isAvailable ? 'available' : 'unavailable'} />
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
