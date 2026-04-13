'use client'

import { useState } from 'react'
import { KongManagement } from '@/features/infrastructure/components/KongManagement'
import { ServerSelector } from '@/features/infrastructure/components/ServerSelector'

export default function KongPage() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Server Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kong Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage Kong API Gateway instances
          </p>
        </div>
        <ServerSelector
          serviceType="kong"
          value={selectedInstanceId}
          onValueChange={setSelectedInstanceId}
        />
      </div>

      {/* Management UI */}
      {selectedInstanceId ? (
        <KongManagement instanceId={selectedInstanceId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Please select a server to manage Kong</p>
          <p className="text-sm">Choose a server from the dropdown above that has Kong configured</p>
        </div>
      )}
    </div>
  )
}

