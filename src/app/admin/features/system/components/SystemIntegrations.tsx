'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Server,
  Lock,
  Search,
  Eye,
  EyeOff,
  Database,
  Mail,
  Cloud,
  Shield,
  BarChart3,
  type LucideIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

// Integration configuration types
export interface IntegrationConfig {
  id: string
  name: string
  type: string
  description: string
  icon: LucideIcon
  category: 'authentication' | 'storage' | 'monitoring' | 'communication' | 'ai' | 'security'
  status: 'active' | 'inactive' | 'error' | 'pending'
  isConfigured: boolean
  config?: Record<string, any>
}

// System-level integrations (single instance per system)
const SYSTEM_CONFIG_INTEGRATIONS: Omit<IntegrationConfig, 'id' | 'isConfigured' | 'status' | 'config'>[] = [
  {
    name: 'HashiCorp Vault',
    type: 'vault',
    description: 'Secrets management and encryption',
    icon: Lock,
    category: 'security'
  },
  {
    name: 'Elasticsearch',
    type: 'elasticsearch',
    description: 'Search and log analytics',
    icon: Search,
    category: 'monitoring'
  },
  {
    name: 'SigNoz',
    type: 'signoz',
    description: 'APM and observability platform',
    icon: BarChart3,
    category: 'monitoring'
  },
  {
    name: 'SMTP Email',
    type: 'smtp',
    description: 'Email notifications and alerts',
    icon: Mail,
    category: 'communication'
  },
  {
    name: 'Azure AD SSO',
    type: 'azure-ad',
    description: 'Single sign-on with Microsoft Azure',
    icon: Shield,
    category: 'authentication'
  },
  {
    name: 'Google OAuth',
    type: 'google-auth',
    description: 'Sign in with Google',
    icon: Cloud,
    category: 'authentication'
  },
  {
    name: 'Langfuse',
    type: 'langfuse',
    description: 'LLM observability and analytics',
    icon: BarChart3,
    category: 'ai'
  },
  {
    name: 'ServiceDesk',
    type: 'servicedesk',
    description: 'IT service management integration',
    icon: Server,
    category: 'communication'
  }
]

interface SystemIntegrationsProps {
  hideHeader?: boolean
}

