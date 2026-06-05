'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity,
  CheckCircle,
  RefreshCw,
  Plus,
  Key,
  Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

interface GrafanaIntegrationProps {
  spaceId?: string
  onSuccess?: () => void
}

interface GrafanaConfig {
  id?: string
  name: string
  access_type: 'SDK' | 'EMBED' | 'PUBLIC'
  // SDK Configuration
  api_url?: string
  api_key?: string
  // Embed Configuration
  embed_url?: string
  // Public Link
  public_link?: string
  is_active: boolean
}

export function GrafanaIntegration({ spaceId, onSuccess }: GrafanaIntegrationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<GrafanaConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<GrafanaConfig | null>(null)
  const [formData, setFormData] = useState<GrafanaConfig>({
    name: '',
    access_type: 'SDK',
    is_active: true
  })

  const loadConfigs = async () => {
    try {
      const response = await fetch(`/api/reports/integrations/grafana?space_id=${spaceId || ''}`)
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
        if (data.configs && data.configs.length > 0) {
          setActiveConfig(data.configs[0])
          setFormData(data.configs[0])
        }
      }
    } catch (error) {
      console.error('Error loading Grafana configs:', error)
    }
  }

  useEffect(() => {
    loadConfigs()
  }, [spaceId])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Configuration name is required')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports/integrations/grafana', {
        method: activeConfig?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          space_id: spaceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      toast.success('Grafana configuration saved successfully')
      loadConfigs()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving Grafana config:', error)
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
      const response = await fetch('/api/reports/integrations/grafana/test', {
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

  const handleSyncDashboards = async () => {
    if (!activeConfig) {
      toast.error('Please select or create a configuration first')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/reports/integrations/grafana/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config_id: activeConfig.id,
          space_id: spaceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sync dashboards')
      }

      const data = await response.json()
      toast.success(`Successfully synced ${data.count || 0} dashboards`)
      router.push('/reports/source/grafana')
    } catch (error: any) {
      console.error('Error syncing dashboards:', error)
      toast.error(error.message || 'Failed to sync dashboards')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing Configurations */}
      {configs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Grafana Configurations</CardTitle>
                <CardDescription>
                  Manage your Grafana integration configurations
                </CardDescription>
              </div>
              <Button onClick={() => {
                setActiveConfig(null)
                setFormData({
                  name: '',
                  access_type: 'SDK',
                  is_active: true
                })
              }}>
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
                  onClick={() => {
                    setActiveConfig(config)
                    setFormData(config)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Access Type: {config.access_type}
                      </div>
                    </div>
                    <StatusBadge status={config.is_active ? 'active' : 'inactive'} />
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
            {activeConfig ? 'Edit Grafana Configuration' : 'Add Grafana Configuration'}
          </CardTitle>
          <CardDescription>
            Configure Grafana integration using SDK, Embed, or Public Link
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
                placeholder="My Grafana Integration"
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
                  <SelectItem value="SDK">SDK</SelectItem>
                  <SelectItem value="EMBED">Embed Link</SelectItem>
                  <SelectItem value="PUBLIC">Public Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={formData.access_type.toLowerCase()} onValueChange={(value) => {
            const accessType = value.toUpperCase() as 'SDK' | 'EMBED' | 'PUBLIC'
            setFormData({ ...formData, access_type: accessType })
          }}>
            <TabsList>
              <TabsTrigger value="sdk">SDK Configuration</TabsTrigger>
              <TabsTrigger value="embed">Embed Configuration</TabsTrigger>
              <TabsTrigger value="public">Public Link</TabsTrigger>
            </TabsList>

            <TabsContent value="sdk" className="space-y-4">
              <div>
                <Label htmlFor="api_url">Grafana API URL</Label>
                <Input
                  id="api_url"
                  value={formData.api_url || ''}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://grafana.example.com/api"
                />
              </div>
              <div>
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="Grafana API Key"
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
                  placeholder="https://grafana.example.com/d/..."
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
                  placeholder="https://grafana.example.com/public-dashboards/..."
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
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            {activeConfig && (
              <>
                <Button variant="outline" onClick={handleTestConnection} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button variant="outline" onClick={handleSyncDashboards} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Dashboards
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

