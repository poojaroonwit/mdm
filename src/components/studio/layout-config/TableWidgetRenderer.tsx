import React from 'react'
import { Table as TableIcon, Loader2, BarChart3, Star, Home, Settings as SettingsIcon, BarChart3 as BarChart3Icon, LineChart, AreaChart } from 'lucide-react'
import { pivotTableData, getPivotCellValue, getPivotConfig } from './tablePivotUtils'
import { applyAggregations, getAggregationConfig } from './dataAggregationUtils'
import { AggregationType, FilterGroup, FilterCondition } from './ChartDataSourceConfig'

interface TableWidgetRendererProps {
  widget: {
    type: string
    width?: number
    height?: number
  }
  props: any
  style: React.CSSProperties
  chartData: any[]
  dataLoading: boolean
  dataError: string | null
}

export function TableWidgetRenderer({ widget, props, style, chartData, dataLoading, dataError }: TableWidgetRendererProps) {
  const showHeader = props.showHeader !== false
  const stripedRows = props.stripedRows || false
  
  // Extract dimensions from chartDimensions configuration
  const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
  
  // Get pivot configuration
  const pivotConfig = getPivotConfig(chartDimensions, widget.type)
  const { columnAttrs, rowAttrs, valueAttrs } = pivotConfig
  
  // Determine if we need to pivot (when columns dimension has attributes)
  const shouldPivot = columnAttrs.length > 0
  const hasRows = rowAttrs.length > 0
  const hasValues = valueAttrs.length > 0
  const typeSettings = (props.chartDimensionTypeSettings || {}) as Record<string, Record<string, any>>
  const displayNames = (props.chartDimensionDisplayNames || {}) as Record<string, Record<string, string>>

  // Helper to get display name for an attribute
  const getDisplayName = (attrName: string, dimKey?: string): string => {
    if (dimKey && displayNames[dimKey] && displayNames[dimKey][attrName]) {
      return displayNames[dimKey][attrName]
    }
    // Search all dimensions
    for (const key of Object.keys(displayNames)) {
      if (displayNames[key] && displayNames[key][attrName]) {
        return displayNames[key][attrName]
      }
    }
    return attrName
  }

  // Calculate min/max per attribute for proper scaling (best practice: scale per column)
  const calculateMinMax = (data: any[], attrNames: string[]): Record<string, { min: number; max: number }> => {
    const result: Record<string, { min: number; max: number }> = {}
    attrNames.forEach(attr => {
      const nums = data
        .map(row => {
          const val = row[attr]
          const n = typeof val === 'number' ? val : parseFloat(String(val))
          return isFinite(n) ? n : null
        })
        .filter((n): n is number => n !== null)
      if (nums.length > 0) {
        result[attr] = { min: Math.min(...nums), max: Math.max(...nums) }
      }
    })
    return result
  }

  const getAttrStyleConfig = (attrName: string, isValue: boolean): any => {
    // Prefer settings from the dimension where the attribute is placed
    const sources: string[] = isValue ? ['values', 'rows', 'columns'] : ['rows', 'columns', 'values']
    for (const key of sources) {
      const s = (typeSettings[key] && typeSettings[key][attrName] && typeSettings[key][attrName].style) || undefined
      if (s) return s
    }
    return {}
  }

  // Get dimension-level styles (applies to all attributes in that dimension)
  const getDimensionStyle = (dimKey: 'rows' | 'columns' | 'values'): any => {
    return (props.chartDimensionStyles && props.chartDimensionStyles[dimKey]) || {}
  }

  // Evaluate conditional formatting rules and return matching rule
  const evaluateConditionalFormatting = (cellValue: any, attrName: string, rowData: any, allRowData: any[]): any => {
    const rules = (props.conditionalFormattingRules || []) as any[]
    if (!rules.length) return null

    for (const rule of rules) {
      if (!rule.attribute || rule.attribute !== attrName) continue

      let matches = false
      const value = cellValue
      const ruleValue = rule.value
      const ruleValue2 = rule.value2

      switch (rule.condition) {
        case 'equals':
          matches = String(value) === String(ruleValue)
          break
        case 'not_equals':
          matches = String(value) !== String(ruleValue)
          break
        case 'greater_than':
          matches = Number(value) > Number(ruleValue)
          break
        case 'less_than':
          matches = Number(value) < Number(ruleValue)
          break
        case 'greater_or_equal':
          matches = Number(value) >= Number(ruleValue)
          break
        case 'less_or_equal':
          matches = Number(value) <= Number(ruleValue)
          break
        case 'between':
          matches = Number(value) >= Number(ruleValue) && Number(value) <= Number(ruleValue2 || ruleValue)
          break
        case 'contains':
          matches = String(value || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())
          break
        case 'not_contains':
          matches = !String(value || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())
          break
        case 'is_empty':
          matches = value === null || value === undefined || value === ''
          break
        case 'is_not_empty':
          matches = value !== null && value !== undefined && value !== ''
          break
        default:
          matches = false
      }

      if (matches) {
        return rule
      }
    }

    return null
  }

  // Helper to format numbers in table cells based on attribute type settings
  const formatCellNumber = (num: number | string, attrName: string, isValueCell: boolean): string => {
    if (typeof num === 'string') {
      const parsed = parseFloat(num)
      if (isNaN(parsed)) return num
      num = parsed
    }
    if (!isFinite(num)) return String(num)
    
    // Get attribute type settings
    const sources: string[] = isValueCell ? ['values', 'rows', 'columns'] : ['rows', 'columns', 'values']
    for (const key of sources) {
      const settings = (typeSettings[key] && typeSettings[key][attrName]) || undefined
      if (settings) {
        // Check for percent format
        if (settings.format === 'percent') {
          const decimals = 2
          return `${(num * 100).toFixed(decimals)}%`
        }
        // Check for currency format
        if (settings.format === 'currency') {
          const decimals = 2
          const symbol = '$'
          const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          return `${symbol}${formatted}`
        }
      }
    }
    
    // Check dimension-level number format
    const dimKey = isValueCell ? 'values' : 'rows'
    const dimStyle = getDimensionStyle(dimKey)
    if (dimStyle.numberFormat === 'percent') {
      const decimals = 2
      return `${(num * 100).toFixed(decimals)}%`
    }
    if (dimStyle.numberFormat === 'currency') {
      const decimals = 2
      const symbol = '$'
      const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return `${symbol}${formatted}`
    }
    
    // Default: format with thousands separator if large number
    if (Math.abs(num) >= 1000) {
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    return String(num)
  }

  const renderCellContent = (rawValue: any, attrName: string, isValueCell: boolean, minMax?: { min: number; max: number }, rowData?: any, allRowData?: any[]) => {
    const styleCfg = getAttrStyleConfig(attrName, isValueCell)
    const value = rawValue
    const isEmpty = value === undefined || value === null || value === ''

    // Handle empty values
    if (isEmpty) {
      return <span className="text-muted-foreground/50">—</span>
    }

    // Format number if it's a numeric value
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    const isNumeric = isFinite(num)
    const strValue = isNumeric ? formatCellNumber(num, attrName, isValueCell) : String(value)
    
    // Check conditional formatting
    const condRule = allRowData ? evaluateConditionalFormatting(value, attrName, rowData || {}, allRowData) : null
    
    // Auto-detect links if link mode is enabled
    let textEl: React.ReactNode = strValue
    if (styleCfg.link === 'url' || (styleCfg.link === 'none' && /^https?:\/\//i.test(strValue))) {
      textEl = <a href={strValue} target="_blank" rel="noreferrer" className="text-primary hover:underline">{strValue}</a>
    } else if (styleCfg.link === 'email' || (styleCfg.link === 'none' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue))) {
      textEl = <a href={`mailto:${strValue}`} className="text-primary hover:underline">{strValue}</a>
    }

    // Badge styling
    if (styleCfg.badge && styleCfg.badge !== 'none') {
      const badgeClass = styleCfg.badge === 'pill' ? 'rounded-full' : 'rounded-[2px]'
      const bgColor = styleCfg.background || (styleCfg.badge === 'pill' ? '#e5e7eb' : '#f3f4f6')
      const textColor = styleCfg.color || '#111827'
      textEl = (
        <span className={`inline-flex items-center ${badgeClass} px-2 py-0.5 text-[10px] font-medium`}
          style={{ background: bgColor, color: textColor }}
        >{strValue}</span>
      )
    }

    // Value visualizations (best practice: scale per column using min/max)
    if (isValueCell && styleCfg.valueViz && styleCfg.valueViz !== 'none') {
      const num = Number(value)
      const isValidNum = isFinite(num)
      const color = styleCfg.valueColor || '#1e40af'
      const showNumber = styleCfg.valueShowNumber !== false
      
      if (isValidNum && minMax && minMax.min !== undefined && minMax.max !== undefined) {
        const range = minMax.max - minMax.min
        const pct = range > 0 ? Math.min(100, Math.max(0, ((num - minMax.min) / range) * 100)) : 50
        
        // Data bar (best practice: horizontal bar in cell)
        if (styleCfg.valueViz === 'data_bar') {
          return (
            <div className="relative w-full flex items-center gap-2">
              <div className="flex-1 h-4 bg-muted rounded-[2px] overflow-hidden">
                <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: color }} />
              </div>
              {showNumber && <span className="text-xs font-medium">{textEl}</span>}
            </div>
          )
        }
        
        // Color scale (best practice: gradient background)
        if (styleCfg.valueViz === 'color_scale') {
          const intensity = pct / 100
          // Handle both hex and rgba colors
          let r = 59, g = 130, b = 246 // default blue
          if (color.startsWith('#')) {
            const hex = color.replace('#', '')
            r = parseInt(hex.substring(0, 2), 16)
            g = parseInt(hex.substring(2, 4), 16)
            b = parseInt(hex.substring(4, 6), 16)
          } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g)
            if (match && match.length >= 3) {
              r = parseInt(match[0])
              g = parseInt(match[1])
              b = parseInt(match[2])
            }
          }
          const bgColor = `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.3})`
          return (
            <div className="w-full rounded-[2px] px-2 py-1" style={{ background: bgColor }}>
              {showNumber ? textEl : null}
            </div>
          )
        }
        
        // Icon set (best practice: thresholds-based icons)
        if (styleCfg.valueViz === 'icon_set') {
          const isGood = pct >= 70
          const isWarning = pct >= 30 && pct < 70
          const isBad = pct < 30
          const icon = isGood ? '▲' : isBad ? '▼' : '●'
          const iconColor = isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b'
          return (
            <span className="inline-flex items-center gap-1.5">
              <span style={{ color: iconColor, fontSize: 12, lineHeight: 1 }}>{icon}</span>
              {showNumber ? <span>{textEl}</span> : null}
            </span>
          )
        }
      }
    }

    // Apply conditional formatting text color if rule matches
    if (condRule && condRule.textColor) {
      textEl = <span style={{ color: condRule.textColor }}>{textEl}</span>
    }

    return textEl
  }
  
  // Show loading state
  if (dataLoading && props.dataSource !== 'sample') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <Loader2 className="h-8 w-8 mb-2 text-muted-foreground animate-spin" />
        <div className="text-xs text-muted-foreground text-center">
          Loading data...
        </div>
      </div>
    )
  }
  
  // Show error state
  if (dataError && props.dataSource !== 'sample') {
    return (
      <div className="w-full h-full p-3 flex flex-col items-center justify-center" style={style}>
        <BarChart3 className="h-8 w-8 mb-2 text-destructive" />
        <div className="text-xs text-destructive text-center font-medium">
          Data Error
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1 px-2">
          {dataError}
        </div>
      </div>
    )
  }
  
  // Debug: Log current state to help diagnose issues
  if (process.env.NODE_ENV === 'development') {
    console.log('[Table Widget Debug]', {
      widgetType: widget.type,
      chartDimensions,
      columnAttrs,
      rowAttrs,
      valueAttrs,
      shouldPivot,
      chartDataLength: chartData?.length,
      hasChartData: !!chartData,
      dataSource: props.dataSource,
      dataModelId: props.dataModelId
    })
  }
  
  // Check if we have any configured attributes
  const hasAnyAttrs = columnAttrs.length > 0 || rowAttrs.length > 0 || valueAttrs.length > 0
  
  if (hasAnyAttrs && chartData && Array.isArray(chartData) && chartData.length > 0) {
    // Apply aggregations according to configuration
    let processedData = chartData
    try {
      const aggregations = (props.chartDimensionAggregations || {}) as Record<string, Record<string, AggregationType>>
      const dimensionKeys = shouldPivot ? ['rows', 'columns'] : ['rows']
      const measureKeys = ['values']
      const aggConfig = getAggregationConfig(
        (chartDimensions || {}) as Record<string, string | string[]>,
        aggregations,
        dimensionKeys,
        measureKeys
      )
      processedData = applyAggregations(chartData, aggConfig)
    } catch (err) {
      console.error('Table aggregation failed, falling back to raw data:', err)
      processedData = chartData
    }

    // Filter data to only include rows with selected attributes
    let filteredData = processedData.filter((row: any) => {
      if (!row || typeof row !== 'object') return false
      // Check if row has at least one of the selected attributes
      const allAttrs = [...columnAttrs, ...rowAttrs, ...valueAttrs]
      return allAttrs.some(attr => row[attr] !== undefined)
    })

    // Apply date range filter if configured
    const dateRangeConfig = (props.dateRangeConfig as { attribute?: string; startDate?: string; endDate?: string }) || null
    if (dateRangeConfig && dateRangeConfig.attribute && (dateRangeConfig.startDate || dateRangeConfig.endDate)) {
      const dateAttr = dateRangeConfig.attribute
      filteredData = filteredData.filter((row: any) => {
        const dateValue = row[dateAttr]
        if (dateValue === null || dateValue === undefined) return false
        
        // Parse date value (support multiple formats)
        let rowDate: Date | null = null
        if (dateValue instanceof Date) {
          rowDate = dateValue
        } else if (typeof dateValue === 'string') {
          rowDate = new Date(dateValue)
        } else if (typeof dateValue === 'number') {
          rowDate = new Date(dateValue)
        }
        
        if (!rowDate || isNaN(rowDate.getTime())) return false
        
        // Check start date
        if (dateRangeConfig.startDate) {
          const startDate = new Date(dateRangeConfig.startDate)
          startDate.setHours(0, 0, 0, 0)
          rowDate.setHours(0, 0, 0, 0)
          if (rowDate < startDate) return false
        }
        
        // Check end date
        if (dateRangeConfig.endDate) {
          const endDate = new Date(dateRangeConfig.endDate)
          endDate.setHours(23, 59, 59, 999)
          const rowDateEnd = new Date(rowDate)
          rowDateEnd.setHours(23, 59, 59, 999)
          if (rowDateEnd > endDate) return false
        }
        
        return true
      })
    }

    // Apply row filters if configured
    const rowFilters = (props.rowFilters as FilterGroup) || null
    if (rowFilters) {
      const evaluateCondition = (condition: FilterCondition, row: any): boolean => {
        const value = row[condition.attribute]
        const condValue = condition.value
        const numValue = typeof value === 'number' ? value : parseFloat(String(value))
        const numCond = parseFloat(condValue)
        
        switch (condition.operator) {
          case 'equals':
            return String(value) === condValue
          case 'not_equals':
            return String(value) !== condValue
          case 'contains':
            return String(value || '').toLowerCase().includes(condValue.toLowerCase())
          case 'not_contains':
            return !String(value || '').toLowerCase().includes(condValue.toLowerCase())
          case 'starts_with':
            return String(value || '').toLowerCase().startsWith(condValue.toLowerCase())
          case 'ends_with':
            return String(value || '').toLowerCase().endsWith(condValue.toLowerCase())
          case 'greater_than':
            return isFinite(numValue) && isFinite(numCond) && numValue > numCond
          case 'less_than':
            return isFinite(numValue) && isFinite(numCond) && numValue < numCond
          case 'greater_or_equal':
            return isFinite(numValue) && isFinite(numCond) && numValue >= numCond
          case 'less_or_equal':
            return isFinite(numValue) && isFinite(numCond) && numValue <= numCond
          case 'is_null':
            return value === null || value === undefined || value === ''
          case 'is_not_null':
            return value !== null && value !== undefined && value !== ''
          default:
            return true
        }
      }

      const evaluateGroup = (group: FilterGroup, row: any): boolean => {
        if (group.items.length === 0) return true
        
        const results = group.items.map(item => {
          if (item.type === 'condition') {
            return evaluateCondition(item, row)
          } else {
            return evaluateGroup(item, row)
          }
        })
        
        if (group.logic === 'AND') {
          return results.every(r => r)
        } else {
          return results.some(r => r)
        }
      }

      filteredData = filteredData.filter((row: any) => evaluateGroup(rowFilters, row))
    }

    // Calculate min/max for value attributes (for proper scaling)
    const valueMinMax = valueAttrs.length > 0 ? calculateMinMax(filteredData, valueAttrs) : {}

    // Apply sorting based on chartDimensions.rowSort / columnSort and order props
    try {
      const dimsObj = (chartDimensions || {}) as Record<string, any>
      const rowSortAttr = String(dimsObj.rowSort || '')
      const rowSortOrder = String(props.rowSortOrder || 'ASC').toUpperCase()
      const columnSortAttr = String(dimsObj.columnSort || '')
      const columnSortOrder = String(props.columnSortOrder || 'ASC').toUpperCase()

      const compare = (a: any, b: any, order: string) => {
        if (a == null && b == null) return 0
        if (a == null) return order === 'ASC' ? -1 : 1
        if (b == null) return order === 'ASC' ? 1 : -1
        if (a < b) return order === 'ASC' ? -1 : 1
        if (a > b) return order === 'ASC' ? 1 : -1
        return 0
      }

      if (!shouldPivot && rowSortAttr) {
        filteredData = [...filteredData].sort((r1, r2) => compare(r1[rowSortAttr], r2[rowSortAttr], rowSortOrder))
      }
    } catch (e) {
      console.warn('Sorting skipped due to error:', e)
    }
    
    if (filteredData.length > 0) {
      // Pivot the data if columns are configured
      if (shouldPivot) {
        let { pivotedData, columnHeaders } = pivotTableData(filteredData, pivotConfig)
        
        // Calculate min/max for pivoted value attributes
        const pivotValueMinMax: Record<string, { min: number; max: number }> = {}
        if (valueAttrs.length > 0 && pivotedData.length > 0) {
          valueAttrs.forEach(valueAttr => {
            const nums: number[] = []
            pivotedData.forEach((rowData: any) => {
              columnHeaders.forEach((header: string) => {
                const val = getPivotCellValue(rowData, header, valueAttr, rowAttrs, columnAttrs, hasValues)
                const n = typeof val === 'number' ? val : parseFloat(String(val))
                if (isFinite(n)) nums.push(n)
              })
            })
            if (nums.length > 0) {
              pivotValueMinMax[valueAttr] = { min: Math.min(...nums), max: Math.max(...nums) }
            }
          })
        }

        // Apply row/column sorting in pivot context
        try {
          const dimsObj = (chartDimensions || {}) as Record<string, any>
          const rowSortAttr = String(dimsObj.rowSort || '')
          const rowSortOrder = String(props.rowSortOrder || 'ASC').toUpperCase()
          const columnSortAttr = String(dimsObj.columnSort || '')
          const columnSortOrder = String(props.columnSortOrder || 'ASC').toUpperCase()

          const compare = (a: any, b: any, order: string) => {
            if (a == null && b == null) return 0
            if (a == null) return order === 'ASC' ? -1 : 1
            if (b == null) return order === 'ASC' ? 1 : -1
            if (a < b) return order === 'ASC' ? -1 : 1
            if (a > b) return order === 'ASC' ? 1 : -1
            return 0
          }

          if (rowSortAttr && rowAttrs.includes(rowSortAttr)) {
            pivotedData = [...pivotedData].sort((r1: any, r2: any) => compare(r1.__rowValues?.[rowSortAttr], r2.__rowValues?.[rowSortAttr], rowSortOrder))
          }
          if (columnSortAttr) {
            columnHeaders = [...columnHeaders].sort((c1, c2) => compare(c1, c2, columnSortOrder))
          }
        } catch {}
        
        if (pivotedData.length > 0 && columnHeaders.length > 0) {
          return (
            <div className="w-full h-full flex flex-col" style={style}>
              {(props.showElementHeaderBar ?? false) && (
                <div
                  className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
                  style={{
                    background: props.headerBackgroundColor || 'transparent',
                    justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {props.headerIcon && props.headerIcon !== 'none' && (() => {
                    const iconSize = 14
                    const iconColor = props.titleColor || style.color || '#111827'
                    const map: Record<string, React.ReactNode> = {
                      star: <Star size={iconSize} style={{ color: iconColor }} />,
                      home: <Home size={iconSize} style={{ color: iconColor }} />,
                      settings: <SettingsIcon size={iconSize} style={{ color: iconColor }} />,
                      table: <TableIcon size={iconSize} style={{ color: iconColor }} />,
                      bar: <BarChart3Icon size={iconSize} style={{ color: iconColor }} />,
                      line: <LineChart size={iconSize} style={{ color: iconColor }} />,
                      area: <AreaChart size={iconSize} style={{ color: iconColor }} />, 
                    }
                    return map[String(props.headerIcon).toLowerCase()] || null
                  })()}
                  <div
                    className="truncate"
                    style={{
                      fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
                      color: props.titleColor || style.color,
                      fontWeight: props.titleFontWeight || 600,
                    }}
                  >
                    {props.title || ''}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto p-2">
              <table className="w-full" style={{
                borderCollapse: 'separate',
                borderSpacing: `0 ${Number(props.tableRowSpacing ?? 0)}px`,
                boxShadow: props.tableShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' : props.tableShadow === 'md' ? '0 4px 8px rgba(0,0,0,0.12)' : props.tableShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.15)' : undefined,
                borderRadius: props.tableBorderRadius ? `${props.tableBorderRadius}px` : undefined,
                overflow: 'hidden',
              }}>
                {showHeader && (
                  <thead>
                    <tr>
                      {/* Row attribute columns first */}
                      {rowAttrs.map((attr, i) => {
                        const dimStyle = getDimensionStyle('rows')
                        return (
                          <th 
                            key={`row-${i}`}
                            className="text-xs font-semibold text-left"
                            style={{
                              borderWidth: `${Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                              borderStyle: (Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                              borderColor: props.tableHeaderBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                              background: props.tableHeaderBg || dimStyle.background || undefined,
                              color: props.tableHeaderText || dimStyle.fontColor || undefined,
                              padding: `${Number(props.tableHeaderPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                              margin: `${Number(props.tableHeaderMargin ?? 0)}px`,
                              borderRadius: `${Number(props.tableHeaderBorderRadius ?? 0)}px`,
                              fontSize: dimStyle.fontSize ? `${dimStyle.fontSize}px` : undefined,
                              textAlign: dimStyle.textAlign || undefined,
                            }}
                          >
                            {getDisplayName(attr, 'rows')}
                          </th>
                        )
                      })}
                      {/* Pivoted column headers from column attributes */}
                      {columnHeaders.map((header, i) => {
                        const dimStyle = getDimensionStyle('columns')
                        return (
                          <th 
                            key={`col-${i}`}
                            className="text-xs font-semibold text-left"
                            style={{
                              borderWidth: `${Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                              borderStyle: (Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                              borderColor: props.tableHeaderBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                              background: props.tableHeaderBg || dimStyle.background || undefined,
                              color: props.tableHeaderText || dimStyle.fontColor || undefined,
                              padding: `${Number(props.tableHeaderPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                              margin: `${Number(props.tableHeaderMargin ?? 0)}px`,
                              borderRadius: `${Number(props.tableHeaderBorderRadius ?? 0)}px`,
                              fontSize: dimStyle.fontSize ? `${dimStyle.fontSize}px` : undefined,
                              textAlign: dimStyle.textAlign || undefined,
                            }}
                          >
                            {header}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {pivotedData.map((rowData: any, rowIdx: number) => (
                    <tr 
                      key={rowIdx}
                      className={stripedRows && rowIdx % 2 === 1 ? '' : ''}
                      style={{
                        background: props.tableRowBg || undefined,
                        color: props.tableRowText || undefined,
                      }}
                    >
                      {/* Row attribute values */}
                      {rowAttrs.map((attr, i) => {
                        const styleCfg = getAttrStyleConfig(attr, false)
                        const dimStyle = getDimensionStyle('rows')
                        const condRule = evaluateConditionalFormatting(rowData.__rowValues?.[attr], attr, rowData, pivotedData)
                        return (
                          <td 
                            key={`row-cell-${i}`}
                            className="text-xs"
                            style={{
                              borderWidth: `${Number(props.tableRowBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                              borderStyle: (Number(props.tableRowBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                              borderColor: props.tableRowBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                              padding: `${Number(props.tableRowPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                              borderRadius: `${Number(props.tableRowBorderRadius ?? props.tableCellBorderRadius ?? 0)}px`,
                              whiteSpace: styleCfg.wrapText === 'on' ? 'normal' : 'nowrap',
                              textOverflow: styleCfg.clip === 'ellipsis' ? 'ellipsis' : 'clip',
                              overflow: 'hidden',
                              color: condRule?.textColor || styleCfg.color || dimStyle.fontColor || undefined,
                              fontSize: styleCfg.fontSize || dimStyle.fontSize ? `${styleCfg.fontSize || dimStyle.fontSize}px` : undefined,
                              background: condRule?.backgroundColor || (styleCfg.useRowBackground ? undefined : (styleCfg.background || dimStyle.background || undefined)),
                              textAlign: dimStyle.textAlign || undefined,
                            }}
                          >
                            {renderCellContent(rowData.__rowValues?.[attr], attr, false, undefined, rowData, pivotedData)}
                          </td>
                        )
                      })}
                      {/* Pivoted column cells */}
                      {columnHeaders.map((header, i) => {
                        const dimStyle = getDimensionStyle('values')
                        return (
                          <td 
                            key={`pivot-cell-${i}`}
                            className="text-xs"
                            style={{
                              borderWidth: `${Number(props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                              borderStyle: (Number(props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                              borderColor: props.tableColumnBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                              background: props.tableColumnBg || dimStyle.background || undefined,
                              color: props.tableColumnText || dimStyle.fontColor || undefined,
                              padding: `${Number(props.tableColumnPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                              width: props.tableColumnWidth ? `${props.tableColumnWidth}px` : undefined,
                              borderRadius: `${Number(props.tableColumnBorderRadius ?? props.tableCellBorderRadius ?? 0)}px`,
                              fontSize: dimStyle.fontSize ? `${dimStyle.fontSize}px` : undefined,
                              textAlign: dimStyle.textAlign || undefined,
                              whiteSpace: valueAttrs.some(v => getAttrStyleConfig(v, true).wrapText === 'on') ? 'normal' : 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {hasValues && valueAttrs.length > 0
                              ? valueAttrs.map(valueAttr => {
                                  const cellVal = getPivotCellValue(rowData, header, valueAttr, rowAttrs, columnAttrs, hasValues)
                                  const condRule = evaluateConditionalFormatting(cellVal, valueAttr, rowData, pivotedData)
                                  const style = condRule ? { background: condRule.backgroundColor, color: condRule.textColor } : {}
                                  return <div key={valueAttr} style={style}>{renderCellContent(cellVal, valueAttr, true, pivotValueMinMax[valueAttr], rowData, pivotedData)}</div>
                                }).filter(Boolean)
                              : renderCellContent(getPivotCellValue(rowData, header, undefined, rowAttrs, columnAttrs, hasValues), header, false, undefined, rowData, pivotedData)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )
        }
      } else {
        // Non-pivoted table: show all attributes as columns
        const allAttrs = [...rowAttrs, ...valueAttrs].filter(Boolean)
        if (allAttrs.length > 0) {
          return (
            <div className="w-full h-full flex flex-col" style={style}>
              {(props.showElementHeaderBar ?? false) && (
                <div
                  className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
                  style={{
                    background: props.headerBackgroundColor || 'transparent',
                    justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    className="truncate"
                    style={{
                      fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
                      color: props.titleColor || style.color,
                      fontWeight: props.titleFontWeight || 600,
                    }}
                  >
                    {props.title || ''}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto p-2">
              <table className="w-full" style={{
                borderCollapse: 'separate',
                borderSpacing: `0 ${Number(props.tableRowSpacing ?? 0)}px`,
                boxShadow: props.tableShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' : props.tableShadow === 'md' ? '0 4px 8px rgba(0,0,0,0.12)' : props.tableShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.15)' : undefined,
                borderRadius: props.tableBorderRadius ? `${props.tableBorderRadius}px` : undefined,
                overflow: 'hidden',
              }}>
                {showHeader && (
                  <thead>
                    <tr>
                      {allAttrs.map((attr, i) => {
                        const isValueAttr = valueAttrs.includes(attr)
                        const dimStyle = isValueAttr ? getDimensionStyle('values') : getDimensionStyle('rows')
                        return (
                          <th 
                            key={i}
                            className="text-xs font-semibold text-left"
                            style={{
                              borderWidth: `${Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                              borderStyle: (Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                              borderColor: props.tableHeaderBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                              background: props.tableHeaderBg || dimStyle.background || undefined,
                              color: props.tableHeaderText || dimStyle.fontColor || undefined,
                              padding: `${Number(props.tableHeaderPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                              margin: `${Number(props.tableHeaderMargin ?? 0)}px`,
                              borderRadius: `${Number(props.tableHeaderBorderRadius ?? 0)}px`,
                              fontSize: dimStyle.fontSize ? `${dimStyle.fontSize}px` : undefined,
                              textAlign: dimStyle.textAlign || undefined,
                            }}
                          >
                            {getDisplayName(attr, isValueAttr ? 'values' : 'rows')}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {filteredData.map((row: any, rowIdx: number) => (
                    <tr 
                      key={rowIdx}
                      className={stripedRows && rowIdx % 2 === 1 ? '' : ''}
                      style={{
                        background: props.tableRowBg || undefined,
                        color: props.tableRowText || undefined,
                      }}
                    >
                      {allAttrs.map((attr, colIdx) => {
                        const cellValue = row[attr]
                        const styleCfg = getAttrStyleConfig(attr, valueAttrs.includes(attr))
                        const isValueAttr = valueAttrs.includes(attr)
                        const isColumnAttr = !valueAttrs.includes(attr) && rowAttrs.includes(attr)
                        const dimStyle = isValueAttr ? getDimensionStyle('values') : getDimensionStyle('rows')
                        const condRule = evaluateConditionalFormatting(cellValue, attr, row, filteredData)
                        return (
                          <td 
                            key={colIdx}
                            className="text-xs"
                            style={{
                              borderWidth: `${Number(
                                isValueAttr ? (props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1) :
                                isColumnAttr ? (props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1) :
                                (props.tableRowBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)
                              )}px`,
                              borderStyle: (Number(
                                isValueAttr ? (props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1) :
                                isColumnAttr ? (props.tableColumnBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1) :
                                (props.tableRowBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)
                              )) > 0 ? 'solid' : 'none',
                              borderColor: isValueAttr ? (props.tableColumnBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb') :
                                isColumnAttr ? (props.tableColumnBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb') :
                                (props.tableRowBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb'),
                              background: condRule?.backgroundColor || (isValueAttr ? (props.tableColumnBg || dimStyle.background || undefined) :
                                isColumnAttr ? (props.tableColumnBg || dimStyle.background || undefined) :
                                (styleCfg.useRowBackground ? undefined : (styleCfg.background || dimStyle.background || undefined))),
                              color: condRule?.textColor || (isValueAttr ? (props.tableColumnText || dimStyle.fontColor || undefined) :
                                isColumnAttr ? (props.tableColumnText || dimStyle.fontColor || undefined) :
                                (styleCfg.color || dimStyle.fontColor || undefined)),
                              padding: `${Number(
                                isValueAttr ? (props.tableColumnPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4) :
                                isColumnAttr ? (props.tableColumnPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4) :
                                (props.tableRowPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)
                              )}px`,
                              width: isValueAttr && props.tableColumnWidth ? `${props.tableColumnWidth}px` : undefined,
                              borderRadius: `${Number(
                                isValueAttr ? (props.tableColumnBorderRadius ?? props.tableCellBorderRadius ?? 0) :
                                isColumnAttr ? (props.tableColumnBorderRadius ?? props.tableCellBorderRadius ?? 0) :
                                (props.tableRowBorderRadius ?? props.tableCellBorderRadius ?? 0)
                              )}px`,
                              whiteSpace: styleCfg.wrapText === 'on' ? 'normal' : 'nowrap',
                              textOverflow: styleCfg.clip === 'ellipsis' ? 'ellipsis' : 'clip',
                              overflow: 'hidden',
                              fontSize: styleCfg.fontSize || dimStyle.fontSize ? `${styleCfg.fontSize || dimStyle.fontSize}px` : undefined,
                              textAlign: dimStyle.textAlign || undefined,
                            }}
                          >
                            {renderCellContent(cellValue, attr, isValueAttr, isValueAttr ? valueMinMax[attr] : undefined, row, filteredData)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )
        }
      }
    }
    
    // Show table structure but no data message
    const displayColumns = shouldPivot && columnAttrs.length > 0
      ? [...rowAttrs, ...(pivotTableData([], pivotConfig).columnHeaders)]
      : [...rowAttrs, ...valueAttrs]
    
    if (displayColumns.length > 0) {
      return (
        <div className="w-full h-full flex flex-col" style={style}>
          {(props.showElementHeaderBar ?? false) && (
            <div
              className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
              style={{
                background: props.headerBackgroundColor || 'transparent',
                justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                className="truncate"
                style={{
                  fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
                  color: props.titleColor || style.color,
                  fontWeight: props.titleFontWeight || 600,
                }}
              >
                {props.title || ''}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto p-2">
          <table className="w-full" style={{
            borderCollapse: 'separate',
            borderSpacing: `0 ${Number(props.tableRowSpacing ?? 0)}px`,
            boxShadow: props.tableShadow === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)' : props.tableShadow === 'md' ? '0 4px 8px rgba(0,0,0,0.12)' : props.tableShadow === 'lg' ? '0 10px 15px rgba(0,0,0,0.15)' : undefined,
            borderRadius: props.tableBorderRadius ? `${props.tableBorderRadius}px` : undefined,
            overflow: 'hidden',
          }}>
            {showHeader && (
              <thead>
                <tr>
                  {displayColumns.map((colName, i) => {
                    const isValueAttr = valueAttrs.includes(colName)
                    const dimStyle = isValueAttr ? getDimensionStyle('values') : getDimensionStyle('rows')
                    return (
                      <th 
                        key={i}
                        className="text-xs font-semibold text-left"
                        style={{
                          borderWidth: `${Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)}px`,
                          borderStyle: (Number(props.tableHeaderBorderWidth ?? props.tableCellBorderWidth ?? dimStyle.borderWidth ?? 1)) > 0 ? 'solid' : 'none',
                          borderColor: props.tableHeaderBorderColor || props.tableCellBorderColor || dimStyle.borderColor || props.borderColor || '#e5e7eb',
                          background: props.tableHeaderBg || dimStyle.background || undefined,
                          color: props.tableHeaderText || dimStyle.fontColor || undefined,
                          padding: `${Number(props.tableHeaderPadding ?? props.tableCellPadding ?? dimStyle.padding ?? 4)}px`,
                          margin: `${Number(props.tableHeaderMargin ?? 0)}px`,
                          borderRadius: `${Number(props.tableHeaderBorderRadius ?? 0)}px`,
                          fontSize: dimStyle.fontSize ? `${dimStyle.fontSize}px` : undefined,
                          textAlign: dimStyle.textAlign || undefined,
                        }}
                      >
                        {getDisplayName(colName, 'values')}
                      </th>
                    )
                  })}
                </tr>
              </thead>
            )}
            <tbody>
              <tr>
                <td 
                  colSpan={displayColumns.length} 
                  className="text-xs text-center text-muted-foreground"
                  style={{
                    borderWidth: `${Number(props.tableCellBorderWidth ?? 1)}px`,
                    borderStyle: (Number(props.tableCellBorderWidth ?? 1)) > 0 ? 'solid' : 'none',
                    borderColor: props.tableCellBorderColor || props.borderColor || '#e5e7eb',
                    padding: `${Number(props.tableCellPadding ?? 16)}px`,
                  }}
                >
                  {dataLoading ? 'Loading data...' : 'No data available'}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      )
    }
  }
  
  // Show placeholder if no columns configured
  return (
    <div className="w-full h-full flex flex-col" style={style}>
      {(props.showElementHeaderBar ?? false) && (
        <div
          className="w-full flex items-center gap-2 px-3 py-2 shrink-0"
          style={{
            background: props.headerBackgroundColor || 'transparent',
            justifyContent: (props.titleAlign || 'left') === 'center' ? 'center' : (props.titleAlign || 'left') === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            className="truncate"
            style={{
              fontSize: props.titleFontSize ? `${props.titleFontSize}px` : undefined,
              color: props.titleColor || style.color,
              fontWeight: props.titleFontWeight || 600,
            }}
          >
            {props.title || ''}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto p-2">
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <TableIcon className="h-8 w-8 mb-2" />
        <div className="text-xs text-center">
          Configure columns in data source settings
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-destructive mt-2 text-center">
            Debug: chartDimensions = {JSON.stringify(chartDimensions)}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

