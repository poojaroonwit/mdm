'use client'

import type { ReactNode } from 'react'
import { Grid3x3 } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSideInput } from '@/components/shared/MultiSideInput'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

type UpdateProperty = (key: string, value: any) => void
type UpdateProperties = (updates: Record<string, any>) => void

interface ChartTableStyleSectionProps {
  widget: PlacedWidget
  updateProperty: UpdateProperty
  updateProperties: UpdateProperties
}

function toNumericPx(value: any) {
  if (typeof value === 'string' && value.endsWith('px')) {
    return parseInt(value.replace('px', '')) || 0
  }
  return value
}

function sideKey(baseKey: string, side: string) {
  return `${baseKey}${side.charAt(0).toUpperCase() + side.slice(1)}`
}

function cornerKey(baseKey: string, key: string) {
  const suffix = key.replace(baseKey, '')
  return suffix.charAt(0).toLowerCase() + suffix.slice(1)
}

function radiusObject(value: any, fallback = 0) {
  if (typeof value === 'number') {
    return {
      topLeft: { value, unit: 'px' },
      topRight: { value, unit: 'px' },
      bottomRight: { value, unit: 'px' },
      bottomLeft: { value, unit: 'px' },
    }
  }
  return value || {
    topLeft: { value: fallback, unit: 'px' },
    topRight: { value: fallback, unit: 'px' },
    bottomRight: { value: fallback, unit: 'px' },
    bottomLeft: { value: fallback, unit: 'px' },
  }
}

function isUniformRadius(radius: any) {
  return radius.topLeft.value === radius.topRight.value &&
    radius.topRight.value === radius.bottomRight.value &&
    radius.bottomRight.value === radius.bottomLeft.value &&
    radius.topLeft.unit === radius.topRight.unit &&
    radius.topRight.unit === radius.bottomRight.unit &&
    radius.bottomRight.unit === radius.bottomLeft.unit
}

function FieldGroup({ title, children, bordered = true }: { title: string; children: ReactNode; bordered?: boolean }) {
  return (
    <div className={`space-y-2 ${bordered ? 'border-t pt-3' : ''}`}>
      <Label className="text-xs font-semibold">{title}</Label>
      {children}
    </div>
  )
}

function ColorControl({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (color: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <ColorInput
        value={value}
        onChange={onChange}
        allowImageVideo={false}
        className="relative"
        placeholder={placeholder}
        inputClassName="h-7 text-xs pl-7 w-full"
      />
    </div>
  )
}

function NumberControl({
  label,
  value,
  placeholder,
  max,
  onChange,
}: {
  label: string
  value: number | string
  placeholder?: string
  max?: number
  onChange: (value: number | undefined) => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          className="h-7 text-xs pr-8"
          min="0"
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value ? parseInt(event.target.value) : undefined)}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
      </div>
    </div>
  )
}

function ShadowControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">Shadow</Label>
      <Select value={value} onValueChange={onChange}>
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
  )
}

