'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface LookerConfigSectionProps {
  title: string
  section: string
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  count?: number
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
}

export function LookerConfigSection({
  title,
  section,
  expandedSections,
  toggleSection,
  count,
  icon: Icon,
  action,
  children,
}: LookerConfigSectionProps) {
  const isExpanded = expandedSections.has(section)

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <button onClick={() => toggleSection(section)} className="p-0.5 hover:bg-muted rounded">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {Icon && <Icon className="h-3.5 w-3.5" />}
          <Label className="text-xs font-semibold">{title}</Label>
          {typeof count === 'number' && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {count}
            </Badge>
          )}
        </div>
        {action}
      </div>
      {isExpanded && children}
    </div>
  )
}
