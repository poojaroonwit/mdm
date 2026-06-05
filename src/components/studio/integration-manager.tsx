'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plug,
  Database,
  Globe,
  Zap,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  Code,
  Webhook,
  Cloud,
  Server,
  Smartphone,
  Monitor,
  Tablet,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Folder,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Copy,
  Share,
  Link,
  Unlink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  RotateCw,
  Save,
  Loader,
  Activity,
  CreditCard,
  Users
} from 'lucide-react'

interface Integration {
  id: string
  name: string
  type: 'api' | 'database' | 'webhook' | 'oauth' | 'sso' | 'widget' | 'service'
  category: 'data' | 'communication' | 'analytics' | 'storage' | 'payment' | 'social' | 'productivity'
  description: string
  icon: string
  status: 'active' | 'inactive' | 'error' | 'pending'
  configured: boolean
  lastSync?: string
  error?: string
  settings: Record<string, any>
  endpoints: IntegrationEndpoint[]
  webhooks: Webhook[]
  permissions: string[]
  rateLimit?: {
    requests: number
    period: string
  }
}

interface IntegrationEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  description: string
  parameters: EndpointParameter[]
  response: any
  authenticated: boolean
  rateLimited: boolean
}

interface EndpointParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  defaultValue?: any
}

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  lastTriggered?: string
  successCount: number
  errorCount: number
}

interface IntegrationManagerProps {
  integrations: Integration[]
  onCreateIntegration: (integration: Omit<Integration, 'id'>) => void
  onUpdateIntegration: (id: string, updates: Partial<Integration>) => void
  onDeleteIntegration: (id: string) => void
  onTestIntegration: (id: string) => Promise<boolean>
  onSyncIntegration: (id: string) => Promise<void>
  onConfigureIntegration: (id: string, settings: Record<string, any>) => void
  onCreateWebhook: (integrationId: string, webhook: Omit<Webhook, 'id'>) => void
  onUpdateWebhook: (integrationId: string, webhookId: string, updates: Partial<Webhook>) => void
  onDeleteWebhook: (integrationId: string, webhookId: string) => void
  onTestWebhook: (integrationId: string, webhookId: string) => Promise<boolean>
}