export function ChartTableStyleSection({ widget, updateProperty, updateProperties }: ChartTableStyleSectionProps) {
  if (widget.type !== 'table' && widget.type !== 'pivot-table') return null

  const props = widget.properties || {}
  const getSideValue = (baseKey: string, side: string, defaultValue: number) =>
    props[sideKey(baseKey, side)] !== undefined ? props[sideKey(baseKey, side)] : (props[baseKey] ?? defaultValue)

  const setSideValues = (updates: Record<string, any>) => {
    updateProperties(Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, toNumericPx(value)])))
  }

  const getRadiusValue = (baseKey: string, side: string) => {
    const radius = props[baseKey]
    if (typeof radius === 'number') return radius
    if (typeof radius === 'object' && radius !== null) return (radius as any)[side]?.value ?? 0
    return 0
  }

  const setRadiusValues = (baseKey: string, updates: Record<string, any>) => {
    let nextRadius: any = radiusObject(props[baseKey])

    Object.keys(updates).forEach(key => {
      const value = toNumericPx(updates[key])
      if (key === baseKey) {
        nextRadius = radiusObject(value)
      } else if (key.startsWith(baseKey)) {
        nextRadius[cornerKey(baseKey, key)] = { value, unit: 'px' }
      }
    })

    updateProperty(baseKey, isUniformRadius(nextRadius) ? nextRadius.topLeft.value : nextRadius)
  }

  const sideControl = (label: string, baseKey: string, defaultValue: number) => (
    <MultiSideInput
      label={label}
      baseKey={baseKey}
      type="sides"
      defaultValue={defaultValue}
      inputClassName="h-7 text-xs"
      getValue={(side: string) => getSideValue(baseKey, side, defaultValue)}
      setValue={setSideValues}
    />
  )

  const radiusControl = (label: string, baseKey: string) => (
    <MultiSideInput
      label={label}
      baseKey={baseKey}
      type="corners"
      defaultValue={0}
      inputClassName="h-7 text-xs"
      getValue={(side: string) => getRadiusValue(baseKey, side)}
      setValue={(updates) => setRadiusValues(baseKey, updates)}
    />
  )

  return (
    <AccordionItem value="table-style" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Table style</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-4">
          <FieldGroup title="Header" bordered={false}>
            <div className="grid grid-cols-2 gap-3">
              <ColorControl label="Background" value={props.tableHeaderBg || '#f3f4f6'} placeholder="#f3f4f6" onChange={(color) => updateProperty('tableHeaderBg', color)} />
              <ColorControl label="Text color" value={props.tableHeaderText || '#111827'} placeholder="#111827" onChange={(color) => updateProperty('tableHeaderText', color)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sideControl('Padding', 'tableHeaderPadding', 8)}
              {sideControl('Border width', 'tableHeaderBorderWidth', 1)}
              <ColorControl label="Border color" value={props.tableHeaderBorderColor || '#e5e7eb'} placeholder="#e5e7eb" onChange={(color) => updateProperty('tableHeaderBorderColor', color)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {radiusControl('Border radius', 'tableHeaderBorderRadius')}
              <NumberControl label="Margin" value={props.tableHeaderMargin ?? 0} onChange={(value) => updateProperty('tableHeaderMargin', value || 0)} />
            </div>
          </FieldGroup>

          <FieldGroup title="Row">
            <div className="grid grid-cols-2 gap-3">
              <ColorControl label="Background" value={props.tableRowBg || '#ffffff'} placeholder="#ffffff" onChange={(color) => updateProperty('tableRowBg', color)} />
              <ColorControl label="Text color" value={props.tableRowText || '#111827'} placeholder="#111827" onChange={(color) => updateProperty('tableRowText', color)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sideControl('Padding', 'tableRowPadding', 4)}
              <NumberControl label="Margin" value={props.tableRowMargin ?? 0} onChange={(value) => updateProperty('tableRowMargin', value || 0)} />
              <NumberControl label="Spacing" value={props.tableRowSpacing ?? 0} onChange={(value) => updateProperty('tableRowSpacing', value || 0)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sideControl('Border width', 'tableRowBorderWidth', 1)}
              <ColorControl label="Border color" value={props.tableRowBorderColor || '#e5e7eb'} placeholder="#e5e7eb" onChange={(color) => updateProperty('tableRowBorderColor', color)} />
              {radiusControl('Border radius', 'tableRowBorderRadius')}
            </div>
          </FieldGroup>

          <FieldGroup title="Column">
            <div className="grid grid-cols-2 gap-3">
              <ColorControl label="Background" value={props.tableColumnBg || 'transparent'} placeholder="transparent" onChange={(color) => updateProperty('tableColumnBg', color)} />
              <ColorControl label="Text color" value={props.tableColumnText || '#111827'} placeholder="#111827" onChange={(color) => updateProperty('tableColumnText', color)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sideControl('Padding', 'tableColumnPadding', 4)}
              <NumberControl label="Margin" value={props.tableColumnMargin ?? 0} onChange={(value) => updateProperty('tableColumnMargin', value || 0)} />
              <NumberControl label="Width" placeholder="Auto" max={undefined} value={props.tableColumnWidth || ''} onChange={(value) => updateProperty('tableColumnWidth', value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {sideControl('Border width', 'tableColumnBorderWidth', 1)}
              <ColorControl label="Border color" value={props.tableColumnBorderColor || '#e5e7eb'} placeholder="#e5e7eb" onChange={(color) => updateProperty('tableColumnBorderColor', color)} />
              {radiusControl('Border radius', 'tableColumnBorderRadius')}
            </div>
          </FieldGroup>

          <FieldGroup title="Cell">
            <div className="grid grid-cols-2 gap-3">
              {sideControl('Padding', 'tableCellPadding', 4)}
              {sideControl('Border width', 'tableCellBorderWidth', 1)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorControl label="Border color" value={props.tableCellBorderColor || '#e5e7eb'} placeholder="#e5e7eb" onChange={(color) => updateProperty('tableCellBorderColor', color)} />
              {radiusControl('Border radius', 'tableCellBorderRadius')}
            </div>
          </FieldGroup>

          <FieldGroup title="Table">
            <div className="grid grid-cols-2 gap-3">
              {radiusControl('Border radius', 'tableBorderRadius')}
              <ShadowControl value={props.tableShadow || 'none'} onChange={(value) => updateProperty('tableShadow', value)} />
            </div>
          </FieldGroup>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
