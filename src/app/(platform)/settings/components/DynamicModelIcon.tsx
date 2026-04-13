'use client'

import React, { useState, useEffect } from 'react'

// Helper to dynamically load icon
const loadIcon = async (iconName: string): Promise<React.ComponentType<{ className?: string }> | null> => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || null
  } catch {
    return null
  }
}

export function DynamicModelIcon({ name, className }: { name?: string, className?: string }) {
  const [Icon, setIcon] = useState<React.ComponentType<{ className?: string }> | null>(null)

  useEffect(() => {
    if (name) {
      loadIcon(name).then(setIcon)
    }
  }, [name])

  if (!name || !Icon) return (
    <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded bg-black/10">?</span>
  )

  return <Icon className={className} />
}
