'use client'

import React, { useMemo } from 'react'
import { PlacedWidget, getDefaultWidgetProperties } from './widgets'
import { useDataSource } from './useDataSource'
import { computeWidgetStyle } from './widgetStyles'
import { TextWidget, ImageWidget, VideoWidget, IframeWidget, LinkWidget, ButtonWidget, HtmlWidget, ContainerWidget, EmbedWidget } from './BasicWidgets'
import { RectangleWidget, CircleWidget, TriangleWidget, HexagonWidget, DividerWidget, SpacerWidget, GenericShapeWidget } from './ShapeWidgets'
import { CalendarWidget, MapWidget, CardWidget, ScorecardWidget, TimeSeriesWidget } from './MiscWidgets'
import { FilterWidget } from './FilterWidgets'
import { TableWidgetRenderer } from './TableWidgetRenderer'
import { ChartWidgetRenderer } from './ChartWidgetRenderer'

interface WidgetRendererProps {
  widget: PlacedWidget
  isMobile?: boolean
  spaceId?: string
}

export const WidgetRenderer = React.memo(function WidgetRenderer({ widget, isMobile = false, spaceId }: WidgetRendererProps) {
  const props = useMemo(
    () => ({
      ...getDefaultWidgetProperties(widget.type),
      ...(widget.properties || {}),
    }),
    [widget.type, widget.properties]
  )
  // Dynamically load Google Font if a custom Google font is specified
  React.useEffect(() => {
    const family = String(props.googleFontFamily || '')
    const useCustom = String(props.fontFamily) === '__custom_google__' && family.trim().length > 0
    if (!useCustom) return
    const encoded = family.trim().replace(/\s+/g, '+')
    // Request selected weight and a few common ones to avoid flashes when changing weight
    const weights = String(props.fontWeight || '400')
    const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights};400;500;600;700&display=swap`
    // Avoid duplicate link tags
    const id = `gf-${encoded}`
    if (!document.getElementById(id)) {
      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }
  }, [props.fontFamily, props.googleFontFamily, props.fontWeight])

  
  // Debug: Log when properties change (remove in production)
  // console.log('WidgetRenderer props:', props)
  
  // Use data source hook for API/database/data-model sources
  // Only enable auto-refresh if explicitly set and refreshInterval > 0
  const shouldAutoRefresh = props.autoRefresh === true && props.refreshInterval && props.refreshInterval > 0
  
  const { data: fetchedData, loading: dataLoading, error: dataError } = useDataSource({
    dataSource: props.dataSource || 'sample',
    apiUrl: props.apiUrl,
    apiMethod: props.apiMethod || 'GET',
    apiHeaders: props.apiHeaders || '{}',
    sqlQuery: props.sqlQuery,
    dbConnection: props.dbConnection,
    dataModelId: props.dataModelId,
    spaceId: spaceId,
    sampleData: props.sampleData || [],
    autoRefresh: shouldAutoRefresh, // Only true if explicitly enabled
    refreshInterval: props.refreshInterval || 0,
    limit: props.dataLimit && props.dataLimit > 0 ? props.dataLimit : undefined
  })
  
  // Determine which data to use
  const chartData = useMemo(() => {
    if (props.dataSource === 'sample') {
      return props.sampleData || []
    }
    return fetchedData
  }, [props.dataSource, props.sampleData, fetchedData])
  
  // Compute widget style using extracted utility
  const style = computeWidgetStyle(props)

  // Basic Widgets
  if (widget.type === 'text') {
    return <TextWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'image') {
    return <ImageWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'video') {
    return <VideoWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'iframe') {
    return <IframeWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'link') {
    return <LinkWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'button') {
    return <ButtonWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'html') {
    return <HtmlWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'container') {
    return <ContainerWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'embed') {
    return <EmbedWidget props={{ ...props, widget }} style={style} />
  }

  // Shape Widgets
  if (widget.type === 'rectangle') {
    return <RectangleWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'circle') {
    return <CircleWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'triangle') {
    return <TriangleWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'hexagon') {
    return <HexagonWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'divider') {
    return <DividerWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'spacer') {
    return <SpacerWidget props={{ ...props, widget }} style={style} />
  }
  if (widget.type === 'shape') {
    return <GenericShapeWidget props={{ ...props, widget }} style={style} />
  }

  // Table Widget
  if (widget.type === 'table' || widget.type === 'pivot-table') {
    return (
      <TableWidgetRenderer
        widget={widget}
        props={props}
        style={style}
        chartData={chartData}
        dataLoading={dataLoading}
        dataError={dataError}
      />
    )
  }

  // Misc Widgets
  if (widget.type === 'calendar') {
    return <CalendarWidget props={{ ...props, widget, isMobile }} style={style} />
  }
  if (widget.type === 'map') {
    return <MapWidget props={{ ...props, widget, isMobile }} style={style} />
  }
  if (widget.type === 'time-series') {
    const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
    let dimensions: string[] = []
    let measures: string[] = []
    
    if (chartDimensions && typeof chartDimensions === 'object') {
      // Time series typically has time/date on x-axis and values on y-axis
      const timeAttr = chartDimensions.time || chartDimensions.x || chartDimensions.date
      const valueAttrs = chartDimensions.values || chartDimensions.y || []
      
      if (timeAttr) {
        dimensions.push(...(Array.isArray(timeAttr) ? timeAttr : [timeAttr]))
      }
      
      if (Array.isArray(valueAttrs)) {
        measures.push(...valueAttrs.filter(v => v))
      } else if (valueAttrs) {
        measures.push(valueAttrs)
      }
    }
    
    return (
      <TimeSeriesWidget
        props={{ ...props, widget, isMobile }}
        style={style}
        chartData={chartData}
        dimensions={dimensions}
        measures={measures}
      />
    )
  }
  if (widget.type === 'card') {
    return <CardWidget props={{ ...props, widget, isMobile }} style={style} />
  }
  if (widget.type === 'scorecard') {
    return <ScorecardWidget props={{ ...props, widget, isMobile }} style={style} />
  }

  // Filter Widgets
  if (widget.type.includes('filter')) {
    return <FilterWidget props={{ ...props, widget }} style={style} />
  }

  // Chart Widgets
  if (widget.type.includes('chart')) {
    return (
      <ChartWidgetRenderer
        widget={widget}
        props={props}
        style={style}
        chartData={chartData}
        dataLoading={dataLoading}
        dataError={dataError}
        isMobile={isMobile}
      />
    )
  }

  // Default fallback
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      <div className="text-xs text-muted-foreground text-center">
        {widget.type}
      </div>
    </div>
  )
})
