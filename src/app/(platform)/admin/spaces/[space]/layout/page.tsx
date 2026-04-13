'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import LayoutConfig from '@/components/studio/layout-config'

export default function AdminSpaceLayoutStudioPage() {
  const params = useParams() as { space: string }
  const spaceId = params.space

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Layout Studio</h1>
        <p className="text-sm text-muted-foreground">Configure layout for space: {spaceId}</p>
      </div>
      <LayoutConfig spaceId={spaceId} />
    </div>
  )
}


