import React from 'react'
import { Check, Calendar as CalendarIcon, Hash, Type as TypeIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ColorInput } from './ColorInput'
import { AggregationType } from './ChartDataSourceConfig'
import { getAttributeTypeOptionClass } from './chartDataSourceUtils'
import { Z_INDEX } from '@/lib/z-index'
export const AGGREGATION_OPTIONS: { value: AggregationType; label: string }[] = [
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

export function AggregationBadge({
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

export type Granularity = 'AUTO' | 'YEAR' | 'QUARTER' | 'MONTH' | 'WEEK' | 'DAY' | 'HOUR' | 'MINUTE' | 'SECOND'
export function GranularityBadge({ value, onChange }: { value: Granularity; onChange: (v: Granularity) => void }) {
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

export type Bins = 'AUTO' | 'NONE' | 5 | 10 | 20 | 50
export function BucketBadge({ value, onChange }: { value: Bins; onChange: (v: Bins) => void }) {
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

export function AttributeSettingsPopover({
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

export function AttributeStylePopover({
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

export function TypeBadgePopover({
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
              className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground text-xs ${getAttributeTypeOptionClass(opt.key)}`}
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

