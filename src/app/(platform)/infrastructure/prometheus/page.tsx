'use client'

import { useState } from 'react'
import { PrometheusManagement } from '@/features/infrastructure/components/PrometheusManagement'
import { ServerSelector } from '@/features/infrastructure/components/ServerSelector'

export default function PrometheusPage() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Server Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prometheus Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Prometheus metrics and monitoring instances
          </p>
        </div>
        <ServerSelector
          serviceType="prometheus"
          value={selectedInstanceId}
          onValueChange={setSelectedInstanceId}
        />
      </div>

      {/* Management UI */}
      {selectedInstanceId ? (
        <PrometheusManagement instanceId={selectedInstanceId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Please select a server to manage Prometheus</p>
          <p className="text-sm">Choose a server from the dropdown above that has Prometheus configured</p>
        </div>
      )}
    </div>
  )
}

