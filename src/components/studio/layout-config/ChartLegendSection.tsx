'use client'

import { Eye } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

interface ChartLegendSectionProps {
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

const FONT_FAMILY_OPTIONS = ['Roboto', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana']

export function ChartLegendSection({
  widget,
  updateProperty,
}: ChartLegendSectionProps) {
  const showLegend = widget.properties?.showLegend ?? true

  return (
    <AccordionItem value="legend" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Legend</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Show</Label>
              <p className="text-xs text-muted-foreground">Display chart legend</p>
            </div>
            <Switch
              checked={showLegend}
              onCheckedChange={(checked) => updateProperty('showLegend', checked)}
            />
          </div>
          {showLegend ? (
            <>
              <Separator />
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Position</Label>
                  <Select
                    value={widget.properties?.legendPosition || 'bottom'}
                    onValueChange={(value) => updateProperty('legendPosition', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Size</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={widget.properties?.legendFontSize || 12}
                        onChange={(event) => updateProperty('legendFontSize', parseInt(event.target.value) || 12)}
                        className="h-7 text-xs pr-8"
                        min="8"
                        max="24"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Color</Label>
                    <ColorInput
                      value={widget.properties?.legendColor || '#111827'}
                      onChange={(color) => updateProperty('legendColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Font Family</Label>
                  <Select
                    value={widget.properties?.legendFontFamily || 'Roboto'}
                    onValueChange={(value) => updateProperty('legendFontFamily', value)}
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
            </>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
