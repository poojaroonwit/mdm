'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Power,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Key,
  Link as LinkIcon,
  Settings,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { TooltipProvider } from '@/components/ui/tooltip'

interface PowerBIIntegrationProps {
  spaceId?: string
  onSuccess?: () => void
}

interface PowerBIConfig {
  id?: string
  name: string
  access_type: 'API' | 'SDK' | 'EMBED' | 'PUBLIC'
  // API Configuration
  tenant_id?: string
  client_id?: string
  client_secret?: string
  workspace_id?: string
  // SDK Configuration
  sdk_config?: string
  // Embed Configuration
  embed_url?: string
  embed_token?: string
  // Public Link
  public_link?: string
  is_active: boolean
}

function normalizePowerBIConfig(rawConfig: any): PowerBIConfig {
  const parsedConfig = typeof rawConfig?.config === 'string'
    ? JSON.parse(rawConfig.config)
    : rawConfig?.config || {}

  return {
    id: rawConfig?.id,
    name: rawConfig?.name || '',
    access_type: rawConfig?.access_type || 'API',
    tenant_id: parsedConfig.tenant_id || '',
    client_id: parsedConfig.client_id || '',
    client_secret: parsedConfig.client_secret || '',
    workspace_id: parsedConfig.workspace_id || '',
    sdk_config: parsedConfig.sdk_config || '',
    embed_url: parsedConfig.embed_url || '',
    embed_token: parsedConfig.embed_token || '',
    public_link: parsedConfig.public_link || '',
    is_active: rawConfig?.is_active !== false
  }
}

