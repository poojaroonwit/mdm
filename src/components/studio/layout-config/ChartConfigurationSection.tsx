'use client'

import React from 'react'
import { PlacedWidget } from './widgets'
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
import { ChartTableStyleSection } from './ChartTableStyleSection'
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

  const updateProperties = (updates: Record<string, any>) => {
    setPlacedWidgets(prev => prev.map(w =>
      w.id === selectedWidgetId
        ? { ...w, properties: { ...w.properties, ...updates } }
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
      <ChartTableStyleSection
        widget={widget}
        updateProperty={updateProperty}
        updateProperties={updateProperties}
      />

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

