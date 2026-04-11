import React from 'react'
import { Plus, X, Check, Paintbrush, GripVertical } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarIcon, Hash, Type as TypeIcon } from 'lucide-react'
import { Attribute } from './chartDataSourceTypes'
import { getAttributeIcon, getTypeBadgeClass, getEffectiveType } from './chartDataSourceUtils'
import { AggregationType } from './ChartDataSourceConfig'
import { ColorInput } from './ColorInput'
import { Z_INDEX } from '@/lib/z-index'

interface AttributeDropZoneProps {
  dimKey: string
  dimLabel: string
  required?: boolean
  isMultiple: boolean
  values: string[]
  singleValue: string
  attributes: Attribute[]
  selectedModelId?: string
  loading: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onAttributeSelect: (dimKey: string, attrName: string) => void
  onDimensionValueChange: (dimKey: string, value: string) => void
  attributeTypeOverrides: Record<string, Record<string, string>>
  onTypeOverride: (dimKey: string, attrName: string, nextType: string) => void
  attributeTypeSettings?: Record<string, any>
  onTypeSettingChange?: (dimKey: string, attrName: string, partial: Record<string, any>) => void
  attributeDisplayNames?: Record<string, string>
  onDisplayNameChange?: (dimKey: string, attrName: string, alias: string) => void
  isValueMetric?: boolean
  attributeAggregations?: Record<string, AggregationType>
  onAggregationChange?: (dimKey: string, attrName: string, aggregation: AggregationType) => void
  dragOverDimensions: Set<string>
  draggingBadge: { dimKey: string; index: number } | null
  dragOverBadge: { dimKey: string; index: number } | null
  onDragStart: (dimKey: string, index: number) => void
  onDragOver: (dimKey: string, index: number) => void
  onDragLeave: () => void
  onDrop: (dimKey: string, fromIndex: number, toIndex: number) => void
  onDragEnd: () => void
  onDragOverZone: (e: React.DragEvent, dimKey: string) => void
  onDragLeaveZone: (e: React.DragEvent, dimKey: string) => void
  onDropZone: (e: React.DragEvent, dimKey: string) => void
  openCombobox: boolean
  onOpenChange: (open: boolean) => void
}

const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
  { value: 'SUM', label: 'Sum' },
  { value: 'AVG', label: 'Avg' },
  { value: 'COUNT', label: 'Count' },
  { value: 'COUNT_DISTINCT', label: 'Count Distinct' },
  { value: 'MIN', label: 'Min' },
  { value: 'MAX', label: 'Max' },
  { value: 'MEDIAN', label: 'Median' },
  { value: 'STDDEV', label: 'Std Dev' },
  { value: 'VARIANCE', label: 'Variance' },
  { value: 'NONE', label: 'None' },
]