export function PowerBIIntegration({ spaceId, onSuccess }: PowerBIIntegrationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<PowerBIConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<PowerBIConfig | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [formData, setFormData] = useState<PowerBIConfig>({
    name: '',
    access_type: 'API',
    is_active: true
  })

  const loadConfigs = async () => {
    try {
      const response = await fetch(`/api/reports/integrations/power-bi?space_id=${spaceId || ''}`)
      if (response.ok) {
        const data = await response.json()
        const normalizedConfigs = (data.configs || []).map(normalizePowerBIConfig)
        setConfigs(normalizedConfigs)
        if (normalizedConfigs.length > 0) {
          setActiveConfig(normalizedConfigs[0])
          setFormData(normalizedConfigs[0])
        }
      }
    } catch (error) {
      console.error('Error loading Power BI configs:', error)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [spaceId])

  useEffect(() => {
    if (activeConfig) {
      setFormData(activeConfig)
    }
  }, [activeConfig])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Configuration name is required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports/integrations/power-bi', {
        method: activeConfig?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeConfig?.id,
          ...formData,
          space_id: spaceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      toast.success('Power BI configuration saved successfully')
      setShowAddDialog(false)
      setFormData({
        name: '',
        access_type: 'API',
        is_active: true
      })
      loadConfigs()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving Power BI config:', error)
      toast.error(error.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!activeConfig) {
      toast.error('Please select or create a configuration first')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports/integrations/power-bi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_id: activeConfig.id
        })
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      const data = await response.json()
      if (data.success) {
        toast.success('Connection test successful!')
      } else {
        toast.error(data.error || 'Connection test failed')
      }
    } catch (error: any) {
      console.error('Error testing connection:', error)
      toast.error(error.message || 'Connection test failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncReports = async () => {
    if (!activeConfig) {
      toast.error('Please select or create a configuration first')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports/integrations/power-bi/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_id: activeConfig.id,
          space_id: spaceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sync reports')
      }

      const data = await response.json()
      toast.success(`Successfully synced ${data.count || 0} reports`)
      router.push('/reports/source/power-bi')
    } catch (error: any) {
      console.error('Error syncing reports:', error)
      toast.error(error.message || 'Failed to sync reports')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Existing Configurations */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Power BI Configurations</CardTitle>
                <CardDescription>
                  Manage your Power BI integration configurations
                </CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    activeConfig?.id === config.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setActiveConfig(config)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Access Type: {config.access_type}
                      </div>
                    </div>
                    <Badge variant={config.is_active ? 'default' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeConfig ? 'Edit Power BI Configuration' : 'Add Power BI Configuration'}
          </CardTitle>
          <CardDescription>
            Configure Power BI integration using API, SDK, Embed, or Public Link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Configuration Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Power BI Integration"
              />
            </div>
            <div>
              <Label htmlFor="access_type">Access Type *</Label>
              <Select
                value={formData.access_type}
                onValueChange={(value: any) => setFormData({ ...formData, access_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="API">API Service</SelectItem>
                  <SelectItem value="SDK">SDK</SelectItem>
                  <SelectItem value="EMBED">Embed Link</SelectItem>
                  <SelectItem value="PUBLIC">Public Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={formData.access_type.toLowerCase()} onValueChange={(value) => {
            const accessType = value.toUpperCase() as 'API' | 'SDK' | 'EMBED' | 'PUBLIC'
            setFormData({ ...formData, access_type: accessType })
          }}>
            <TabsList>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="sdk">SDK Configuration</TabsTrigger>
              <TabsTrigger value="embed">Embed Configuration</TabsTrigger>
              <TabsTrigger value="public">Public Link</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenant_id">Tenant ID</Label>
                  <Input
                    id="tenant_id"
                    type="password"
                    value={formData.tenant_id || ''}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    placeholder="Azure AD Tenant ID"
                  />
                </div>
                <div>
                  <Label htmlFor="client_id">Client ID</Label>
                  <Input
                    id="client_id"
                    type="password"
                    value={formData.client_id || ''}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    placeholder="Application (Client) ID"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client_secret">Client Secret</Label>
                <Input
                  id="client_secret"
                  type="password"
                  value={formData.client_secret || ''}
                  onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                  placeholder="Client Secret Value"
                />
              </div>
              <div>
                <Label htmlFor="workspace_id">Workspace ID (Optional)</Label>
                <Input
                  id="workspace_id"
                  value={formData.workspace_id || ''}
                  onChange={(e) => setFormData({ ...formData, workspace_id: e.target.value })}
                  placeholder="Power BI Workspace ID"
                />
              </div>
            </TabsContent>

            <TabsContent value="sdk" className="space-y-4">
              <div>
                <Label htmlFor="sdk_config">SDK Configuration (JSON)</Label>
                <Textarea
                  id="sdk_config"
                  value={formData.sdk_config || ''}
                  onChange={(e) => setFormData({ ...formData, sdk_config: e.target.value })}
                  placeholder='{"accessToken": "...", "embedUrl": "..."}'
                  rows={6}
                />
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4">
              <div>
                <Label htmlFor="embed_url">Embed URL</Label>
                <Input
                  id="embed_url"
                  value={formData.embed_url || ''}
                  onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })}
                  placeholder="https://app.powerbi.com/reportEmbed..."
                />
              </div>
              <div>
                <Label htmlFor="embed_token">Embed Token (Optional)</Label>
                <Input
                  id="embed_token"
                  type="password"
                  value={formData.embed_token || ''}
                  onChange={(e) => setFormData({ ...formData, embed_token: e.target.value })}
                  placeholder="Embed Access Token"
                />
              </div>
            </TabsContent>

            <TabsContent value="public" className="space-y-4">
              <div>
                <Label htmlFor="public_link">Public Link</Label>
                <Input
                  id="public_link"
                  value={formData.public_link || ''}
                  onChange={(e) => setFormData({ ...formData, public_link: e.target.value })}
                  placeholder="https://app.powerbi.com/view..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!activeConfig?.id) {
                      toast.error('Save a Power BI API configuration first')
                      return
                    }

                    const response = await fetch(`/api/reports/integrations/power-bi/oauth?space_id=${spaceId || ''}&config_id=${activeConfig.id}`)
                    if (!response.ok) throw new Error('Failed to initiate OAuth')
                    const data = await response.json()
                    window.location.href = data.authUrl
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to start OAuth flow')
                  }
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Connect via OAuth
              </Button>
              {activeConfig && (
                <>
                  <Button variant="outline" onClick={handleTestConnection} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button variant="outline" onClick={handleSyncReports} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Reports
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  )
}

