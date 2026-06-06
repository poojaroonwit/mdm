'use client'

import { Tag } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { PlacedWidget } from './widgets'

interface ChartDataLabelsSectionProps {
  chartType: string
  isPieDonut: boolean
  isBarLineArea: boolean
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

export function ChartDataLabelsSection({
  chartType,
  isPieDonut,
  isBarLineArea,
  widget,
  updateProperty,
}: ChartDataLabelsSectionProps) {
  if (!isPieDonut && !isBarLineArea) {
    return null
  }

  return (
    <AccordionItem value="dataLabels" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Data labels</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          {isPieDonut ? (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show</Label>
                <p className="text-xs text-muted-foreground">Display values on slices</p>
              </div>
              <Switch
                checked={widget.properties?.showLabels ?? true}
                onCheckedChange={(checked) => updateProperty('showLabels', checked)}
              />
            </div>
          ) : null}
          {chartType === 'donut' ? (
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-medium">Inner Radius (%)</Label>
              <Input
                type="number"
                value={widget.properties?.innerRadius || 50}
                onChange={(event) => updateProperty('innerRadius', parseInt(event.target.value) || 50)}
                className="h-7 text-xs"
                min="0"
                max="90"
              />
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
