// @ts-nocheck
'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Database, Paintbrush } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { CHART_DIMENSIONS, isValueMetricDimension } from './chartDimensions'
import { AttributeDropZone } from './AttributeDropZone'
import { ColorInput } from './ColorInput'
import { Z_INDEX } from '@/lib/z-index'
import { ChartFilterDialog } from './ChartFilterDialog'

export function ChartDataSourceConfigView(props: any) {
  const {
    loadingModels, selectedModelId, handleModelChange, dataModels, spaceId, widget, chartDims,
    getDimensionValue, setDimensionValue, attributes, loading, searchQueries,
    setSearchQueries, openComboboxes, setOpenComboboxes, dragOverDimensions,
    setDragOverDimensions, draggingBadge, setDraggingBadge, dragOverBadge,
    setDragOverBadge, attributeTypeOverrides, setAttributeTypeOverrides,
    attributeTypeSettings, setTypeSetting, attributeDisplayNames, setDisplayName,
    attributeAggregations, setAttributeAggregations, updateProperty,
    recomputeAndPersistEffectiveTypes, dimensionStyles, setDimensionStyle,
    isFilterDialogOpen, setIsFilterDialogOpen, filters, setFilters,
    handleAttributeSelect, setTypeOverride, handleAggregationChange,
    handleBadgeReorder, handleDragOver, handleDragLeave, handleAttributeDrop,
  } = props
  return (
    <div className="space-y-4 p-4 overflow-visible">
      {/* Data Model Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-2">
          <Database className="h-3.5 w-3.5" />
          Data Model
          {!spaceId && <span className="text-xs text-destructive">(No space ID)</span>}
        </Label>
        {loadingModels ? (
          <div className="text-xs text-muted-foreground py-2">Loading data models...</div>
        ) : dataModels.length === 0 ? (
          <div className="text-xs text-muted-foreground py-2">
            {!spaceId ? (
              <span className="text-destructive">Space ID is required</span>
            ) : (
              "No data models available"
            )}
          </div>
        ) : (
          <Select 
            value={selectedModelId || ''} 
            onValueChange={(value) => {
              console.log('Model selected:', value)
              handleModelChange(value)
            }}
          >
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue placeholder="Select data model" />
            </SelectTrigger>
            <SelectContent 
              position="popper"
              className="max-h-[200px]"
              style={{ zIndex: Z_INDEX.popover }}
            >
              {dataModels.map((model: any) => {
                const modelId = model.id || model._id || String(model)
                const modelName = model.name || model.display_name || String(model)
                return (
                  <SelectItem key={modelId} value={modelId}>
                    {modelName}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        )}
        {!spaceId && (
          <div className="text-xs text-destructive mt-1">Space ID is required to load data models</div>
        )}
      </div>

      {/* Data Limit Control */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Data Limit</Label>
          <Input
            type="number"
            value={widget.properties?.dataLimit || ''}
            onChange={(e) => {
              const value = e.target.value
              updateProperty('dataLimit', value ? parseInt(value) || undefined : undefined)
            }}
            placeholder="No limit"
            className="h-8 text-xs w-32"
            min="1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Maximum number of records to fetch (leave empty for no limit)
        </p>
      </div>
      
      {/* Chart Dimensions */}
      {selectedModelId && (
        <>
          <div className="space-y-3 border-t pt-3">
            <Label className="text-xs font-semibold">Chart Dimensions</Label>
            
            {chartDims.map(dim => {
              // Special handling for dateRange dimension
              if (dim.key === 'dateRange') {
                const dateRangeConfig = (widget.properties?.dateRangeConfig as { attribute?: string; startDate?: string; endDate?: string }) || {}
                const dateAttrs = attributes.filter(a => {
                  const type = getEffectiveType(dim.key, a, attributeTypeOverrides)
                  return type === 'date' || type === 'datetime'
                })
                
                return (
                  <div key={dim.key} className="space-y-2">
                    <Label className="text-xs">
                      {dim.label}
                      {dim.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">Date attribute</Label>
                        <select
                          className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                          value={dateRangeConfig.attribute || ''}
                          onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, attribute: e.target.value })}
                        >
                          <option value="">Select date attribute</option>
                          {dateAttrs.map(attr => (
                            <option key={attr.name} value={attr.name}>{attr.name}</option>
                          ))}
                        </select>
                      </div>
                      {dateRangeConfig.attribute && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Start date</Label>
                            <input
                              type="date"
                              className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                              value={dateRangeConfig.startDate || ''}
                              onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, startDate: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">End date</Label>
                            <input
                              type="date"
                              className="w-full rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0"
                              value={dateRangeConfig.endDate || ''}
                              onChange={(e) => updateProperty('dateRangeConfig', { ...dateRangeConfig, endDate: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              
              const currentValue = getDimensionValue(dim.key)
              const isMultiple = dim.multiple || false
              const values = isMultiple ? (Array.isArray(currentValue) ? currentValue : []) : []
              const singleValue = isMultiple ? '' : (typeof currentValue === 'string' ? currentValue : '')
              
              // Only show painting icon for Row, Column, and Value dimensions
              const showStyleIcon = dim.key === 'rows' || dim.key === 'columns' || dim.key === 'values'
              const dimensionStyle = dimensionStyles[dim.key] || {}
              
              return (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">
                      {dim.label}
                      {dim.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {showStyleIcon && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="p-0 bg-transparent border-0 hover:bg-transparent flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none"
                            style={{ backgroundColor: 'transparent', border: 'none' }}
                            title={`${dim.label} style`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Paintbrush className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="p-2 whitespace-nowrap min-w-40" align="end" sideOffset={6} style={{ width: 'max-content', zIndex: Z_INDEX.popover }} onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col gap-2 text-[11px]">
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Font size</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={8} max={32} value={Number(dimensionStyle.fontSize ?? 12)} onChange={(e) => setDimensionStyle(dim.key, { fontSize: parseInt(e.target.value) || 12 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Font color</span>
                              <ColorInput
                                value={dimensionStyle.fontColor || '#111827'}
                                onChange={(color) => setDimensionStyle(dim.key, { fontColor: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Background</span>
                              <ColorInput
                                value={dimensionStyle.background || '#ffffff'}
                                onChange={(color) => setDimensionStyle(dim.key, { background: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Padding</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={0} max={32} value={Number(dimensionStyle.padding ?? 4)} onChange={(e) => setDimensionStyle(dim.key, { padding: parseInt(e.target.value) || 4 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Border width</span>
                              <div className="relative w-32">
                                <input type="number" className="w-32 rounded-[2px] px-2 py-1 pr-8 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" min={0} max={10} value={Number(dimensionStyle.borderWidth ?? 1)} onChange={(e) => setDimensionStyle(dim.key, { borderWidth: parseInt(e.target.value) || 1 })} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-between">
                              <span className="text-muted-foreground">Border color</span>
                              <ColorInput
                                value={dimensionStyle.borderColor || '#e5e7eb'}
                                onChange={(color) => setDimensionStyle(dim.key, { borderColor: color })}
                                allowImageVideo={false}
                              />
                            </div>
                            {dim.key === 'values' && (
                              <>
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="text-muted-foreground">Text align</span>
                                  <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(dimensionStyle.textAlign ?? 'left')} onChange={(e) => setDimensionStyle(dim.key, { textAlign: e.target.value })}>
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2 justify-between">
                                  <span className="text-muted-foreground">Number format</span>
                                  <select className="w-32 rounded-[2px] px-2 py-1 text-[11px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0" value={String(dimensionStyle.numberFormat ?? 'auto')} onChange={(e) => setDimensionStyle(dim.key, { numberFormat: e.target.value })}>
                                    <option value="auto">Auto</option>
                                    <option value="number">Number</option>
                                    <option value="percent">Percent</option>
                                    <option value="currency">Currency</option>
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  <AttributeDropZone
                    dimKey={dim.key}
                    dimLabel={dim.label}
                    required={dim.required}
                    isMultiple={isMultiple}
                    values={values}
                    singleValue={singleValue}
                    attributes={attributes}
                    selectedModelId={selectedModelId}
                    loading={loading}
                    searchQuery={searchQueries[dim.key] || ''}
                    onSearchChange={(query) => {
                      setSearchQueries(prev => ({ ...prev, [dim.key]: query }))
                    }}
                    onAttributeSelect={handleAttributeSelect}
                    onDimensionValueChange={(dimKey, value) => setDimensionValue(dimKey, value)}
                    attributeTypeOverrides={attributeTypeOverrides}
                    onTypeOverride={setTypeOverride}
                    attributeTypeSettings={attributeTypeSettings[dim.key] || {}}
                    onTypeSettingChange={setTypeSetting}
                    attributeDisplayNames={attributeDisplayNames[dim.key] || {}}
                    onDisplayNameChange={setDisplayName}
                    isValueMetric={isValueMetricDimension(dim.key)}
                    attributeAggregations={attributeAggregations[dim.key] || {}}
                    onAggregationChange={handleAggregationChange}
                    dragOverDimensions={dragOverDimensions}
                    draggingBadge={draggingBadge}
                    dragOverBadge={dragOverBadge}
                    onDragStart={(dimKey, index) => setDraggingBadge({ dimKey, index })}
                    onDragOver={(dimKey, index) => setDragOverBadge({ dimKey, index })}
                    onDragLeave={() => setDragOverBadge(null)}
                    onDrop={handleBadgeReorder}
                    onDragEnd={() => {
                      setDraggingBadge(null)
                      setDragOverBadge(null)
                    }}
                    onDragOverZone={handleDragOver}
                    onDragLeaveZone={handleDragLeave}
                    onDropZone={handleAttributeDrop}
                    openCombobox={openComboboxes[dim.key] || false}
                    onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, [dim.key]: open }))}
                  />
                </div>
              )
            })}
          </div>

  {/* Sorting */}
  <div className="space-y-3 border-t pt-3 mt-2">
    <Label className="text-xs font-semibold">Sorting</Label>
    {(() => {
      // Show ALL attributes from the selected data source (clearer UX)
      const allowedAttrs = attributes
      return (
        <div className="space-y-3">
          {/* Row sort - full row dropzone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Row sort</Label>
              <select
                className="rounded-[2px] px-2 py-1 text-[11px] bg-transparent border-0 focus:outline-none focus:ring-0 focus:border-0"
                value={String(widget.properties?.rowSortOrder || 'ASC')}
                onChange={(e) => updateProperty('rowSortOrder', e.target.value)}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
            <AttributeDropZone
              dimKey={'rowSort'}
              dimLabel={'Row sort'}
              required={false}
              isMultiple={false}
              values={[]}
              singleValue={String((widget.properties?.chartDimensions as Record<string, any>)?.rowSort || '')}
              attributes={allowedAttrs}
              selectedModelId={selectedModelId}
              loading={loading}
              searchQuery={searchQueries['rowSort'] || ''}
              onSearchChange={(query) => setSearchQueries(prev => ({ ...prev, ['rowSort']: query }))}
              onAttributeSelect={(k, name) => setDimensionValue('rowSort', name)}
              onDimensionValueChange={(k, value) => setDimensionValue('rowSort', value)}
              attributeTypeOverrides={{}}
              onTypeOverride={() => {}}
              attributeTypeSettings={{}}
              onTypeSettingChange={() => {}}
              isValueMetric={false}
              attributeAggregations={{}}
              onAggregationChange={() => {}}
              dragOverDimensions={dragOverDimensions}
              draggingBadge={draggingBadge}
              dragOverBadge={dragOverBadge}
              onDragStart={(k,i)=>{}}
              onDragOver={(k,i)=>{}}
              onDragLeave={()=>{}}
              onDrop={()=>{}}
              onDragEnd={()=>{}}
              onDragOverZone={()=>{}}
              onDragLeaveZone={()=>{}}
              onDropZone={()=>{}}
              openCombobox={openComboboxes['rowSort'] || false}
              onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, ['rowSort']: open }))}
            />
          </div>
          {/* Column sort - full row dropzone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Column sort</Label>
              <select
                className="rounded-[2px] px-2 py-1 text-[11px] bg-transparent border-0 focus:outline-none focus:ring-0 focus:border-0"
                value={String(widget.properties?.columnSortOrder || 'ASC')}
                onChange={(e) => updateProperty('columnSortOrder', e.target.value)}
              >
                <option value="ASC">ASC</option>
                <option value="DESC">DESC</option>
              </select>
            </div>
            <AttributeDropZone
              dimKey={'columnSort'}
              dimLabel={'Column sort'}
              required={false}
              isMultiple={false}
              values={[]}
              singleValue={String((widget.properties?.chartDimensions as Record<string, any>)?.columnSort || '')}
              attributes={allowedAttrs}
              selectedModelId={selectedModelId}
              loading={loading}
              searchQuery={searchQueries['columnSort'] || ''}
              onSearchChange={(query) => setSearchQueries(prev => ({ ...prev, ['columnSort']: query }))}
              onAttributeSelect={(k, name) => setDimensionValue('columnSort', name)}
              onDimensionValueChange={(k, value) => setDimensionValue('columnSort', value)}
              attributeTypeOverrides={{}}
              onTypeOverride={() => {}}
              attributeTypeSettings={{}}
              onTypeSettingChange={() => {}}
              isValueMetric={false}
              attributeAggregations={{}}
              onAggregationChange={() => {}}
              dragOverDimensions={dragOverDimensions}
              draggingBadge={draggingBadge}
              dragOverBadge={dragOverBadge}
              onDragStart={(k,i)=>{}}
              onDragOver={(k,i)=>{}}
              onDragLeave={()=>{}}
              onDrop={()=>{}}
              onDragEnd={()=>{}}
              onDragOverZone={()=>{}}
              onDragLeaveZone={()=>{}}
              onDropZone={()=>{}}
              openCombobox={openComboboxes['columnSort'] || false}
              onOpenChange={(open) => setOpenComboboxes(prev => ({ ...prev, ['columnSort']: open }))}
            />
          </div>
        </div>
      )
    })()}
  </div>

  {/* Filters section removed */}

  {/* Totals & Subtotals Configuration */}
      <ChartFilterDialog
        isFilterDialogOpen={isFilterDialogOpen}
        setIsFilterDialogOpen={setIsFilterDialogOpen}
        widget={widget}
        attributes={attributes}
        filters={filters}
        setFilters={setFilters}
        updateProperty={updateProperty}
      />

  {/* Totals & Subtotals Configuration */}
  <div className="space-y-3 border-t pt-3 mt-2">
    <Label className="text-xs font-semibold">Totals & Subtotals</Label>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show row totals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showRowTotals !== false}
          onChange={(e) => updateProperty('showRowTotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show row subtotals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showRowSubtotals !== false}
          onChange={(e) => updateProperty('showRowSubtotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show column totals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showColumnTotals !== false}
          onChange={(e) => updateProperty('showColumnTotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-normal">Show column subtotals</Label>
        <input
          type="checkbox"
          checked={widget.properties?.showColumnSubtotals !== false}
          onChange={(e) => updateProperty('showColumnSubtotals', e.target.checked)}
          className="cursor-pointer"
        />
      </div>
    </div>
  </div>
        </>
      )}
      
      {!selectedModelId && (
        <div className="text-xs text-muted-foreground text-center py-4">
          Select a data model to configure chart dimensions
        </div>
      )}
    </div>
  )
}
