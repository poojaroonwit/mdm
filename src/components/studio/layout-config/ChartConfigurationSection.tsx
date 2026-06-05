'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Grid3x3 } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'
import { ChartAxisSection } from './ChartAxisSection'
import { ChartConditionalFormattingSection } from './ChartConditionalFormattingSection'
import { ChartDataLabelsSection } from './ChartDataLabelsSection'
import {
  ChartNumberFormatSection,
  ChartPieSettingsSection,
  ChartTooltipSection,
} from './ChartFormatSections'
import { ChartGridSection } from './ChartGridSection'
import { ChartLegendSection } from './ChartLegendSection'
import { ChartSeriesSection } from './ChartSeriesSection'
import { ChartStyleSection } from './ChartStyleSection'
import { ChartTitleSection } from './ChartTitleSection'

interface ChartConfigurationSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function ChartConfigurationSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: ChartConfigurationSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  const chartType = widget.properties?.chartType || widget.type.replace('-chart', '')
  const isPieDonut = chartType === 'pie' || chartType === 'donut'
  const isBarLineArea = chartType === 'bar' || chartType === 'line' || chartType === 'area'
  const hasAxes = isBarLineArea || chartType === 'scatter'
  
  // Get measures for series configuration
  const measures = widget.properties?.measures || []
  const seriesStyles = widget.properties?.seriesStyles || {}

  return (
    <>
      <ChartStyleSection
        chartType={chartType}
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartTitleSection
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartSeriesSection
        chartType={chartType}
        measures={measures}
        seriesStyles={seriesStyles}
        updateProperty={updateProperty}
      />

      <ChartLegendSection
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartDataLabelsSection
        chartType={chartType}
        isPieDonut={isPieDonut}
        isBarLineArea={isBarLineArea}
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartGridSection
        hasAxes={hasAxes}
        widget={widget}
        updateProperty={updateProperty}
      />

      {/* Table style */}
      {(widget.type === 'table' || widget.type === 'pivot-table') && (
        <AccordionItem value="table-style" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Table style</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-4">
              {/* Header styling */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Header</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderBg || '#f3f4f6'}
                      onChange={(color) => updateProperty('tableHeaderBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#f3f4f6"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderText || '#111827'}
                      onChange={(color) => updateProperty('tableHeaderText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableHeaderPadding"
                    type="sides"
                    defaultValue={8}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableHeaderPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableHeaderPadding ?? 8
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableHeaderBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableHeaderBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableHeaderBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableHeaderBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableHeaderBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableHeaderBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableHeaderBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableHeaderBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableHeaderBorderRadius')) {
                          const corner = key.replace('tableHeaderBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableHeaderBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableHeaderBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableHeaderMargin ?? 0} onChange={(e) => updateProperty('tableHeaderMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Row</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableRowBg || '#ffffff'}
                      onChange={(color) => updateProperty('tableRowBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableRowText || '#111827'}
                      onChange={(color) => updateProperty('tableRowText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableRowPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableRowPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableRowPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableRowMargin ?? 0} onChange={(e) => updateProperty('tableRowMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Spacing</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableRowSpacing ?? 0} onChange={(e) => updateProperty('tableRowSpacing', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableRowBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableRowBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableRowBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableRowBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableRowBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableRowBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableRowBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableRowBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableRowBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableRowBorderRadius')) {
                          const corner = key.replace('tableRowBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableRowBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableRowBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Column styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Column</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnBg || 'transparent'}
                      onChange={(color) => updateProperty('tableColumnBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="transparent"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnText || '#111827'}
                      onChange={(color) => updateProperty('tableColumnText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableColumnPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableColumnPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableColumnPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableColumnMargin ?? 0} onChange={(e) => updateProperty('tableColumnMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Width</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" placeholder="Auto" value={widget.properties?.tableColumnWidth || ''} onChange={(e) => updateProperty('tableColumnWidth', e.target.value ? parseInt(e.target.value) : undefined)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableColumnBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableColumnBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableColumnBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableColumnBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableColumnBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableColumnBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableColumnBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableColumnBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableColumnBorderRadius')) {
                          const corner = key.replace('tableColumnBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableColumnBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableColumnBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Cell styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Cell</Label>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableCellPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableCellPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableCellPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableCellBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableCellBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableCellBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableCellBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableCellBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableCellBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableCellBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableCellBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableCellBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableCellBorderRadius')) {
                          const corner = key.replace('tableCellBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableCellBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableCellBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Table styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Table</Label>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableBorderRadius')) {
                          const corner = key.replace('tableBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Shadow</Label>
                    <Select value={widget.properties?.tableShadow || 'none'} onValueChange={(v) => updateProperty('tableShadow', v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      <ChartConditionalFormattingSection
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartAxisSection
        axis="x"
        hasAxes={hasAxes}
        widget={widget}
        updateProperty={updateProperty}
      />
      <ChartAxisSection
        axis="y"
        hasAxes={hasAxes}
        widget={widget}
        updateProperty={updateProperty}
      />

      <ChartNumberFormatSection
        widget={widget}
        updateProperty={updateProperty}
      />
      <ChartTooltipSection
        widget={widget}
        updateProperty={updateProperty}
      />
      <ChartPieSettingsSection
        chartType={chartType}
        isPieDonut={isPieDonut}
        widget={widget}
        updateProperty={updateProperty}
      />
    </>
  )
}

