'use client'

import { SpaceSettingsAdmin } from '@/app/admin/features/spaces'
import { useSearchParams } from 'next/navigation'

export default function SpaceSettingsPage() {
  const searchParams = useSearchParams()
  const spaceId = searchParams?.get('spaceId') || undefined

  return (
    <div className="p-6">
      <SpaceSettingsAdmin selectedSpaceId={spaceId} />
    </div>
  )
}

