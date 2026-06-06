'use client'

import { MoveVertical } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

interface ChartAxisSectionProps {
  axis: 'x' | 'y'
  hasAxes: boolean
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

const FONT_FAMILY_OPTIONS = ['Roboto', 'Arial', 'Helvetica', 'Times New Roman']

function axisKey(axis: 'x' | 'y', suffix: string) {
  return `${axis}Axis${suffix}`
}

export function ChartAxisSection({
  axis,
  hasAxes,
  widget,
  updateProperty,
}: ChartAxisSectionProps) {
  if (!hasAxes) {
    return null
  }

  const axisLabel = axis.toUpperCase()
  const showProperty = axis === 'x' ? 'showXAxis' : 'showYAxis'
  const isVisible = widget.properties?.[showProperty] ?? true
  const labelKey = axisKey(axis, 'Label')
  const titleFontSizeKey = axisKey(axis, 'TitleFontSize')
  const titleColorKey = axisKey(axis, 'TitleColor')
  const tickColorKey = axisKey(axis, 'TickColor')
  const tickFontSizeKey = axisKey(axis, 'TickFontSize')
  const fontFamilyKey = axisKey(axis, 'FontFamily')

  return (
    <AccordionItem value={`${axis}Axis`} className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 no-underline hover:no-underline w-full">
        <div className="w-full">
          <div className="flex items-center gap-2">
            <MoveVertical className={`h-3.5 w-3.5 text-muted-foreground ${axis === 'x' ? 'rotate-90' : ''}`} />
            <span>{axisLabel}-axis</span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Show</Label>
              <p className="text-xs text-muted-foreground">Display {axisLabel}-axis</p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={(checked) => updateProperty(showProperty, checked)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={widget.properties?.[labelKey] || ''}
              onChange={(event) => updateProperty(labelKey, event.target.value)}
              placeholder={`Enter ${axisLabel}-axis title`}
              className="h-7 text-xs"
            />
          </div>
          {isVisible ? (
            <>
              <Separator />
              <div className="space-y-3 pt-1">
                {axis === 'y' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Min value</Label>
                      <Input
                        type="number"
                        value={widget.properties?.yAxisMin || ''}
                        onChange={(event) => updateProperty('yAxisMin', event.target.value ? parseFloat(event.target.value) : undefined)}
                        placeholder="Auto"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Max value</Label>
                      <Input
                        type="number"
                        value={widget.properties?.yAxisMax || ''}
                        onChange={(event) => updateProperty('yAxisMax', event.target.value ? parseFloat(event.target.value) : undefined)}
                        placeholder="Auto"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Title Font Size</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={widget.properties?.[titleFontSizeKey] || 12}
                      onChange={(event) => updateProperty(titleFontSizeKey, parseInt(event.target.value) || 12)}
                      className="h-7 text-xs pr-8"
                      min="8"
                      max="24"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Title Color</Label>
                    <ColorInput
                      value={widget.properties?.[titleColorKey] || '#111827'}
                      onChange={(color) => updateProperty(titleColorKey, color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Tick Color</Label>
                    <ColorInput
                      value={widget.properties?.[tickColorKey] || '#111827'}
                      onChange={(color) => updateProperty(tickColorKey, color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Tick Font Size</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={widget.properties?.[tickFontSizeKey] || 12}
                        onChange={(event) => updateProperty(tickFontSizeKey, parseInt(event.target.value) || 12)}
                        className="h-7 text-xs pr-8"
                        min="8"
                        max="20"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Family</Label>
                    <Select
                      value={widget.properties?.[fontFamilyKey] || 'Roboto'}
                      onValueChange={(value) => updateProperty(fontFamilyKey, value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILY_OPTIONS.map((font) => (
                          <SelectItem key={font} value={font}>
                            {font}
                          </SelectItem>
                        ))}
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