export function IntegrationManager({
  integrations,
  onCreateIntegration,
  onUpdateIntegration,
  onDeleteIntegration,
  onTestIntegration,
  onSyncIntegration,
  onConfigureIntegration,
  onCreateWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestWebhook
}: IntegrationManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'webhooks' | 'settings'>('overview')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [isCreatingIntegration, setIsCreatingIntegration] = useState(false)
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'api' as const,
    category: 'data' as const,
    description: '',
    settings: {}
  })
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [''],
    secret: '',
    active: true
  })

  const getStatusIcon = useCallback((status: Integration['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'inactive': return <Pause className="h-4 w-4 text-muted-foreground" />
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />
      case 'pending': return <Loader className="h-4 w-4 text-warning animate-spin" />
    }
  }, [])

  const getTypeIcon = useCallback((type: Integration['type']) => {
    switch (type) {
      case 'api': return <Code className="h-4 w-4" />
      case 'database': return <Database className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'oauth': return <Key className="h-4 w-4" />
      case 'sso': return <Lock className="h-4 w-4" />
      case 'widget': return <Code className="h-4 w-4" />
      case 'service': return <Cloud className="h-4 w-4" />
      default: return <Plug className="h-4 w-4" />
    }
  }, [])

  const getCategoryIcon = useCallback((category: Integration['category']) => {
    switch (category) {
      case 'data': return <Database className="h-4 w-4" />
      case 'communication': return <MessageSquare className="h-4 w-4" />
      case 'analytics': return <Activity className="h-4 w-4" />
      case 'storage': return <Archive className="h-4 w-4" />
      case 'payment': return <CreditCard className="h-4 w-4" />
      case 'social': return <Users className="h-4 w-4" />
      case 'productivity': return <Calendar className="h-4 w-4" />
      default: return <Plug className="h-4 w-4" />
    }
  }, [])

  const handleCreateIntegration = useCallback(() => {
    if (!newIntegration.name) return

    const integration: Omit<Integration, 'id'> = {
      name: newIntegration.name,
      type: newIntegration.type,
      category: newIntegration.category,
      description: newIntegration.description,
      icon: newIntegration.type,
      status: 'pending',
      configured: false,
      settings: newIntegration.settings,
      endpoints: [],
      webhooks: [],
      permissions: []
    }

    onCreateIntegration(integration)
    setIsCreatingIntegration(false)
    setNewIntegration({
      name: '',
      type: 'api',
      category: 'data',
      description: '',
      settings: {}
    })
  }, [newIntegration, onCreateIntegration])

  const handleTestIntegration = useCallback(async (integrationId: string) => {
    setIsTesting(integrationId)
    try {
      await onTestIntegration(integrationId)
    } finally {
      setIsTesting(null)
    }
  }, [onTestIntegration])

  const activeIntegrations = integrations.filter(i => i.status === 'active')
  const errorIntegrations = integrations.filter(i => i.status === 'error')
  const pendingIntegrations = integrations.filter(i => i.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            Integration Manager
          </h2>
          <p className="text-muted-foreground">
            Connect your pages with external services and APIs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('webhooks')}
          >
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setIsCreatingIntegration(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{activeIntegrations.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{errorIntegrations.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Loader className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{pendingIntegrations.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + i.webhooks.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Webhooks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <Plug className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'integrations' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('integrations')}
        >
          <Code className="h-4 w-4 mr-2" />
          Integrations
        </Button>
        <Button
          variant={activeTab === 'webhooks' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('webhooks')}
        >
          <Webhook className="h-4 w-4 mr-2" />
          Webhooks
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Create Integration Dialog */}
      {isCreatingIntegration && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Integration Name</Label>
                <Input
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My API Integration"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value: any) => setNewIntegration(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api">REST API</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                    <SelectItem value="sso">SSO</SelectItem>
                    <SelectItem value="widget">Widget</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={newIntegration.category}
                onValueChange={(value: any) => setNewIntegration(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newIntegration.description}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this integration does..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingIntegration(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIntegration}>
                Create Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('integrations')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Code className="h-6 w-6 mb-2" />
                  Manage Integrations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('webhooks')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Webhook className="h-6 w-6 mb-2" />
                  Configure Webhooks
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingIntegration(true)}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Add Integration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Integration Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['data', 'communication', 'analytics', 'storage', 'payment', 'social', 'productivity'].map(category => {
                  const categoryIntegrations = integrations.filter(i => i.category === category)
                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(category as any)}
                        <span className="font-medium capitalize">{category}</span>
                      </div>
                      <div className="text-2xl font-bold">{categoryIntegrations.length}</div>
                      <div className="text-sm text-muted-foreground">Integrations</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {integrations.map(integration => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(integration.type)}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {integration.name}
                        <StatusBadge status={integration.status} />
                        <Badge variant="outline">
                          {integration.type}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestIntegration(integration.id)}
                      disabled={isTesting === integration.id}
                    >
                      {isTesting === integration.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSyncIntegration(integration.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIntegration(integration)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteIntegration(integration.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Endpoints</div>
                    <div className="text-lg font-semibold">{integration.endpoints.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Webhooks</div>
                    <div className="text-lg font-semibold">{integration.webhooks.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last Sync</div>
                    <div className="text-lg font-semibold">
                      {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Configured</div>
                    <div className="text-lg font-semibold">
                      {integration.configured ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                {integration.error && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Error</span>
                    </div>
                    <p className="text-sm text-destructive mt-1">{integration.error}</p>
                  </div>
                )}

                {integration.rateLimit && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">Rate Limit</span>
                    </div>
                    <p className="text-sm text-primary mt-1">
                      {integration.rateLimit.requests} requests per {integration.rateLimit.period}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          {integrations.map(integration => (
            <Card key={integration.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  {integration.name} Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integration.webhooks.map(webhook => (
                    <div key={webhook.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{webhook.name}</h3>
                          <Badge variant={webhook.active ? 'default' : 'secondary'}>
                            {webhook.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTestWebhook(integration.id, webhook.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateWebhook(integration.id, webhook.id, { active: !webhook.active })}
                          >
                            {webhook.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteWebhook(integration.id, webhook.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        URL: <code className="bg-muted px-1 rounded">{webhook.url}</code>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Events: {webhook.events.join(', ')}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Success: {webhook.successCount}</span>
                        <span>Errors: {webhook.errorCount}</span>
                        <span>Last: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>
                  ))}
                  
                  {integration.webhooks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No webhooks configured for this integration
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Integration Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Global Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-sync Integrations</div>
                      <div className="text-sm text-muted-foreground">Automatically sync data from integrations</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Error Notifications</div>
                      <div className="text-sm text-muted-foreground">Send notifications when integrations fail</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Rate Limit Monitoring</div>
                      <div className="text-sm text-muted-foreground">Monitor and alert on rate limit usage</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">API Key Encryption</div>
                      <div className="text-sm text-muted-foreground">Encrypt stored API keys</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Webhook Signature Validation</div>
                      <div className="text-sm text-muted-foreground">Validate webhook signatures</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">IP Whitelisting</div>
                      <div className="text-sm text-muted-foreground">Restrict access by IP address</div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Monitoring</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Performance Monitoring</div>
                      <div className="text-sm text-muted-foreground">Monitor integration performance</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Usage Analytics</div>
                      <div className="text-sm text-muted-foreground">Track integration usage</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Health Checks</div>
                      <div className="text-sm text-muted-foreground">Regular health checks for integrations</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
