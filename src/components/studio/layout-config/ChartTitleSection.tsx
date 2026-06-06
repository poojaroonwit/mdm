'use client'

import { Type } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

interface ChartTitleSectionProps {
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

const HEADER_ICON_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'donut', label: 'Donut Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'gauge', label: 'Gauge Chart' },
  { value: 'funnel', label: 'Funnel Chart' },
  { value: 'waterfall', label: 'Waterfall Chart' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'bubble', label: 'Bubble Chart' },
  { value: 'combo', label: 'Combo Chart' },
]

export function ChartTitleSection({
  widget,
  updateProperty,
}: ChartTitleSectionProps) {
  const showHeader = widget.properties?.showHeader ?? true

  return (
    <AccordionItem value="title" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Type className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Title</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Show Header</Label>
              <p className="text-xs text-muted-foreground">Display header above chart</p>
            </div>
            <Switch
              checked={showHeader}
              onCheckedChange={(checked) => updateProperty('showHeader', checked)}
            />
          </div>

          {showHeader ? (
            <>
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Title Color</Label>
                    <ColorInput
                      value={widget.properties?.titleColor || '#111827'}
                      onChange={(color) => updateProperty('titleColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Size</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={widget.properties?.titleFontSize || 14}
                        onChange={(event) => updateProperty('titleFontSize', parseInt(event.target.value) || 14)}
                        className="h-7 text-xs pr-8"
                        min="8"
                        max="32"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Header Background</Label>
                  <ColorInput
                    value={widget.properties?.headerBackgroundColor || '#ffffff'}
                    onChange={(color) => updateProperty('headerBackgroundColor', color)}
                    allowImageVideo={false}
                    className="relative"
                    placeholder="#ffffff"
                    inputClassName="h-7 text-xs pl-7 w-full"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Text Alignment</Label>
                  <Select
                    value={widget.properties?.titleAlign || 'left'}
                    onValueChange={(value) => updateProperty('titleAlign', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Header Icon</Label>
                  <Select
                    value={widget.properties?.headerIcon || 'none'}
                    onValueChange={(value) => updateProperty('headerIcon', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEADER_ICON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
