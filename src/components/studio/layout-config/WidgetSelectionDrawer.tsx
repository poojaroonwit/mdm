'use client'

import React, { useState } from 'react'
import { CentralizedDrawer } from '@/components/ui/centralized-drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Box, X } from 'lucide-react'
import { WidgetsTab } from './widget-selection/WidgetsTab'
import { LayoutGrid, PanelLeft, Shapes, SlidersHorizontal, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'

interface WidgetSelectionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}


export function WidgetSelectionContent({
  onClose,
}: {
  onClose?: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(['all']))

  const categories = [
    { id: 'all', label: 'All', icon: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'charts', label: 'Charts', icon: null },
    { id: 'tables', label: 'Tables', icon: null },
    { id: 'ui', label: 'UI', icon: PanelLeft },
    { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'shapes', label: 'Shapes', icon: Shapes },
  ]

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev)
      if (categoryId === 'all') {
        if (newSet.has('all')) {
          newSet.clear()
          newSet.add('all')
        } else {
          newSet.clear()
          newSet.add('all')
        }
      } else {
        newSet.delete('all')
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId)
          if (newSet.size === 0) {
            newSet.add('all')
          }
        } else {
          newSet.add(categoryId)
        }
      }
      return newSet
    })
  }

  return (
      <div className="flex flex-col h-full bg-transparent">
        {/* Search Bar */}
        <div className="py-4 border-b flex-shrink-0 bg-transparent">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>

        {/* Widgets List with category badges */}
        <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
          <div className="pt-3 pb-2 bg-transparent">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategories.has(category.id)
                return (
                  <Badge
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 px-3 h-7 text-xs font-medium cursor-pointer"
                    )}
                  >
                    {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
                    <span>{category.label}</span>
                  </Badge>
                )
              })}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <WidgetsTab
              searchQuery={searchQuery}
              onClose={onClose || (() => {})}
              selectedCategories={Array.from(selectedCategories)}
            />
          </div>
        </div>
      </div>
  )
}

export function WidgetSelectionDrawer({
  open,
  onOpenChange,
}: WidgetSelectionDrawerProps) {
  return (
    <CentralizedDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Select Widget"
      description="Drag widgets to the canvas to add them"
      width="w-[380px]"
    >
      <WidgetSelectionContent onClose={() => onOpenChange(false)} />
    </CentralizedDrawer>
  )
}
