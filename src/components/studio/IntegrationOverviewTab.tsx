import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Code, Plus, Webhook } from 'lucide-react'

import type { Integration } from './integration-manager-types'

interface IntegrationOverviewTabProps {
  integrations: Integration[]
  getCategoryIcon: (category: Integration['category']) => ReactNode
  onAddIntegration: () => void
  onSelectTab: (tab: 'integrations' | 'webhooks') => void
}

const categories: Integration['category'][] = [
  'data',
  'communication',
  'analytics',
  'storage',
  'payment',
  'social',
  'productivity'
]

export function IntegrationOverviewTab({
  integrations,
  getCategoryIcon,
  onAddIntegration,
  onSelectTab
}: IntegrationOverviewTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => onSelectTab('integrations')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Code className="h-6 w-6 mb-2" />
              Manage Integrations
            </Button>
            <Button
              variant="outline"
              onClick={() => onSelectTab('webhooks')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Webhook className="h-6 w-6 mb-2" />
              Configure Webhooks
            </Button>
            <Button
              variant="outline"
              onClick={onAddIntegration}
              className="h-20 flex flex-col items-center justify-center"
            >
              <Plus className="h-6 w-6 mb-2" />
              Add Integration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const categoryIntegrations = integrations.filter((integration) => integration.category === category)
              return (
                <div key={category} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(category)}
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
  )
}
