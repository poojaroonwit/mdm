'use client'

import { BarChart3 } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PlacedWidget } from './widgets'

interface ChartStyleSectionProps {
  chartType: string
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

const CHART_TYPE_OPTIONS = [
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
  { value: 'bubble', label: 'Bubble Map' },
  { value: 'combo', label: 'Combo Chart' },
]

export function ChartStyleSection({
  chartType,
  widget,
  updateProperty,
}: ChartStyleSectionProps) {
  return (
    <AccordionItem value="chart-style" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Chart style</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Chart type</Label>
            <Select
              value={chartType}
              onValueChange={(value) => updateProperty('chartType', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {chartType === 'bar' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Bar mode</Label>
                <Select
                  value={widget.properties?.barMode || 'grouped'}
                  onValueChange={(value) => updateProperty('barMode', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grouped">Grouped</SelectItem>
                    <SelectItem value="stacked">Stacked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Orientation</Label>
                <Select
                  value={widget.properties?.barOrientation || 'vertical'}
                  onValueChange={(value) => updateProperty('barOrientation', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          {chartType === 'line' || chartType === 'area' ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Curve</Label>
              <Select
                value={widget.properties?.lineCurve || 'monotone'}
                onValueChange={(value) => updateProperty('lineCurve', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monotone">Smooth</SelectItem>
                  <SelectItem value="linear">Straight</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
