'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSpace } from '@/contexts/space-context'
import { useEffect, useState } from 'react'

interface Space {
  id: string
  name: string
  slug: string
}

interface SpaceSelectorProps {
  value?: string
  onValueChange?: (spaceId: string) => void
  className?: string
  showAllOption?: boolean
}

export function SpaceSelector({ value, onValueChange, className, showAllOption = true }: SpaceSelectorProps) {
  const { spaces, currentSpace } = useSpace()
  const selectedValue = value || (showAllOption ? 'all' : currentSpace?.id || 'all')

  const displayLabel = selectedValue === 'all'
    ? 'All Spaces'
    : spaces.find((s) => s.id === selectedValue)?.name ?? 'Select a space'

  const handleChange = (newSpaceId: string) => {
    onValueChange?.(newSpaceId)
  }

  return (
    <Select value={selectedValue} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a space">{displayLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {showAllOption && (
          <SelectItem value="all">All Spaces</SelectItem>
        )}
        {spaces.map((space) => (
          <SelectItem key={space.id} value={space.id}>
            {space.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

