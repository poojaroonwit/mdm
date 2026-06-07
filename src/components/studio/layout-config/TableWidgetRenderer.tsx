import React from 'react'
import { Table as TableIcon, Loader2, BarChart3, Star, Home, Settings as SettingsIcon, BarChart3 as BarChart3Icon, LineChart, AreaChart } from 'lucide-react'
import { pivotTableData, getPivotCellValue, getPivotConfig } from './tablePivotUtils'
import { createTableWidgetRenderHelpers } from './tableWidgetRenderHelpers'
import { prepareTableWidgetData } from './tableWidgetDataPreparation'
import { TableWidgetTitleBar } from './TableWidgetTitleBar'

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
  
  const chartDimensions = props.chartDimensions as Record<string, string | string[]> | undefined
  
  const pivotConfig = getPivotConfig(chartDimensions, widget.type)
  const { columnAttrs, rowAttrs, valueAttrs } = pivotConfig
  
  const shouldPivot = columnAttrs.length > 0
  const hasRows = rowAttrs.length > 0
  const hasValues = valueAttrs.length > 0
  const typeSettings = (props.chartDimensionTypeSettings || {}) as Record<string, Record<string, any>>
  const displayNames = (props.chartDimensionDisplayNames || {}) as Record<string, Record<string, string>>

  const {
    getDisplayName,
    calculateMinMax,
    getAttrStyleConfig,
    getDimensionStyle,
    evaluateConditionalFormatting,
    renderCellContent,
  } = createTableWidgetRenderHelpers(props, displayNames, typeSettings)
  
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
  
  const hasAnyAttrs = columnAttrs.length > 0 || rowAttrs.length > 0 || valueAttrs.length > 0
  
  if (hasAnyAttrs && chartData && Array.isArray(chartData) && chartData.length > 0) {
    const { filteredData, valueMinMax } = prepareTableWidgetData({
      chartData,
      props,
      chartDimensions,
      columnAttrs,
      rowAttrs,
      valueAttrs,
      shouldPivot,
      calculateMinMax,
    })

    if (filteredData.length > 0) {
      if (shouldPivot) {
        let { pivotedData, columnHeaders } = pivotTableData(filteredData, pivotConfig)
        
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
              <TableWidgetTitleBar props={props} style={style} showIcon />
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
              <TableWidgetTitleBar props={props} style={style} />
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
          <TableWidgetTitleBar props={props} style={style} />
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
      <TableWidgetTitleBar props={props} style={style} />
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

