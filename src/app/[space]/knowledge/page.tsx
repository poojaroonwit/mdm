'use client'

import { OutlineKnowledgeBase } from '@/features/plugin-adapters/knowledge-base'
import { useParams } from 'next/navigation'

export default function SpaceKnowledgePage() {
  const params = useParams()
  const spaceId = params?.space as string

  return (
    <div className="h-screen bg-background text-foreground">
      <OutlineKnowledgeBase spaceId={spaceId} />
    </div>
  )
}

