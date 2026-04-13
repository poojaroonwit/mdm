'use client'

import { useState } from 'react'
import { MinIOManagement } from '@/features/infrastructure/components/MinIOManagement'
import { ServerSelector } from '@/features/infrastructure/components/ServerSelector'

export default function MinIOPage() {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Server Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MinIO Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage MinIO object storage instances
          </p>
        </div>
        <ServerSelector
          serviceType="minio"
          value={selectedInstanceId}
          onValueChange={setSelectedInstanceId}
        />
      </div>

      {/* Management UI */}
      {selectedInstanceId ? (
        <MinIOManagement instanceId={selectedInstanceId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">Please select a server to manage MinIO</p>
          <p className="text-sm">Choose a server from the dropdown above that has MinIO configured</p>
        </div>
      )}
    </div>
  )
}

