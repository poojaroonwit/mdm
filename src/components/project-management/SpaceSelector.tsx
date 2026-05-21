'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSpace } from '@/contexts/space-context'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateSpaceDialog } from './CreateSpaceDialog'

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
  allowCreate?: boolean
}

export function SpaceSelector({
  value,
  onValueChange,
  className,
  showAllOption = true,
  allowCreate = true,
}: SpaceSelectorProps) {
  const { spaces, currentSpace } = useSpace()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const selectedValue = value || (showAllOption ? 'all' : currentSpace?.id || 'all')

  const displayLabel = selectedValue === 'all'
    ? 'All Spaces'
    : spaces.find((s) => s.id === selectedValue)?.name ?? 'Select a space'

  const handleChange = (newSpaceId: string) => {
    onValueChange?.(newSpaceId)
  }

  return (
    <>
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
          {allowCreate ? (
            <div className="border-t border-border px-2 py-2">
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full justify-start"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setIsCreateOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Space
              </Button>
            </div>
          ) : null}
        </SelectContent>
      </Select>

      <CreateSpaceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(space) => onValueChange?.(space.id)}
        title="Create Data Management Space"
        description="Create a new space directly from the selector, then keep working without leaving this screen."
      />
    </>
  )
}

