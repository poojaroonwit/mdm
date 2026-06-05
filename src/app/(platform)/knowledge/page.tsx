'use client'

import { OutlineKnowledgeBase } from '@/features/plugin-adapters/knowledge-base'

export default function KnowledgePage() {
  return (
    <div className="h-screen bg-background text-foreground">
      <OutlineKnowledgeBase />
    </div>
  )
}

