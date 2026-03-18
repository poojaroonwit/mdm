'use client'

import { useState } from 'react'
import { InstanceService } from '../types'
import { PluginDefinition } from '@/features/marketplace/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

export interface ManagementPluginSelectorProps {
  service: InstanceService
  plugins: PluginDefinition[]
  onAssign: (pluginId: string) => Promise<void>
}

export function ManagementPluginSelector({
  service,
  plugins,
  onAssign,
}: ManagementPluginSelectorProps) {
  const [assigning, setAssigning] = useState<string | null>(null)

  const handleAssign = async (pluginId: string) => {
    setAssigning(pluginId)
    try {
      await onAssign(pluginId)
    } finally {
      setAssigning(null)
    }
  }

  const compatiblePlugins = plugins.filter((plugin) => {
    // Filter plugins that are compatible with this service type
    const serviceType = plugin.capabilities?.serviceType
    return !serviceType || serviceType === service.type
  })

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Available Management Plugins</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select a plugin to manage this {service.type} service
        </p>
      </div>

      {compatiblePlugins.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No compatible management plugins found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compatiblePlugins.map((plugin) => (
            <Card
              key={plugin.id}
              className={`${service.managementPluginId === plugin.id ? 'border-primary' : ''} ${plugin.isCompliance || plugin.securityAudit ? 'card-compliance' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  {service.managementPluginId === plugin.id && (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Assigned
                    </Badge>
                  )}
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{plugin.category}</Badge>
                  <Button
                    size="sm"
                    variant={service.managementPluginId === plugin.id ? 'outline' : 'default'}
                    onClick={() => handleAssign(plugin.id)}
                    disabled={assigning === plugin.id || service.managementPluginId === plugin.id}
                  >
                    {assigning === plugin.id
                      ? 'Assigning...'
                      : service.managementPluginId === plugin.id
                      ? 'Assigned'
                      : 'Assign'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

