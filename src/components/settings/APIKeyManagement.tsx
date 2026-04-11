'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Database
} from 'lucide-react'
import toast from 'react-hot-toast'

interface APIKey {
  id: string
  provider: string
  name: string
  description?: string
  website?: string
  icon?: string
  apiKey: string | null
  status: 'active' | 'inactive' | 'error' | 'pending'
  isConfigured: boolean
  createdAt: string
  updatedAt: string
}

interface ProviderOption {
  id: string
  name: string
  icon: string
  description: string
  website?: string
  placeholder: string
}

const AVAILABLE_PROVIDERS: ProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'Leading AI research company with GPT models',
    website: 'https://openai.com',
    placeholder: 'sk-...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    description: 'AI safety company with Claude models',
    website: 'https://anthropic.com',
    placeholder: 'sk-ant-...'
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: '🔍',
    description: 'Google\'s AI models including Gemini',
    website: 'https://ai.google.dev',
    placeholder: 'AI...'
  },
  {
    id: 'cohere',
    name: 'Cohere',
    icon: '⚡',
    description: 'Enterprise AI platform for text generation',
    website: 'https://cohere.ai',
    placeholder: 'cohere-...'
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    icon: '🤗',
    description: 'Open source AI models and datasets',
    website: 'https://huggingface.co',
    placeholder: 'hf_...'
  }
]

