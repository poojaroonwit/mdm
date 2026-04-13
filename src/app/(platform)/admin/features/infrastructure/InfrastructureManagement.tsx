'use client'

import { InfrastructureOverview } from '@/features/infrastructure'

export function InfrastructureManagement() {
  return (
    <div className="p-6">
      <InfrastructureOverview 
        spaceId={null}
        showSpaceSelector={true}
      />
    </div>
  )
}

