'use client'

import { Palette } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColorInput } from './ColorInput'

interface ChartSeriesSectionProps {
  chartType: string
  measures: string[]
  seriesStyles: Record<string, any>
  updateProperty: (key: string, value: any) => void
}

export function ChartSeriesSection({
  chartType,
  measures,
  seriesStyles,
  updateProperty,
}: ChartSeriesSectionProps) {
  if (measures.length === 0 || !['bar', 'line', 'area', 'scatter'].includes(chartType)) {
    return null
  }

  const updateSeriesStyle = (measure: string, seriesStyle: Record<string, any>, updates: Record<string, any>) => {
    updateProperty('seriesStyles', {
      ...seriesStyles,
      [measure]: {
        ...seriesStyle,
        ...updates,
      },
    })
  }

  return (
    <AccordionItem value="series" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Series</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          {measures.map((measure, index) => {
            const seriesStyle = seriesStyles[measure] || {}
            return (
              <div key={measure} className="space-y-2 pb-2 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{measure}</Label>
                  <span className="text-xs text-muted-foreground">Series {index + 1}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Color</Label>
                    <ColorInput
                      value={seriesStyle.color || '#0088FE'}
                      onChange={(color) => updateSeriesStyle(measure, seriesStyle, { color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#0088FE"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  {chartType === 'line' ? (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Line width</Label>
                      <Input
                        type="number"
                        value={seriesStyle.strokeWidth || 2}
                        onChange={(event) => updateSeriesStyle(measure, seriesStyle, {
                          strokeWidth: parseInt(event.target.value) || 2,
                        })}
                        className="h-7 text-xs"
                        min="1"
                        max="10"
                      />
                    </div>
                  ) : null}
                  {chartType === 'bar' ? (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Bar size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={seriesStyle.barSize || ''}
                          onChange={(event) => updateSeriesStyle(measure, seriesStyle, {
                            barSize: event.target.value ? parseInt(event.target.value) : undefined,
                          })}
                          placeholder="Auto"
                          className="h-7 text-xs pr-8"
                          min="10"
                          max="100"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                {chartType === 'line' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Show points</Label>
                      <Switch
                        checked={seriesStyle.showDots !== false}
                        onCheckedChange={(checked) => updateSeriesStyle(measure, seriesStyle, { showDots: checked })}
                      />
                    </div>
                    {seriesStyle.showDots !== false ? (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Point size</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={seriesStyle.dotRadius || 4}
                            onChange={(event) => updateSeriesStyle(measure, seriesStyle, {
                              dotRadius: parseInt(event.target.value) || 4,
                            })}
                            className="h-7 text-xs pr-8"
                            min="2"
                            max="12"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {chartType === 'area' ? (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Opacity</Label>
                    <Input
                      type="number"
                      value={seriesStyle.fillOpacity ?? 0.6}
                      onChange={(event) => updateSeriesStyle(measure, seriesStyle, {
                        fillOpacity: parseFloat(event.target.value) || 0.6,
                      })}
                      className="h-7 text-xs"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
