import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Loader, Webhook, XCircle } from 'lucide-react'

import type { Integration } from './integration-manager-types'

interface IntegrationStatsCardsProps {
  integrations: Integration[]
}

export function IntegrationStatsCards({ integrations }: IntegrationStatsCardsProps) {
  const activeCount = integrations.filter((integration) => integration.status === 'active').length
  const errorCount = integrations.filter((integration) => integration.status === 'error').length
  const pendingCount = integrations.filter((integration) => integration.status === 'pending').length
  const webhookCount = integrations.reduce((sum, integration) => sum + integration.webhooks.length, 0)

  const stats = [
    { label: 'Active', value: activeCount, Icon: CheckCircle, className: 'text-primary' },
    { label: 'Errors', value: errorCount, Icon: XCircle, className: 'text-destructive' },
    { label: 'Pending', value: pendingCount, Icon: Loader, className: 'text-warning' },
    { label: 'Webhooks', value: webhookCount, Icon: Webhook, className: 'text-primary' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map(({ label, value, Icon, className }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${className}`} />
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