export function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [editingKey, setEditingKey] = useState<APIKey | null>(null)
  const [vaultStatus, setVaultStatus] = useState<{ backend: 'vault' | 'database'; healthy: boolean } | null>(null)

  useEffect(() => {
    loadAPIKeys()
    loadVaultStatus()
  }, [])

  const loadVaultStatus = async () => {
    try {
      const response = await fetch('/api/admin/secrets')
      if (response.ok) {
        const data = await response.json()
        setVaultStatus({
          backend: data.backend || 'database',
          healthy: data.healthy || false
        })
      } else {
        setVaultStatus({ backend: 'database', healthy: true })
      }
    } catch (error) {
      console.error('Error loading Vault status:', error)
      setVaultStatus({ backend: 'database', healthy: true })
    }
  }

  const loadAPIKeys = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.providers || [])
      } else {
        toast.error('Failed to load API keys')
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAPIKey = async () => {
    if (!selectedProvider || !apiKeyValue.trim()) {
      toast.error('Please select a provider and enter an API key')
      return
    }

    const provider = AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider)
    if (!provider) {
      toast.error('Invalid provider selected')
      return
    }

    setIsLoading(true)
    try {
      // Check if provider already exists
      const existingProvider = apiKeys.find(k => k.provider === selectedProvider)
      
      if (existingProvider) {
        // Update existing provider
        const response = await fetch('/api/admin/ai-providers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: existingProvider.id,
            apiKey: apiKeyValue.trim(),
          }),
        })

        if (response.ok) {
          toast.success('API key updated successfully')
          setShowAddDialog(false)
          setSelectedProvider('')
          setApiKeyValue('')
          loadAPIKeys()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update API key')
        }
      } else {
        // Create new provider
        const response = await fetch('/api/admin/ai-providers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: selectedProvider,
            name: provider.name,
            description: provider.description,
            website: provider.website,
            icon: provider.icon,
            apiKey: apiKeyValue.trim(),
          }),
        })

        if (response.ok) {
          toast.success('API key added successfully')
          setShowAddDialog(false)
          setSelectedProvider('')
          setApiKeyValue('')
          loadAPIKeys()
        } else {
          const error = await response.json()
          // If provider already exists (unique constraint), try to update instead
          if (error.error?.includes('unique') || error.error?.includes('already exists')) {
            // Try to fetch and update
            const getResponse = await fetch('/api/admin/ai-providers')
            if (getResponse.ok) {
              const data = await getResponse.json()
              const existing = data.providers?.find((p: APIKey) => p.provider === selectedProvider)
              if (existing) {
                const updateResponse = await fetch('/api/admin/ai-providers', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: existing.id,
                    apiKey: apiKeyValue.trim(),
                  }),
                })
                if (updateResponse.ok) {
                  toast.success('API key updated successfully')
                  setShowAddDialog(false)
                  setSelectedProvider('')
                  setApiKeyValue('')
                  loadAPIKeys()
                  return
                }
              }
            }
          }
          toast.error(error.error || 'Failed to add API key')
        }
      }
    } catch (error) {
      console.error('Error saving API key:', error)
      toast.error('Failed to save API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditAPIKey = async () => {
    if (!editingKey || !apiKeyValue.trim()) {
      toast.error('Please enter an API key')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingKey.id,
          apiKey: apiKeyValue.trim(),
        }),
      })

      if (response.ok) {
        toast.success('API key updated successfully')
        setShowEditDialog(false)
        setEditingKey(null)
        setApiKeyValue('')
        loadAPIKeys()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update API key')
      }
    } catch (error) {
      console.error('Error updating API key:', error)
      toast.error('Failed to update API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAPIKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    setIsLoading(true)
    try {
      // Note: You may need to create a DELETE endpoint or use PUT to clear the API key
      const response = await fetch('/api/admin/ai-providers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          apiKey: null,
        }),
      })

      if (response.ok) {
        toast.success('API key removed successfully')
        loadAPIKeys()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast.error('Failed to remove API key')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (key: APIKey) => {
    setEditingKey(key)
    setApiKeyValue('')
    setShowEditDialog(true)
  }

  const getStatusBadge = (status: string, isConfigured: boolean) => {
    if (!isConfigured) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      )
    }

    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <AlertCircle className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
    }
  }

  const maskAPIKey = (key: string | null) => {
    if (!key || key === '***') return '***'
    if (key.length <= 8) return '***'
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`
  }

  // Show all providers in the add dialog - users can update existing ones too
  // The handleAddAPIKey function will update if provider exists

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-3 text-xl">
              <Key className="h-6 w-6 text-primary" />
              <span>API Key Management</span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Manage API keys for AI model providers. <strong>2-way sync enabled:</strong> Keys configured in the Chat UI module automatically sync here, and keys updated here can be loaded in the Chat UI.
              {vaultStatus?.backend === 'database' && (
                <span className="block mt-1 text-xs text-muted-foreground">
                  💡 Enable Vault by setting <code className="bg-muted px-1 rounded">USE_VAULT=true</code> in your environment variables for enhanced security.
                </span>
              )}
            </CardDescription>
            {vaultStatus && (
              <div className="mt-2 flex items-center gap-2">
                <Badge 
                  variant={vaultStatus.backend === 'vault' ? 'default' : 'secondary'}
                  className={vaultStatus.backend === 'vault' && vaultStatus.healthy ? 'bg-green-100 text-green-700' : ''}
                >
                  {vaultStatus.backend === 'vault' ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Vault Storage
                    </>
                  ) : (
                    <>
                      <Database className="h-3 w-3 mr-1" />
                      Database Encryption
                    </>
                  )}
                </Badge>
                {vaultStatus.backend === 'vault' && !vaultStatus.healthy && (
                  <Badge variant="destructive" className="text-xs">
                    Vault Unavailable
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No API keys configured</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-2xl">{key.icon || '🔑'}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{key.name}</h3>
                      {getStatusBadge(key.status, key.isConfigured)}
                    </div>
                    {key.description && (
                      <p className="text-sm text-muted-foreground mt-1">{key.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {showApiKey[key.id] && key.apiKey && key.apiKey !== '***'
                          ? key.apiKey
                          : maskAPIKey(key.apiKey)}
                      </span>
                      {key.apiKey && key.apiKey !== '***' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setShowApiKey(prev => ({
                              ...prev,
                              [key.id]: !prev[key.id]
                            }))
                          }
                        >
                          {showApiKey[key.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {key.website && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(key.website, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(key)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAPIKey(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add API Key Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Select a model provider and enter your API key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="provider-select">Model Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider-select">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center space-x-2">
                          <span>{provider.icon}</span>
                          <span>{provider.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProvider && (
                  <p className="text-sm text-muted-foreground">
                    {AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider)?.description}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-key-input">API Key</Label>
                <Input
                  id="api-key-input"
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={
                    selectedProvider
                      ? AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider)?.placeholder || 'Enter API key'
                      : 'Select a provider first'
                  }
                  disabled={!selectedProvider}
                />
                {selectedProvider && (
                  <p className="text-xs text-muted-foreground">
                  Your API key will be securely stored {vaultStatus?.backend === 'vault' ? 'in HashiCorp Vault' : 'with database encryption'}. Only administrators can access this section.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAPIKey} disabled={!selectedProvider || !apiKeyValue.trim() || isLoading}>
                {isLoading ? 'Saving...' : 'Add API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit API Key Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit API Key</DialogTitle>
              <DialogDescription>
                Update the API key for {editingKey?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-api-key-input">API Key</Label>
                <Input
                  id="edit-api-key-input"
                  type="password"
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={
                    editingKey
                      ? AVAILABLE_PROVIDERS.find(p => p.id === editingKey.provider)?.placeholder || 'Enter API key'
                      : 'Enter API key'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Your API key will be securely stored {vaultStatus?.backend === 'vault' ? 'in HashiCorp Vault' : 'with database encryption'}. Only administrators can access this section.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false)
                setEditingKey(null)
                setApiKeyValue('')
              }}>
                Cancel
              </Button>
              <Button onClick={handleEditAPIKey} disabled={!apiKeyValue.trim() || isLoading}>
                {isLoading ? 'Updating...' : 'Update API Key'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

