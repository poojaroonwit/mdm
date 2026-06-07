'use client'

import { Calendar as CalendarIcon, ChevronRight, DollarSign, Hash, Search, TrendingUp, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Attribute, DataModel, FieldConfig } from './looker-studio-data-source-types'

interface LookerFieldPickerProps {
  filteredAttributes: Attribute[]
  loadingAttributes: boolean
  searchQuery: string
  selectedModel?: DataModel
  dimensions: FieldConfig[]
  metrics: FieldConfig[]
  onSearchChange: (query: string) => void
  onAddDimension: (attribute: Attribute) => void
  onAddMetric: (attribute: Attribute) => void
  isNumeric: (type: string) => boolean
}

function getAttributeIcon(type: string, isNumeric: (type: string) => boolean): LucideIcon {
  const lowerType = type.toLowerCase()
  if (isNumeric(type)) return Hash
  if (lowerType.includes('date') || lowerType.includes('time')) return CalendarIcon
  if (lowerType.includes('money') || lowerType.includes('currency')) return DollarSign
  return Type
}

export function LookerFieldPicker({
  filteredAttributes,
  loadingAttributes,
  searchQuery,
  selectedModel,
  dimensions,
  metrics,
  onSearchChange,
  onAddDimension,
  onAddMetric,
  isNumeric,
}: LookerFieldPickerProps) {
  return (
    <div className="w-64 border-r flex flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loadingAttributes ? (
            <div className="text-xs text-muted-foreground p-2 text-center">Loading fields...</div>
          ) : filteredAttributes.length === 0 ? (
            <div className="text-xs text-muted-foreground p-2 text-center">
              {searchQuery ? 'No fields found' : 'No fields available'}
            </div>
          ) : (
            filteredAttributes.map(attr => {
              const Icon = getAttributeIcon(attr.type, isNumeric)
              const isDim = dimensions.some(dim => dim.fieldName === attr.name)
              const isMet = metrics.some(metric => metric.fieldName === attr.name)

              return (
                <div
                  key={attr.id}
                  className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer hover:bg-muted transition-colors group ${
                    isDim || isMet ? 'bg-primary/10 border border-primary/30' : ''
                  }`}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/json', JSON.stringify({
                      attribute: attr,
                      model: selectedModel,
                      type: 'attribute',
                    }))
                  }}
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate">{attr.display_name || attr.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                    {attr.type || 'text'}
                  </span>
                  {isDim && <Badge variant="outline" className="h-4 px-1 text-[10px]">Dim</Badge>}
                  {isMet && <Badge variant="outline" className="h-4 px-1 text-[10px]">Met</Badge>}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isDim && !isNumeric(attr.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onAddDimension(attr)}
                        title="Add as dimension"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                    {!isMet && isNumeric(attr.type) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => onAddMetric(attr)}
                        title="Add as metric"
                      >
                        <TrendingUp className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