function AggregationBadge({
  value,
  onChange,
}: {
  value: AggregationType
  onChange: (v: AggregationType) => void
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  const label = (AGGREGATION_OPTIONS.find(o => o.value === value)?.label || value).toUpperCase()

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && btnRef.current) {
          setPanelWidth(btnRef.current.offsetWidth)
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={btnRef}
          type="button"
          className="inline-flex items-center rounded-[2px] px-1 py-0.5 text-[9px] leading-none text-muted-foreground bg-muted cursor-pointer hover:bg-muted/80"
          title="Change aggregation"
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-1 whitespace-nowrap"
        align="start"
        sideOffset={6}
        style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-0.5">
          {AGGREGATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type Granularity = 'AUTO' | 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' | 'DAY' | 'HOUR' | 'MINUTE' | 'SECOND'
function GranularityBadge({ value, onChange }: { value: Granularity; onChange: (v: Granularity) => void }) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  return (
    <Popover onOpenChange={(open) => { if (open && btnRef.current) setPanelWidth(btnRef.current.offsetWidth) }}>
      <PopoverTrigger asChild>
        <button
          ref={btnRef}
          type="button"
          className="ml-1 inline-flex items-center rounded-[2px] px-1 py-0.5 text-[9px] leading-none text-muted-foreground bg-muted hover:bg-muted/80"
          onClick={(e) => e.stopPropagation()}
          title="Change date granularity"
        >
          {String(value).toUpperCase()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 whitespace-nowrap" align="start" sideOffset={6} style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-0.5">
          {(['AUTO','YEAR','QUARTER','MONTH','WEEK','DAY','HOUR','MINUTE','SECOND'] as Granularity[]).map(opt => (
            <button key={opt} className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground" onClick={() => onChange(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type Bins = 'AUTO' | 'NONE' | 5 | 10 | 20 | 50
function BucketBadge({ value, onChange }: { value: Bins; onChange: (v: Bins) => void }) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  const label = typeof value === 'number' ? `${value} BINS` : value
  return (
    <Popover onOpenChange={(open) => { if (open && btnRef.current) setPanelWidth(btnRef.current.offsetWidth) }}>
      <PopoverTrigger asChild>
        <button
          ref={btnRef}
          type="button"
          className="ml-1 inline-flex items-center rounded-[2px] px-1 py-0.5 text-[9px] leading-none text-muted-foreground bg-muted hover:bg-muted/80"
          onClick={(e) => e.stopPropagation()}
          title="Change number buckets"
        >
          {String(label).toUpperCase()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 whitespace-nowrap" align="start" sideOffset={6} style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-0.5">
          {(['AUTO','NONE',5,10,20,50] as Bins[]).map(opt => (
            <button key={String(opt)} className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground" onClick={() => onChange(opt)}>
              {typeof opt === 'number' ? `${opt} bins` : opt}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AttributeSettingsPopover({
  dimKey,
  attrName,
  currentType,
  isValueMetric,
  currentAggregation,
  typeSettings,
  onTypeChange,
  onAggregationChange,
  onTypeSettingChange,
  children,
}: {
  dimKey: string
  attrName: string
  currentType: string
  isValueMetric: boolean
  currentAggregation?: AggregationType
  typeSettings?: any
  onTypeChange: (t: string) => void
  onAggregationChange?: (agg: AggregationType) => void
  onTypeSettingChange?: (partial: Record<string, any>) => void
  children: React.ReactNode
}) {
  const triggerRef = React.useRef<HTMLDivElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  const openChanged = (open: boolean) => { if (open && triggerRef.current) setPanelWidth(triggerRef.current.offsetWidth) }
  const effSettings = typeSettings || {}
  return (
    <Popover onOpenChange={openChanged}>
      <PopoverTrigger asChild>
        <div ref={triggerRef} onClick={(e) => e.stopPropagation()}>{children}</div>
      </PopoverTrigger>
      <PopoverContent className="p-2 whitespace-nowrap min-w-40" align="start" sideOffset={6} style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-2 text-[11px]">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Display type</span>
            <select
              className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0"
              value={currentType}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              {['text','number','percent','currency','date','datetime','time','boolean','geo','url','email','image','json'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {currentType==='number' && (
            <div className="flex items-center gap-2 justify-between">
              <span className="text-muted-foreground">Format</span>
              <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={effSettings.format || 'auto'} onChange={(e) => onTypeSettingChange && onTypeSettingChange({ format: e.target.value })}>
                <option value="auto">Auto</option>
                <option value="number">Number</option>
                <option value="percent">Percent</option>
                <option value="currency">Currency</option>
              </select>
            </div>
          )}
          {(currentType==='date'||currentType==='datetime'||currentType==='time') && (
            <div className="flex items-center gap-2 justify-between">
              <span className="text-muted-foreground">Granularity</span>
              <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={effSettings.granularity || 'AUTO'} onChange={(e) => onTypeSettingChange && onTypeSettingChange({ granularity: e.target.value })}>
                {(['AUTO','YEAR','QUARTER','MONTH','WEEK','DAY','HOUR','MINUTE','SECOND'] as const).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          )}
          {currentType==='number' && (
            <div className="flex items-center gap-2 justify-between">
              <span className="text-muted-foreground">Running</span>
              <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={effSettings.running || 'none'} onChange={(e) => onTypeSettingChange && onTypeSettingChange({ running: e.target.value })}>
                <option value="none">None</option>
                <option value="running_total">Running total</option>
              </select>
            </div>
          )}
          {currentType==='number' && (
            <div className="flex items-center gap-2 justify-between">
              <span className="text-muted-foreground">Comparison</span>
              <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={effSettings.comparison || 'none'} onChange={(e) => onTypeSettingChange && onTypeSettingChange({ comparison: e.target.value })}>
                <option value="none">None</option>
                <option value="yoy">Year over Year</option>
                <option value="mom">Month over Month</option>
                <option value="wow">Week over Week</option>
              </select>
            </div>
          )}
          {isValueMetric && onAggregationChange && (
            <div className="flex items-center gap-2 justify-between">
              <span className="text-muted-foreground">Aggregation</span>
              <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={currentAggregation || 'SUM'} onChange={(e) => onAggregationChange(e.target.value as AggregationType)}>
                {AGGREGATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function AttributeStylePopover({
  dimKey,
  attrName,
  isValueMetric,
  currentStyle,
  onChange,
  children,
}: {
  dimKey: string
  attrName: string
  isValueMetric: boolean
  currentStyle?: any
  onChange?: (partial: Record<string, any>) => void
  children: React.ReactNode
}) {
  // Helper to determine if text should be light or dark based on background color
  const getTextColor = (hexColor: string): string => {
    if (!hexColor || hexColor === 'transparent') return '#000000'
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#ffffff'
  }

  // Helper to check if color has transparency
  const hasTransparency = (color: string): boolean => {
    if (!color || color === 'transparent') return true
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\([^)]+,\s*([\d.]+)\)/)
      if (match) {
        const alpha = parseFloat(match[1])
        return alpha < 1
      }
    }
    return false
  }

  // Helper to get swatch style with checkerboard background for transparency
  const getSwatchStyle = (color: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      border: 'none',
      outline: 'none',
      backgroundColor: color || '#ffffff'
    }
    
    if (hasTransparency(color)) {
      // Checkerboard pattern for transparency
      baseStyle.backgroundImage = `
        linear-gradient(45deg, #d0d0d0 25%, transparent 25%),
        linear-gradient(-45deg, #d0d0d0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #d0d0d0 75%),
        linear-gradient(-45deg, transparent 75%, #d0d0d0 75%)
      `
      baseStyle.backgroundSize = '8px 8px'
      baseStyle.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px'
      // Keep the actual color as an overlay
      baseStyle.backgroundColor = color
    }
    
    return baseStyle
  }

  const triggerRef = React.useRef<HTMLDivElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  const openChanged = (open: boolean) => { if (open && triggerRef.current) setPanelWidth(triggerRef.current.offsetWidth) }
  const style = currentStyle || {}
  return (
    <Popover onOpenChange={openChanged}>
      <PopoverTrigger asChild>
        <div ref={triggerRef} onClick={(e) => e.stopPropagation()}>{children}</div>
      </PopoverTrigger>
      <PopoverContent className="p-2 whitespace-nowrap min-w-40" align="start" sideOffset={6} style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-2 text-[11px]">
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Wrap text</span>
            <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(style.wrapText ?? 'off')} onChange={(e) => onChange && onChange({ wrapText: e.target.value })}>
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Font size</span>
            <div className="relative w-32">
              <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" min={8} max={32} value={Number(style.fontSize ?? 12)} onChange={(e) => onChange && onChange({ fontSize: parseInt(e.target.value) || 12 })} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Font color</span>
            <ColorInput
              value={style.color || '#111827'}
              onChange={(color) => onChange && onChange({ color })}
              allowImageVideo={false}
            />
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Background</span>
            <div className="flex items-center gap-1">
              <ColorInput
                value={style.background || '#ffffff'}
                onChange={(color) => onChange && onChange({ background: color })}
                allowImageVideo={false}
              />
              <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <input type="checkbox" checked={!!style.useRowBackground} onChange={(e) => onChange && onChange({ useRowBackground: e.target.checked })} /> use row bg
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Badge</span>
            <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(style.badge ?? 'none')} onChange={(e) => onChange && onChange({ badge: e.target.value })}>
              <option value="none">None</option>
              <option value="pill">Pill</option>
              <option value="tag">Tag</option>
            </select>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Link</span>
            <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(style.link ?? 'none')} onChange={(e) => onChange && onChange({ link: e.target.value })}>
              <option value="none">None</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="flex items-center gap-2 justify-between">
            <span className="text-muted-foreground">Clip overflow</span>
            <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(style.clip ?? 'ellipsis')} onChange={(e) => onChange && onChange({ clip: e.target.value })}>
              <option value="ellipsis">Ellipsis</option>
              <option value="clip">Clip</option>
            </select>
          </div>

          {isValueMetric && (
            <>
              <div className="flex items-center gap-2 justify-between">
                <span className="text-muted-foreground">Value viz</span>
                <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(style.valueViz ?? 'none')} onChange={(e) => onChange && onChange({ valueViz: e.target.value })}>
                  <option value="none">None</option>
                  <option value="data_bar">Data bar</option>
                  <option value="color_scale">Color scale</option>
                  <option value="icon_set">Icon set</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <span className="text-muted-foreground">Show number</span>
                <select
                  className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-muted border-0 focus:outline-none focus:ring-0 focus:border-0"
                  value={String(style.valueShowNumber ?? 'on')}
                  onChange={(e) => onChange && onChange({ valueShowNumber: e.target.value === 'on' })}
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <span className="text-muted-foreground">Color</span>
                <ColorInput
                  value={style.valueColor || '#1e40af'}
                  onChange={(color) => onChange && onChange({ valueColor: color })}
                  allowImageVideo={false}
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TypeBadgePopover({
  currentType,
  onSelect,
  Icon,
  triggerTitle,
}: {
  currentType: 'text' | 'number' | 'date' | 'datetime' | 'time' | 'boolean' | 'geo' | 'url' | 'email' | 'image' | 'json' | 'percent' | 'currency'
  onSelect: (t: 'text' | 'number' | 'date' | 'datetime' | 'time' | 'boolean' | 'geo' | 'url' | 'email' | 'image' | 'json' | 'percent' | 'currency') => void
  Icon: React.ComponentType<{ className?: string }>
  triggerTitle: string
}) {
  const btnRef = React.useRef<HTMLButtonElement | null>(null)
  const [panelWidth, setPanelWidth] = React.useState<number | undefined>(undefined)
  return (
    <Popover onOpenChange={(open) => { if (open && btnRef.current) setPanelWidth(btnRef.current.offsetWidth) }}>
      <PopoverTrigger asChild>
        <button
          ref={btnRef}
          type="button"
          className="p-0.5 rounded hover:bg-primary/20"
          title={triggerTitle}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 whitespace-nowrap" align="start" sideOffset={6} style={{ minWidth: panelWidth, width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          {[
            { key: 'text', label: 'Text', Icon: TypeIcon },
            { key: 'number', label: 'Number', Icon: Hash },
            { key: 'percent', label: 'Percent', Icon: Hash },
            { key: 'currency', label: 'Currency', Icon: Hash },
            { key: 'date', label: 'Date', Icon: CalendarIcon },
            { key: 'datetime', label: 'DateTime', Icon: CalendarIcon },
            { key: 'time', label: 'Time', Icon: CalendarIcon },
            { key: 'boolean', label: 'Boolean', Icon: TypeIcon },
            { key: 'geo', label: 'Geography', Icon: TypeIcon },
            { key: 'url', label: 'URL', Icon: TypeIcon },
            { key: 'email', label: 'Email', Icon: TypeIcon },
            { key: 'image', label: 'Image URL', Icon: TypeIcon },
            { key: 'json', label: 'JSON', Icon: TypeIcon },
          ].map(opt => (
            <button
              key={opt.key}
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-xs ${getTypeBadgeClass(opt.key)}`}
              onClick={() => onSelect(opt.key as any)}
            >
              <opt.Icon className="h-3.5 w-3.5" />
              <span>{opt.label}</span>
              {currentType === opt.key && <Check className="ml-auto h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function AttributeDropZone({
  dimKey,
  dimLabel,
  required,
  isMultiple,
  values,
  singleValue,
  attributes,
  selectedModelId,
  loading,
  searchQuery,
  onSearchChange,
  onAttributeSelect,
  onDimensionValueChange,
  attributeTypeOverrides,
  onTypeOverride,
  isValueMetric = false,
  attributeAggregations = {},
  onAggregationChange,
  attributeTypeSettings = {},
  onTypeSettingChange,
  attributeDisplayNames = {},
  onDisplayNameChange,
  dragOverDimensions,
  draggingBadge,
  dragOverBadge,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDragOverZone,
  onDragLeaveZone,
  onDropZone,
  openCombobox,
  onOpenChange,
}: AttributeDropZoneProps) {
  const [editing, setEditing] = React.useState<{ dimKey: string; attrName: string } | null>(null)
  const [tempName, setTempName] = React.useState<string>('')

  const getDisplayLabel = (name: string, attr?: Attribute) => attributeDisplayNames[name] || attr?.display_name || name
  const startEdit = (name: string, currentLabel: string) => { setEditing({ dimKey, attrName: name }); setTempName(currentLabel) }
  const commitEdit = () => { if (editing && tempName.trim() && onDisplayNameChange) { onDisplayNameChange(editing.dimKey, editing.attrName, tempName.trim()) } setEditing(null); setTempName('') }
  const cancelEdit = () => { setEditing(null); setTempName('') }
  const getFilteredAttributes = () => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return attributes
    
    return attributes.filter(attr => 
      (attr.name?.toLowerCase() || '').includes(query) ||
      (attr.display_name?.toLowerCase() || '').includes(query)
    )
  }

  if (isMultiple) {
    return (
      <div className="space-y-2">
        <Popover open={openCombobox} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <div
              className={`min-h-[60px] border-2 border-dashed rounded p-2 transition-colors cursor-pointer hover:bg-muted/50 ${
                dragOverDimensions.has(dimKey)
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const types = Array.from(e.dataTransfer.types)
                if (types.includes('application/json')) {
                  onDragOverZone(e, dimKey)
                }
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDragLeaveZone(e, dimKey)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const data = e.dataTransfer.getData('application/json')
                if (data) {
                  onDropZone(e, dimKey)
                }
              }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-attribute-badge]')) {
                  e.stopPropagation()
                }
              }}
            >
              {values.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {values.map((attrName, badgeIndex) => {
                    const attr = attributes.find(a => a.name === attrName)
                    const effectiveType = getEffectiveType(dimKey, attr, attributeTypeOverrides)
                    const Icon = attr ? getAttributeIcon(effectiveType) : TypeIcon
                    const isDragging = draggingBadge?.dimKey === dimKey && draggingBadge?.index === badgeIndex
                    const isDragOver = dragOverBadge?.dimKey === dimKey && dragOverBadge?.index === badgeIndex
                    return (
                      <div
                        key={`${attrName}-${badgeIndex}`}
                        data-attribute-badge
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', '')
                          onDragStart(dimKey, badgeIndex)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.dataTransfer.dropEffect = 'move'
                          if (!isDragOver) {
                            onDragOver(dimKey, badgeIndex)
                          }
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (isDragOver) {
                            onDragLeave()
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (draggingBadge && draggingBadge.dimKey === dimKey && draggingBadge.index !== badgeIndex) {
                            onDrop(dimKey, draggingBadge.index, badgeIndex)
                          }
                          onDragEnd()
                        }}
                        onDragEnd={onDragEnd}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded text-xs pointer-events-auto cursor-move transition-all w-full ${
                          isDragging ? 'opacity-50 scale-95' : ''
                        } ${
                          isDragOver ? 'ring-2 ring-primary ring-offset-1 bg-primary/20' : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {attr && !isValueMetric && (
                          <AttributeSettingsPopover
                            dimKey={dimKey}
                            attrName={attr.name}
                            currentType={String(effectiveType)}
                            isValueMetric={isValueMetric}
                            currentAggregation={attributeAggregations[attrName]}
                            typeSettings={attributeTypeSettings[attr.name]}
                            onTypeChange={(t) => {
                              if (t === 'percent') {
                                onTypeOverride(dimKey, attr.name, 'number')
                                onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { format: 'percent' })
                              } else if (t === 'currency') {
                                onTypeOverride(dimKey, attr.name, 'number')
                                onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { format: 'currency' })
                              } else {
                                onTypeOverride(dimKey, attr.name, t)
                              }
                            }}
                            onAggregationChange={onAggregationChange ? (agg) => onAggregationChange(dimKey, attr.name, agg) : undefined}
                            onTypeSettingChange={onTypeSettingChange ? (partial) => onTypeSettingChange(dimKey, attr.name, partial) : undefined}
                          >
                            <button
                              type="button"
                              className="p-0.5 rounded hover:bg-primary/20 flex-shrink-0"
                              title="Attribute settings"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Icon className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </AttributeSettingsPopover>
                        )}
                        {isValueMetric && (
                          <AttributeSettingsPopover
                            dimKey={dimKey}
                            attrName={attrName}
                            currentType={String(effectiveType)}
                            isValueMetric={isValueMetric}
                            currentAggregation={attributeAggregations[attrName]}
                            typeSettings={attributeTypeSettings[attrName]}
                            onTypeChange={(t) => {
                              if (attr) {
                                if (t === 'percent') {
                                  onTypeOverride(dimKey, attr.name, 'number')
                                  onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { format: 'percent' })
                                } else if (t === 'currency') {
                                  onTypeOverride(dimKey, attr.name, 'number')
                                  onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { format: 'currency' })
                                } else {
                                  onTypeOverride(dimKey, attr.name, t)
                                }
                              }
                            }}
                            onAggregationChange={onAggregationChange ? (agg) => onAggregationChange(dimKey, attrName, agg) : undefined}
                            onTypeSettingChange={onTypeSettingChange ? (partial) => onTypeSettingChange(dimKey, attrName, partial) : undefined}
                          >
                            <span className="inline-flex items-center rounded-[2px] px-1 py-0.5 text-[9px] leading-none text-muted-foreground bg-muted cursor-pointer hover:bg-muted/80 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                              {String((AGGREGATION_OPTIONS.find(o => o.value === attributeAggregations[attrName])?.label || attributeAggregations[attrName]) || 'SUM').toUpperCase()}
                            </span>
                          </AttributeSettingsPopover>
                        )}
                        {editing && editing.dimKey === dimKey && editing.attrName === attrName ? (
                          <input
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                            className="flex-1 text-[11px] px-1 py-0.5 rounded border outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            className="truncate flex-1"
                            title="Double-click to rename"
                            onDoubleClick={() => startEdit(attrName, getDisplayLabel(attrName, attr))}
                          >
                            {getDisplayLabel(attrName, attr)}
                          </span>
                        )}
                        <AttributeStylePopover
                          dimKey={dimKey}
                          attrName={attrName}
                          isValueMetric={isValueMetric}
                          currentStyle={attributeTypeSettings[attrName]?.style}
                          onChange={(partial) => onTypeSettingChange && onTypeSettingChange(dimKey, attrName, { style: { ...(attributeTypeSettings[attrName]?.style || {}), ...partial } })}
                        >
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-primary/20 flex-shrink-0"
                            title="Cell style"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Paintbrush className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </AttributeStylePopover>
                        {attr && !isValueMetric && ['date','datetime','time'].includes(effectiveType) && (
                          <GranularityBadge
                            value={(attributeTypeSettings[attr.name]?.granularity || 'AUTO') as any}
                            onChange={(v) => onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { granularity: v })}
                          />
                        )}
                        {attr && !isValueMetric && effectiveType === 'number' && (
                          <BucketBadge
                            value={(attributeTypeSettings[attr.name]?.bins || 'AUTO') as any}
                            onChange={(v) => onTypeSettingChange && onTypeSettingChange(dimKey, attr.name, { bins: v })}
                          />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAttributeSelect(dimKey, attrName)
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="ml-0.5 hover:bg-primary/20 rounded p-0.5 transition-colors flex-shrink-0"
                          title="Remove attribute"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
                <Plus className="h-3.5 w-3.5" />
                <span>{selectedModelId ? 'Click anywhere to add attribute or drag here' : 'Select a data model first'}</span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start" style={{ zIndex: Z_INDEX.popover }}>
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-[240px] overflow-y-auto">
              {loading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
              ) : (
                <>
                  {getFilteredAttributes().filter(attr => !values.includes(attr.name)).length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                      {attributes.length === 0 
                        ? (selectedModelId 
                            ? 'No attributes available for this data model' 
                            : 'Please select a data model first')
                        : 'No attributes match your search'}
                    </div>
                  ) : (
                    <div className="p-1">
                      {getFilteredAttributes()
                        .filter(attr => !values.includes(attr.name))
                        .map(attr => {
                          const Icon = getAttributeIcon(attr.type)
                          return (
                            <button
                              key={attr.id}
                              type="button"
                              onClick={() => {
                                onAttributeSelect(dimKey, attr.name)
                                onOpenChange(false)
                                onSearchChange('')
                              }}
                              className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate text-foreground">
                                  {attr.display_name || attr.name}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Popover open={openCombobox} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <div
            className={`min-h-[60px] border-2 border-dashed rounded p-2 transition-colors cursor-pointer hover:bg-muted/50 ${
              dragOverDimensions.has(dimKey)
                ? 'border-primary bg-primary/10'
                : 'border-border'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const types = Array.from(e.dataTransfer.types)
              if (types.includes('application/json')) {
                onDragOverZone(e, dimKey)
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDragLeaveZone(e, dimKey)
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const data = e.dataTransfer.getData('application/json')
              if (data) {
                onDropZone(e, dimKey)
              }
            }}
          >
            {singleValue ? (
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const attr = attributes.find(a => a.name === singleValue)
                  const effectiveType = getEffectiveType(dimKey, attr, attributeTypeOverrides)
                  const Icon = attr ? getAttributeIcon(effectiveType) : TypeIcon
                  return (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded text-xs w-full" data-attribute-badge>
                      {!isValueMetric && (
                        <AttributeSettingsPopover
                          dimKey={dimKey}
                          attrName={attr?.name || singleValue}
                          currentType={String(effectiveType)}
                          isValueMetric={isValueMetric}
                          currentAggregation={attributeAggregations[singleValue]}
                          typeSettings={attributeTypeSettings[singleValue]}
                          onTypeChange={(t) => {
                            const target = attr?.name || singleValue
                            if (t === 'percent') {
                              onTypeOverride(dimKey, target, 'number')
                              onTypeSettingChange && onTypeSettingChange(dimKey, target, { format: 'percent' })
                            } else if (t === 'currency') {
                              onTypeOverride(dimKey, target, 'number')
                              onTypeSettingChange && onTypeSettingChange(dimKey, target, { format: 'currency' })
                            } else {
                              onTypeOverride(dimKey, target, t)
                            }
                          }}
                          onAggregationChange={onAggregationChange ? (agg) => onAggregationChange(dimKey, attr?.name || singleValue, agg) : undefined}
                          onTypeSettingChange={onTypeSettingChange ? (partial) => onTypeSettingChange(dimKey, attr?.name || singleValue, partial) : undefined}
                        >
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-primary/20"
                            title="Attribute settings"
                          >
                            <Icon className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </AttributeSettingsPopover>
                      )}
                      {isValueMetric && (
                        <AttributeSettingsPopover
                          dimKey={dimKey}
                          attrName={singleValue}
                          currentType={String(effectiveType)}
                          isValueMetric={isValueMetric}
                          currentAggregation={attributeAggregations[singleValue]}
                          typeSettings={attributeTypeSettings[singleValue]}
                          onTypeChange={(t) => {
                            if (t === 'percent') {
                              onTypeOverride(dimKey, singleValue, 'number')
                              onTypeSettingChange && onTypeSettingChange(dimKey, singleValue, { format: 'percent' })
                            } else if (t === 'currency') {
                              onTypeOverride(dimKey, singleValue, 'number')
                              onTypeSettingChange && onTypeSettingChange(dimKey, singleValue, { format: 'currency' })
                            } else {
                              onTypeOverride(dimKey, singleValue, t)
                            }
                          }}
                          onAggregationChange={onAggregationChange ? (agg) => onAggregationChange(dimKey, singleValue, agg) : undefined}
                          onTypeSettingChange={onTypeSettingChange ? (partial) => onTypeSettingChange(dimKey, singleValue, partial) : undefined}
                        >
                          <span className="inline-flex items-center rounded-[2px] px-1 py-0.5 text-[9px] leading-none text-muted-foreground bg-muted cursor-pointer hover:bg-muted/80">
                            {String((AGGREGATION_OPTIONS.find(o => o.value === attributeAggregations[singleValue])?.label || attributeAggregations[singleValue]) || 'SUM').toUpperCase()}
                          </span>
                        </AttributeSettingsPopover>
                      )}
                      {editing && editing.dimKey === dimKey && editing.attrName === singleValue ? (
                        <input
                          autoFocus
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                          className="flex-1 text-[11px] px-1 py-0.5 rounded border outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className="truncate flex-1"
                          title="Double-click to rename"
                          onDoubleClick={() => startEdit(singleValue, getDisplayLabel(singleValue, attr))}
                        >
                          {getDisplayLabel(singleValue, attr)}
                        </span>
                      )}
                      <AttributeStylePopover
                        dimKey={dimKey}
                        attrName={singleValue}
                        isValueMetric={isValueMetric}
                        currentStyle={attributeTypeSettings[singleValue]?.style}
                        onChange={(partial) => onTypeSettingChange && onTypeSettingChange(dimKey, singleValue, { style: { ...(attributeTypeSettings[singleValue]?.style || {}), ...partial } })}
                      >
                        <button
                          type="button"
                          className="p-0.5 rounded hover:bg-primary/20"
                          title="Cell style"
                        >
                          <Paintbrush className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </AttributeStylePopover>
                      {!isValueMetric && ['date','datetime','time'].includes(effectiveType) && (
                        <GranularityBadge
                          value={(attributeTypeSettings[singleValue]?.granularity || 'AUTO') as any}
                          onChange={(v) => onTypeSettingChange && onTypeSettingChange(dimKey, singleValue, { granularity: v })}
                        />
                      )}
                      {!isValueMetric && effectiveType === 'number' && (
                        <BucketBadge
                          value={(attributeTypeSettings[singleValue]?.bins || 'AUTO') as any}
                          onChange={(v) => onTypeSettingChange && onTypeSettingChange(dimKey, singleValue, { bins: v })}
                        />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDimensionValueChange(dimKey, '')
                        }}
                        className="ml-0.5 hover:bg-primary/20 rounded p-0.5 transition-colors"
                        title="Remove attribute"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pointer-events-none">
              <Plus className="h-3.5 w-3.5" />
              <span>{selectedModelId ? (singleValue ? 'Click to change attribute or drag here' : 'Click to select attribute or drag here') : 'Select a data model first'}</span>
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start" style={{ zIndex: Z_INDEX.popover }}>
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search attributes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border rounded outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            {loading ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading attributes...</div>
            ) : (
              <>
                {getFilteredAttributes().length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                    {attributes.length === 0 
                      ? (selectedModelId 
                          ? 'No attributes available for this data model' 
                          : 'Please select a data model first')
                      : 'No attributes match your search'}
                  </div>
                ) : (
                  <div className="p-1">
                    {getFilteredAttributes().map(attr => {
                      const Icon = getAttributeIcon(attr.type)
                      return (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => {
                            onDimensionValueChange(dimKey, attr.name)
                            onOpenChange(false)
                            onSearchChange('')
                          }}
                          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-left transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-foreground">
                              {attr.display_name || attr.name}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

