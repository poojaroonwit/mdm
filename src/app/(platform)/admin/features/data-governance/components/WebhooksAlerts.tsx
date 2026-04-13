'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Webhook, 
  Plus,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Bell,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface WebhookConfig {
  id: string
  name: string
  description?: string
  endpoint: string
  eventFilters: string[]
  secretKey?: string
  batchSize?: number
  connectionTimeout?: number
  enabled: boolean
  status?: 'active' | 'inactive' | 'error'
  lastTriggered?: Date
  successCount: number
  failureCount: number
}

export function WebhooksAlerts() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    description: '',
    endpoint: '',
    eventFilters: [] as string[],
    secretKey: '',
    batchSize: 10,
    connectionTimeout: 30,
    enabled: true
  })

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
      toast.error('Failed to load webhooks')
    } finally {
      setIsLoading(false)
    }
  }

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.endpoint) {
      toast.error('Name and endpoint are required')
      return
    }

    try {
      const response = await fetch('/api/admin/data-governance/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook)
      })

      if (response.ok) {
        toast.success('Webhook created')
        setShowCreateDialog(false)
        setNewWebhook({
          name: '',
          description: '',
          endpoint: '',
          eventFilters: [],
          secretKey: '',
          batchSize: 10,
          connectionTimeout: 30,
          enabled: true
        })
        loadWebhooks()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create webhook')
      }
    } catch (error) {
      console.error('Error creating webhook:', error)
      toast.error('Failed to create webhook')
    }
  }

  const testWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/data-governance/webhooks/${id}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Webhook test successful')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Webhook test failed')
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast.error('Failed to test webhook')
    }
  }

  const EVENT_TYPES = [
    'entityCreated',
    'entityUpdated',
    'entityDeleted',
    'entitySoftDeleted',
    'entityRestored',
    'testCaseResult',
    'testSuiteResult',
    'dataInsightReport',
    'taskStatus',
    'changeEvent'
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhooks & Alerts
          </h2>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications from OpenMetadata
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{webhook.name}</CardTitle>
                <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                  {webhook.enabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {webhook.description && (
                <CardDescription>{webhook.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="ml-2 font-mono text-xs">{webhook.endpoint}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Events:</span>
                  <Badge variant="outline">{webhook.eventFilters.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success:</span>
                  <span className="text-green-600">{webhook.successCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Failures:</span>
                  <span className="text-red-600">{webhook.failureCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => testWebhook(webhook.id)}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                  <Switch
                    checked={webhook.enabled}
                    onCheckedChange={(checked) => {
                      // TODO: Implement toggle
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Webhook className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No webhooks configured</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive OpenMetadata events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-name">Webhook Name</Label>
              <Input
                id="webhook-name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="My Webhook"
              />
            </div>
            <div>
              <Label htmlFor="webhook-endpoint">Endpoint URL</Label>
              <Input
                id="webhook-endpoint"
                value={newWebhook.endpoint}
                onChange={(e) => setNewWebhook({ ...newWebhook, endpoint: e.target.value })}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <Label htmlFor="webhook-description">Description</Label>
              <Textarea
                id="webhook-description"
                value={newWebhook.description}
                onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                placeholder="Describe what this webhook is used for"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="webhook-secret">Secret Key (optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={newWebhook.secretKey}
                onChange={(e) => setNewWebhook({ ...newWebhook, secretKey: e.target.value })}
                placeholder="Secret for webhook authentication"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newWebhook.enabled}
                onCheckedChange={(checked) => setNewWebhook({ ...newWebhook, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable Webhook</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createWebhook}>Create Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

