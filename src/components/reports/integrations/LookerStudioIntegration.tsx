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
  Eye,
  RefreshCw,
  Plus,
  Key
} from 'lucide-react'
import toast from 'react-hot-toast'

interface LookerStudioIntegrationProps {
  spaceId?: string
  onSuccess?: () => void
}

interface LookerStudioConfig {
  id?: string
  name: string
  access_type: 'API' | 'PUBLIC'
  // API Configuration
  refresh_token?: string
  // Public Link
  public_link?: string
  is_active: boolean
}

export function LookerStudioIntegration({ spaceId, onSuccess }: LookerStudioIntegrationProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState<LookerStudioConfig[]>([])
  const [activeConfig, setActiveConfig] = useState<LookerStudioConfig | null>(null)
  const [formData, setFormData] = useState<LookerStudioConfig>({
    name: '',
    access_type: 'API',
    is_active: true
  })

  const loadConfigs = async () => {
    try {
      const response = await fetch(`/api/reports/integrations/looker-studio?space_id=${spaceId || ''}`)
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
        if (data.configs && data.configs.length > 0) {
          setActiveConfig(data.configs[0])
          setFormData(data.configs[0])
        }
      }
    } catch (error) {
      console.error('Error loading Looker Studio configs:', error)
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
      const response = await fetch('/api/reports/integrations/looker-studio', {
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

      toast.success('Looker Studio configuration saved successfully')
      loadConfigs()
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving Looker Studio config:', error)
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
      const response = await fetch('/api/reports/integrations/looker-studio/test', {
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
      const response = await fetch('/api/reports/integrations/looker-studio/sync', {
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
      router.push('/reports/source/looker-studio')
    } catch (error: any) {
      console.error('Error syncing reports:', error)
      toast.error(error.message || 'Failed to sync reports')
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
                <CardTitle>Looker Studio Configurations</CardTitle>
                <CardDescription>
                  Manage your Looker Studio integration configurations
                </CardDescription>
              </div>
              <Button onClick={() => {
                setActiveConfig(null)
                setFormData({
                  name: '',
                  access_type: 'API',
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
            {activeConfig ? 'Edit Looker Studio Configuration' : 'Add Looker Studio Configuration'}
          </CardTitle>
          <CardDescription>
            Configure Looker Studio integration using API or Public Link
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
                placeholder="My Looker Studio Integration"
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
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="PUBLIC">Public Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={formData.access_type.toLowerCase()} onValueChange={(value) => {
            const accessType = value.toUpperCase() as 'API' | 'PUBLIC'
            setFormData({ ...formData, access_type: accessType })
          }}>
            <TabsList>
              <TabsTrigger value="api">API Configuration</TabsTrigger>
              <TabsTrigger value="public">Public Link</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Google OAuth client credentials are managed in SSO settings. Only the refresh token is stored per Looker Studio integration.
              </div>
              <div>
                <Label htmlFor="refresh_token">Refresh Token</Label>
                <Input
                  id="refresh_token"
                  type="password"
                  value={formData.refresh_token || ''}
                  onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                  placeholder="OAuth Refresh Token"
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
                  placeholder="https://lookerstudio.google.com/reporting/..."
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
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/reports/integrations/looker-studio/oauth?space_id=${spaceId || ''}`)
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
        </CardContent>
      </Card>
    </div>
  )
}

