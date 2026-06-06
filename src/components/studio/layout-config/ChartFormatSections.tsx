'use client'

import { BarChart3, DollarSign, HelpCircle } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { PlacedWidget } from './widgets'

interface ChartFormatSectionProps {
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

interface ChartPieSettingsSectionProps extends ChartFormatSectionProps {
  chartType: string
  isPieDonut: boolean
}

export function ChartNumberFormatSection({
  widget,
  updateProperty,
}: ChartFormatSectionProps) {
  const numberFormatType = widget.properties?.numberFormatType || 'auto'

  return (
    <AccordionItem value="numberFormat" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Number format</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Format type</Label>
            <Select
              value={numberFormatType}
              onValueChange={(value) => updateProperty('numberFormatType', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="scientific">Scientific</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {numberFormatType === 'number' || numberFormatType === 'currency' ? (
            <>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Decimal places</Label>
                <Input
                  type="number"
                  value={widget.properties?.decimalPlaces ?? 2}
                  onChange={(event) => updateProperty('decimalPlaces', parseInt(event.target.value) || 0)}
                  className="h-7 text-xs"
                  min="0"
                  max="10"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Thousands separator</Label>
                  <p className="text-xs text-muted-foreground">Use comma for thousands</p>
                </div>
                <Switch
                  checked={widget.properties?.thousandsSeparator ?? true}
                  onCheckedChange={(checked) => updateProperty('thousandsSeparator', checked)}
                />
              </div>
            </>
          ) : null}
          {numberFormatType === 'currency' ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Currency symbol</Label>
              <Input
                value={widget.properties?.currencySymbol || '$'}
                onChange={(event) => updateProperty('currencySymbol', event.target.value)}
                placeholder="$"
                className="h-7 text-xs"
                maxLength={3}
              />
            </div>
          ) : null}
          {numberFormatType === 'percentage' ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Decimal places</Label>
              <Input
                type="number"
                value={widget.properties?.decimalPlaces ?? 1}
                onChange={(event) => updateProperty('decimalPlaces', parseInt(event.target.value) || 0)}
                className="h-7 text-xs"
                min="0"
                max="10"
              />
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function ChartTooltipSection({
  widget,
  updateProperty,
}: ChartFormatSectionProps) {
  return (
    <AccordionItem value="tooltip" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Tooltip</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Font Size</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={widget.properties?.tooltipFontSize || 12}
                  onChange={(event) => updateProperty('tooltipFontSize', parseInt(event.target.value) || 12)}
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
                value={widget.properties?.tooltipFontFamily || 'Roboto'}
                onValueChange={(value) => updateProperty('tooltipFontFamily', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function ChartPieSettingsSection({
  chartType,
  isPieDonut,
  widget,
  updateProperty,
}: ChartPieSettingsSectionProps) {
  if (!isPieDonut) {
    return null
  }

  return (
    <AccordionItem value="pieSettings" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Pie/Donut chart</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Outer Radius</Label>
            <Input
              type="number"
              value={widget.properties?.pieOuterRadius || 80}
              onChange={(event) => updateProperty('pieOuterRadius', parseInt(event.target.value) || 80)}
              className="h-7 text-xs"
              min="20"
              max="150"
            />
          </div>
          {chartType === 'donut' ? (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Inner Radius</Label>
              <Input
                type="number"
                value={widget.properties?.innerRadius || 40}
                onChange={(event) => updateProperty('innerRadius', parseInt(event.target.value) || 40)}
                className="h-7 text-xs"
                min="0"
                max="90"
              />
            </div>
          ) : null}
          {widget.properties?.showLabels ?? true ? (
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show Label Lines</Label>
                <p className="text-xs text-muted-foreground">Display lines to labels</p>
              </div>
              <Switch
                checked={widget.properties?.showLabelLines ?? false}
                onCheckedChange={(checked) => updateProperty('showLabelLines', checked)}
              />
            </div>
          ) : null}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
