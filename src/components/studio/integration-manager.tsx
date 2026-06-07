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
  Zap,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  XCircle,
  Key,
  Lock,
  RefreshCw,
  Code,
  Webhook,
  Cloud,
  MessageSquare,
  Calendar,
  Archive,
  Loader,
  Activity,
  CreditCard,
  Users
} from 'lucide-react'
import { IntegrationOverviewTab } from './IntegrationOverviewTab'
import { IntegrationSettingsTab } from './IntegrationSettingsTab'
import { IntegrationStatsCards } from './IntegrationStatsCards'
import type { Integration, IntegrationManagerProps } from './integration-manager-types'

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

      <IntegrationStatsCards integrations={integrations} />

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
        <IntegrationOverviewTab
          integrations={integrations}
          getCategoryIcon={getCategoryIcon}
          onAddIntegration={() => setIsCreatingIntegration(true)}
          onSelectTab={setActiveTab}
        />
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
                          <StatusBadge status={webhook.active ? 'active' : 'inactive'} />
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
      {activeTab === 'settings' && <IntegrationSettingsTab />}
    </div>
  )
}
