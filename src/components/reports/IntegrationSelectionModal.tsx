'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { 
  Power,
  Activity,
  Eye,
  BarChart3,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react'
import { PowerBIIntegration } from '@/components/reports/integrations/PowerBIIntegration'
import { GrafanaIntegration } from '@/components/reports/integrations/GrafanaIntegration'
import { LookerStudioIntegration } from '@/components/reports/integrations/LookerStudioIntegration'

interface IntegrationSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId?: string
  onSuccess?: () => void
}

// Visualization-related integrations only
const VISUALIZATION_INTEGRATIONS = [
  {
    id: 'power-bi',
    name: 'Power BI',
    type: 'powerbi',
    icon: Power,
    description: 'Microsoft Power BI integration for reports and dashboards',
    component: PowerBIIntegration
  },
  {
    id: 'grafana',
    name: 'Grafana',
    type: 'grafana',
    icon: Activity,
    description: 'Grafana integration for monitoring and visualization',
    component: GrafanaIntegration
  },
  {
    id: 'looker-studio',
    name: 'Looker Studio',
    type: 'looker',
    icon: Eye,
    description: 'Looker Studio integration for analytics and reporting',
    component: LookerStudioIntegration
  }
]

export function IntegrationSelectionModal({ 
  open, 
  onOpenChange, 
  spaceId,
  onSuccess 
}: IntegrationSelectionModalProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      loadIntegrations()
    } else {
      setSelectedIntegration(null)
    }
  }, [open])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/reports/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    }
  }

  const getIntegrationStatus = (type: string) => {
    const integration = integrations.find(i => {
      const sourceMap: Record<string, string> = {
        'powerbi': 'power-bi',
        'grafana': 'grafana',
        'looker': 'looker-studio'
      }
      return i.source === sourceMap[type] || i.source === type
    })
    return integration?.is_configured ? 'configured' : 'not-configured'
  }

  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId)
  }

  const handleConfigSuccess = () => {
    loadIntegrations()
    if (onSuccess) {
      onSuccess()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedIntegration(null)
    }
    onOpenChange(newOpen)
  }

  const selectedIntegrationData = VISUALIZATION_INTEGRATIONS.find(
    i => i.id === selectedIntegration
  )

  if (selectedIntegrationData) {
    const IntegrationComponent = selectedIntegrationData.component
    const Icon = selectedIntegrationData.icon
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  Configure {selectedIntegrationData.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedIntegrationData.description}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIntegration(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <IntegrationComponent
              spaceId={spaceId}
              onSuccess={handleConfigSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Integration</DialogTitle>
          <DialogDescription>
            Choose a visualization integration to configure
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {VISUALIZATION_INTEGRATIONS.map(integration => {
            const Icon = integration.icon
            const status = getIntegrationStatus(integration.type)
            return (
              <Card
                key={integration.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleIntegrationSelect(integration.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {integration.name}
                    </CardTitle>
                    {status === 'configured' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <CardDescription>
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatusBadge status={status === 'configured' ? 'configured' : 'not-configured'} label={status === 'configured' ? 'Configured' : 'Not Configured'} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

