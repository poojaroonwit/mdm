export interface Integration {
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

export interface IntegrationEndpoint {
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

export interface EndpointParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  defaultValue?: any
}

export interface Webhook {
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

export interface IntegrationManagerProps {
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
