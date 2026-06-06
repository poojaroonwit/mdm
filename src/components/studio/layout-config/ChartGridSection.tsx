'use client'

import { Grid3x3 } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

interface ChartGridSectionProps {
  hasAxes: boolean
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

export function ChartGridSection({
  hasAxes,
  widget,
  updateProperty,
}: ChartGridSectionProps) {
  if (!hasAxes) {
    return null
  }

  const showGrid = widget.properties?.showGrid ?? true

  return (
    <AccordionItem value="grid" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Grid</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Show gridlines</Label>
              <p className="text-xs text-muted-foreground">Display grid lines on chart</p>
            </div>
            <Switch
              checked={showGrid}
              onCheckedChange={(checked) => updateProperty('showGrid', checked)}
            />
          </div>
          {showGrid ? (
            <>
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Grid color</Label>
                    <ColorInput
                      value={widget.properties?.gridColor || '#f0f0f0'}
                      onChange={(color) => updateProperty('gridColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#f0f0f0"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Dash pattern</Label>
                    <Select
                      value={widget.properties?.gridDash || '3 3'}
                      onValueChange={(value) => updateProperty('gridDash', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0 0">Solid</SelectItem>
                        <SelectItem value="3 3">Dashed (3 3)</SelectItem>
                        <SelectItem value="5 5">Dashed (5 5)</SelectItem>
                        <SelectItem value="2 2">Dashed (2 2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
