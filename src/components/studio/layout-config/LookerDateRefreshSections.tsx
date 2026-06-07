'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { LookerConfigCommonProps } from './looker-studio-data-source-types'
import { LookerConfigSection } from './LookerConfigSection'

export function LookerDateRefreshSections({
  widget,
  attributes,
  expandedSections,
  toggleSection,
  updateProperty,
}: LookerConfigCommonProps) {
  const dateAttributes = attributes.filter(attr => attr.type.toLowerCase().includes('date'))

  return (
    <>
      {dateAttributes.length > 0 && (
        <LookerConfigSection
          title="Date Range"
          section="daterange"
          icon={CalendarIcon}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        >
          <div className="p-2 space-y-2">
            <Select
              value={widget.properties?.dateRangeField || ''}
              onValueChange={(value) => updateProperty('dateRangeField', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select date field" />
              </SelectTrigger>
              <SelectContent>
                {dateAttributes.map(attr => (
                  <SelectItem key={attr.id} value={attr.name}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{attr.display_name || attr.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                        {attr.type || 'date'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={widget.properties?.dateRangeStart || ''}
                  onChange={(event) => updateProperty('dateRangeStart', event.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={widget.properties?.dateRangeEnd || ''}
                  onChange={(event) => updateProperty('dateRangeEnd', event.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </LookerConfigSection>
      )}

      <div className="border rounded-lg">
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Auto Refresh</Label>
            <Switch
              checked={widget.properties?.autoRefresh ?? false}
              onCheckedChange={(checked) => updateProperty('autoRefresh', checked)}
            />
          </div>
          {widget.properties?.autoRefresh && (
            <div>
              <Label className="text-xs">Interval (seconds)</Label>
              <Input
                type="number"
                value={widget.properties?.refreshInterval || 30}
                onChange={(event) => updateProperty('refreshInterval', parseInt(event.target.value) || 30)}
                className="h-7 text-xs"
                min="1"
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
