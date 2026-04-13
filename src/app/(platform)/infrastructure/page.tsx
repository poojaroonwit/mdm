'use client'

import { InfrastructureOverview } from '@/features/infrastructure'

export default function InfrastructurePage() {
  return (
    <div className="p-6">
      <InfrastructureOverview 
        spaceId={null}
        showSpaceSelector={true}
      />
    </div>
  )
}

