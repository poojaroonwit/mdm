import React from 'react'
import { Plus, X, Paintbrush, GripVertical } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Type as TypeIcon } from 'lucide-react'
import { Attribute } from './chartDataSourceTypes'
import { getAttributeIcon, getEffectiveType } from './chartDataSourceUtils'
import { AggregationType } from './ChartDataSourceConfig'
import { AttributeDropZoneList } from './AttributeDropZoneList'
import { AGGREGATION_OPTIONS, AttributeSettingsPopover, AttributeStylePopover, BucketBadge, GranularityBadge } from './AttributeDropZonePopovers'
interface AttributeDropZoneProps {
  dimKey: string; dimLabel: string; required?: boolean
  isMultiple: boolean; values: string[]; singleValue: string
  attributes: Attribute[]; selectedModelId?: string
  loading: boolean; searchQuery: string
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
          <AttributeDropZoneList
            attributes={attributes}
            excludedValues={values}
            loading={loading}
            searchQuery={searchQuery}
            selectedModelId={selectedModelId}
            onSearchChange={onSearchChange}
            onSelect={(attr) => {
              onAttributeSelect(dimKey, attr.name)
              onOpenChange(false)
              onSearchChange('')
            }}
          />
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
        <AttributeDropZoneList
          attributes={attributes}
          loading={loading}
          searchQuery={searchQuery}
          selectedModelId={selectedModelId}
          onSearchChange={onSearchChange}
          onSelect={(attr) => {
            onDimensionValueChange(dimKey, attr.name)
            onOpenChange(false)
            onSearchChange('')
          }}
        />
      </Popover>
    </div>
  )
}