export function SystemIntegrations({ hideHeader = false }: SystemIntegrationsProps) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [configForm, setConfigForm] = useState<Record<string, any>>({})
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [isEnabled, setIsEnabled] = useState(true)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/integrations/list')
      if (response.ok) {
        const data = await response.json()
        const merged = SYSTEM_CONFIG_INTEGRATIONS.map(integration => {
          const saved = data.integrations?.find((i: any) =>
            i.name?.toLowerCase() === integration.name.toLowerCase() ||
            i.type?.toLowerCase() === integration.type.toLowerCase()
          )
          return {
            id: saved?.id || `default-${integration.type}`,
            ...integration,
            isConfigured: !!saved,
            status: saved?.status || 'inactive',
            config: saved?.config || {},
            isEnabled: saved?.isEnabled !== false // Default to true if not set
          }
        })
        setIntegrations(merged)
      } else {
        const defaultIntegrations = SYSTEM_CONFIG_INTEGRATIONS.map(integration => ({
          id: `default-${integration.type}`,
          ...integration,
          isConfigured: false,
          status: 'inactive' as const,
          config: {}
        }))
        setIntegrations(defaultIntegrations)
      }
    } catch (error) {
      console.error('Error loading system integrations:', error)
      const defaultIntegrations = SYSTEM_CONFIG_INTEGRATIONS.map(integration => ({
        id: `default-${integration.type}`,
        ...integration,
        isConfigured: false,
        status: 'inactive' as const,
        config: {}
      }))
      setIntegrations(defaultIntegrations)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigure = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration)
    setConfigForm(integration.config || {})
    setIsEnabled((integration as any).isEnabled !== false) // Default to true
    setShowConfigDialog(true)
  }

  const handleToggleEnabled = async (integration: IntegrationConfig, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: integration.type,
          name: integration.name,
          config: integration.config || {},
          isActive: enabled
        })
      })

      if (response.ok) {
        toast.success(`${integration.name} ${enabled ? 'enabled' : 'disabled'}`)

        // Clear cache for specific integration types
        if (integration.type === 'signoz') {
          try {
            const { clearSigNozCache } = await import('@/lib/signoz-client')
            clearSigNozCache()
          } catch (error) {
            // Silently fail if module not available
          }
        }

        loadIntegrations()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Failed to update integration')
      }
    } catch (error) {
      console.error('Error toggling integration:', error)
      toast.error('Failed to update integration')
    }
  }

  const handleSave = async () => {
    if (!selectedIntegration) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedIntegration.type,
          name: selectedIntegration.name,
          config: configForm,
          isActive: isEnabled
        })
      })

      if (response.ok) {
        toast.success(`${selectedIntegration.name} configured successfully`)

        // Clear cache for specific integration types
        if (selectedIntegration.type === 'signoz') {
          try {
            const { clearSigNozCache } = await import('@/lib/signoz-client')
            clearSigNozCache()
          } catch (error) {
            // Silently fail if module not available
          }
        }

        setShowConfigDialog(false)
        loadIntegrations()
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving integration:', error)
      toast.error('Failed to save configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (integration: IntegrationConfig) => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: integration.type,
          config: integration.config
        })
      })

      if (response.ok) {
        toast.success('Connection test successful')
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.error || 'Connection test failed')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast.error('Connection test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfigFields = (type: string) => {
    switch (type.toLowerCase()) {
      case 'servicedesk':
        return [
          { key: 'baseUrl', label: 'Base URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: true },
          { key: 'technicianKey', label: 'Technician Key', type: 'password', required: false }
        ]
      case 'vault':
        return [
          { key: 'vaultUrl', label: 'Vault URL', type: 'text', required: true },
          { key: 'token', label: 'Token', type: 'password', required: true },
          { key: 'mountPath', label: 'Mount Path', type: 'text', required: false }
        ]
      case 'elasticsearch':
        return [
          { key: 'url', label: 'Elasticsearch URL', type: 'text', required: true, placeholder: 'https://localhost:9200' },
          { key: 'cloudId', label: 'Cloud ID (optional)', type: 'text', required: false, placeholder: 'For Elastic Cloud' },
          { key: 'username', label: 'Username (optional)', type: 'text', required: false },
          { key: 'password', label: 'Password (optional)', type: 'password', required: false },
          { key: 'apiKey', label: 'API Key (optional)', type: 'password', required: false },
          { key: 'indexPrefix', label: 'Index Prefix', type: 'text', required: false, placeholder: 'mdm-logs (default)' }
        ]
      case 'signoz':
        return [
          { key: 'url', label: 'SigNoz URL', type: 'text', required: true, placeholder: 'http://localhost:3301' },
          { key: 'otlpEndpoint', label: 'OTLP Endpoint', type: 'text', required: false, placeholder: 'http://localhost:4318' },
          { key: 'apiKey', label: 'API Key (optional)', type: 'password', required: false },
          { key: 'serviceName', label: 'Service Name', type: 'text', required: false, placeholder: 'mdm-platform' },
          { key: 'environment', label: 'Environment', type: 'text', required: false, placeholder: 'production' }
        ]
      case 'smtp':
        return [
          { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.gmail.com' },
          { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
          { key: 'user', label: 'Username', type: 'text', required: true },
          { key: 'pass', label: 'Password', type: 'password', required: true },
          { key: 'from', label: 'From Email', type: 'text', required: true, placeholder: 'noreply@example.com' },
          { key: 'secure', label: 'Secure (SSL/TLS)', type: 'select', options: ['true', 'false'], required: true }
        ]
      case 'azure-ad':
        return [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
          { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true }
        ]
      case 'google-auth':
        return [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
        ]
      case 'langfuse':
        return [
          { key: 'publicKey', label: 'Public Key', type: 'text', required: true },
          { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
          { key: 'host', label: 'Host URL', type: 'text', required: false, placeholder: 'https://cloud.langfuse.com' }
        ]
      default:
        return [
          { key: 'url', label: 'URL', type: 'text', required: true },
          { key: 'apiKey', label: 'API Key', type: 'password', required: false }
        ]
    }
  }

  const renderConfigForm = (fields: any[]) => {
    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.key}
                value={configForm[field.key] || ''}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <Select
                value={configForm[field.key] || ''}
                onValueChange={(value) => setConfigForm((prev) => ({ ...prev, [field.key]: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'password' ? (
              <div className="relative">
                <Input
                  id={field.key}
                  type={showPassword[field.key] ? 'text' : 'password'}
                  value={configForm[field.key] || ''}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                >
                  {showPassword[field.key] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            ) : (
              <Input
                id={field.key}
                type={field.type}
                value={configForm[field.key] || ''}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">System Integrations</h3>
            <p className="text-sm text-muted-foreground">
              Configure system-level integrations (single instance per system)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadIntegrations} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const Icon = integration.icon
          return (
            <Card
              key={integration.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {integration.name}
                  </CardTitle>
                  {getStatusIcon(integration.status)}
                </div>
                <CardDescription>
                  {integration.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                  <Badge variant={integration.isConfigured ? 'default' : 'secondary'}>
                    {integration.isConfigured ? 'Configured' : 'Not Configured'}
                  </Badge>
                </div>

                {integration.isConfigured && (
                  <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <Label htmlFor={`enable-${integration.id}`} className="text-sm font-medium">
                      Enable Integration
                    </Label>
                    <Switch
                      id={`enable-${integration.id}`}
                      checked={(integration as any).isEnabled !== false}
                      onCheckedChange={(checked) => handleToggleEnabled(integration, checked)}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleConfigure(integration)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleTestConnection(integration)}
                    disabled={isTesting || !integration.isConfigured}
                  >
                    <Zap className={`h-3 w-3 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedIntegration && renderConfigForm(getConfigFields(selectedIntegration.type))}

            <div className="flex items-center justify-between p-4 bg-muted rounded-md">
              <div>
                <Label htmlFor="enable-integration" className="text-sm font-medium">
                  Enable Integration
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Turn on or off this integration
                </p>
              </div>
              <Switch
                id="enable-integration"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

