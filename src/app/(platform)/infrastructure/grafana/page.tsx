'use client'

import { useState } from 'react'
import { GrafanaManagement } from '@/features/infrastructure/components/GrafanaManagement'
import { ServerSelector } from '@/features/infrastructure/components/ServerSelector'

export default function GrafanaPage() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Server Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grafana Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Grafana monitoring and visualization instances
          </p>
        </div>
        <ServerSelector
          serviceType="grafana"
          value={selectedInstanceId}
          onValueChange={setSelectedInstanceId}
        />
      </div>

      {/* Management UI */}
      {selectedInstanceId ? (
        <GrafanaManagement instanceId={selectedInstanceId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Please select a server to manage Grafana</p>
          <p className="text-sm">Choose a server from the dropdown above that has Grafana configured</p>
        </div>
      )}
    </div>
  )
}

