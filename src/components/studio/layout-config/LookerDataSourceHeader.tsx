'use client'

import { Database } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Attribute, DataModel } from './looker-studio-data-source-types'

interface LookerDataSourceHeaderProps {
  dataModels: DataModel[]
  selectedModel?: DataModel
  selectedModelId: string
  attributes: Attribute[]
  onModelChange: (modelId: string) => void
}

export function LookerDataSourceHeader({
  dataModels,
  selectedModel,
  selectedModelId,
  attributes,
  onModelChange,
}: LookerDataSourceHeaderProps) {
  return (
    <div className="p-3 border-b bg-muted/30">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Data Source</Label>
        <Select value={selectedModelId} onValueChange={onModelChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select data model" />
          </SelectTrigger>
          <SelectContent>
            {dataModels.map(model => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5" />
                  <span>{model.display_name || model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedModel && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedModel.description || `${attributes.length} fields available`}
          </p>
        )}
      </div>
    </div>
  )
}

export function LookerDataSourceEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Select a data model to configure</p>
      </div>
    </div>
  )
}
