'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Shield, HardDrive, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface IntegrationProps {
  type: string
  title: string
  description: string
  icon: any
  defaultConfig: any
  fields: { key: string; label: string; type?: string; placeholder?: string; description?: string }[]
}

function GenericIntegrationSettings({ type, title, description, icon: Icon, defaultConfig, fields }: IntegrationProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [config, setConfig] = useState<any>(defaultConfig)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        const integration = data.integrations?.find((i: any) => i.type === type)
        
        if (integration) {
          setConfig({ ...defaultConfig, ...integration.config })
          setIsEnabled(integration.isEnabled)
        }
      }
    } catch (error) {
      console.error(`Failed to load ${title} settings:`, error)
      toast.error('Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: title,
          type,
          config,
          isActive: isEnabled,
        }),
      })

      if (response.ok) {
        toast.success(`${title} configuration saved`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error(`Error saving ${title} settings:`, error)
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
              <Icon className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
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
            <Label className="flex items-center gap-2">Enable {title}</Label>
            <p className="text-sm text-muted-foreground">Toggle {title} integration on or off</p>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} disabled={saving || loading} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`${type}-${field.key}`}>{field.label}</Label>
              <Input
                id={`${type}-${field.key}`}
                type={field.type || 'text'}
                value={config[field.key] || ''}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
              {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            </div>
          ))}
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

export function IntegrationSettings() {
  return (
    <Tabs defaultValue="smtp" className="space-y-4">
      <TabsList>
        <TabsTrigger value="smtp" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email (SMTP)</TabsTrigger>
        <TabsTrigger value="azure-ad" className="flex items-center gap-2"><Shield className="h-4 w-4" /> Azure AD</TabsTrigger>
        <TabsTrigger value="aws-s3" className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> AWS S3</TabsTrigger>
      </TabsList>
      
      <TabsContent value="smtp">
        <GenericIntegrationSettings
          type="smtp"
          title="SMTP Email"
          description="Configure SMTP settings for sending system emails."
          icon={Mail}
          defaultConfig={{ host: '', port: '587', user: '', pass: '', from: '', secure: false }}
          fields={[
            { key: 'host', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
            { key: 'port', label: 'Port', placeholder: '587' },
            { key: 'user', label: 'Username', placeholder: 'user@example.com' },
            { key: 'pass', label: 'Password', type: 'password', placeholder: '••••••••' },
            { key: 'from', label: 'From Email', placeholder: 'noreply@example.com' },
          ]}
        />
      </TabsContent>

      <TabsContent value="azure-ad">
        <GenericIntegrationSettings
          type="azure-ad"
          title="Azure AD SSO"
          description="Configure Azure Active Directory for Single Sign-On."
          icon={Shield}
          defaultConfig={{ clientId: '', clientSecret: '', tenantId: '' }}
          fields={[
            { key: 'clientId', label: 'Client ID', placeholder: 'Azure Application (Client) ID' },
            { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Azure Client Secret' },
            { key: 'tenantId', label: 'Tenant ID', placeholder: 'Azure Directory (Tenant) ID' },
          ]}
        />
      </TabsContent>

      <TabsContent value="aws-s3">
        <GenericIntegrationSettings
          type="aws-s3"
          title="AWS S3 Storage"
          description="Configure AWS S3 or compatible object storage (MinIO)."
          icon={HardDrive}
          defaultConfig={{ accessKeyId: '', secretAccessKey: '', region: 'us-east-1', bucket: '', endpoint: '', forcePathStyle: false }}
          fields={[
            { key: 'accessKeyId', label: 'Access Key ID', placeholder: 'AKIA...' },
            { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: '••••••••' },
            { key: 'region', label: 'Region', placeholder: 'us-east-1' },
            { key: 'bucket', label: 'Bucket Name', placeholder: 'my-bucket' },
            { key: 'endpoint', label: 'Custom Endpoint', placeholder: 'https://minio.example.com', description: 'Leave empty for standard AWS S3' },
          ]}
        />
      </TabsContent>
    </Tabs>
  )
}
