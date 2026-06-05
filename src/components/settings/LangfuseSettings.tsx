'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Activity, Key, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface LangfuseConfig {
  publicKey: string
  secretKey: string
  host: string
}

interface PlatformIntegration {
  id: string
  type: string
  status: string
  config: LangfuseConfig
  isEnabled: boolean
  updatedAt: string
}

export function LangfuseSettings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [integration, setIntegration] = useState<PlatformIntegration | null>(null)
  const [config, setConfig] = useState<LangfuseConfig>({
    publicKey: '',
    secretKey: '',
    host: 'https://cloud.langfuse.com'
  })
  const [isEnabled, setIsEnabled] = useState(true) // Default to true if not set

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        const langfuseIntegration = data.integrations?.find(
          (i: PlatformIntegration) => i.type === 'langfuse'
        )
        
        if (langfuseIntegration) {
          setIntegration(langfuseIntegration)
          setConfig({
            publicKey: langfuseIntegration.config?.publicKey || '',
            secretKey: langfuseIntegration.config?.secretKey || '',
            host: langfuseIntegration.config?.host || 'https://cloud.langfuse.com'
          })
          setIsEnabled(langfuseIntegration.isEnabled)
        }
      }
    } catch (error) {
      console.error('Failed to load Langfuse settings:', error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.publicKey || !config.secretKey) {
      toast.error('Public Key and Secret Key are required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Langfuse',
          type: 'langfuse',
          config,
          isActive: isEnabled,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIntegration(data.integration)
        toast.success('Langfuse configuration saved')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving Langfuse settings:', error)
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Langfuse Observability
            </CardTitle>
            <CardDescription>
              Configure Langfuse for tracing and monitoring your LLM application.
            </CardDescription>
          </div>
          <StatusBadge status={isEnabled ? 'enabled' : 'disabled'}>
            {isEnabled ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {isEnabled ? 'Enabled' : 'Disabled'}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              Enable Langfuse
            </Label>
            <p className="text-sm text-muted-foreground">
              Toggle Langfuse tracing on or off
            </p>
          </div>
          <Switch 
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            disabled={saving || loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="public-key">Public Key</Label>
            <Input
              id="public-key"
              value={config.publicKey}
              onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
              placeholder="pk-lf-..."
              type="password" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-key">Secret Key</Label>
            <Input
              id="secret-key"
              value={config.secretKey}
              onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              placeholder="sk-lf-..."
              type="password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="host">Host URL</Label>
            <Input
              id="host"
              value={config.host}
              onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
              placeholder="https://cloud.langfuse.com"
            />
            <p className="text-xs text-muted-foreground">
              Defaults to https://cloud.langfuse.com for Langfuse Cloud
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={saving || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
