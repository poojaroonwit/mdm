import { applyAggregations, getAggregationConfig } from './dataAggregationUtils'
import type { AggregationType, FilterCondition, FilterGroup } from './ChartDataSourceConfig'

interface PrepareTableWidgetDataParams {
  chartData: any[]
  props: any
  chartDimensions?: Record<string, string | string[]>
  columnAttrs: string[]
  rowAttrs: string[]
  valueAttrs: string[]
  shouldPivot: boolean
  calculateMinMax: (data: any[], attrNames: string[]) => Record<string, { min: number; max: number }>
}

function evaluateCondition(condition: FilterCondition, row: any): boolean {
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

function evaluateGroup(group: FilterGroup, row: any): boolean {
  if (group.items.length === 0) return true
  const results = group.items.map(item =>
    item.type === 'condition' ? evaluateCondition(item, row) : evaluateGroup(item, row)
  )
  return group.logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
}

function applyDateRangeFilter(data: any[], props: any) {
  const dateRangeConfig = (props.dateRangeConfig as { attribute?: string; startDate?: string; endDate?: string }) || null
  if (!dateRangeConfig?.attribute || (!dateRangeConfig.startDate && !dateRangeConfig.endDate)) return data

  return data.filter((row: any) => {
    const dateValue = row[dateRangeConfig.attribute as string]
    if (dateValue === null || dateValue === undefined) return false

    let rowDate: Date | null = null
    if (dateValue instanceof Date) rowDate = dateValue
    else if (typeof dateValue === 'string') rowDate = new Date(dateValue)
    else if (typeof dateValue === 'number') rowDate = new Date(dateValue)
    if (!rowDate || isNaN(rowDate.getTime())) return false

    if (dateRangeConfig.startDate) {
      const startDate = new Date(dateRangeConfig.startDate)
      startDate.setHours(0, 0, 0, 0)
      rowDate.setHours(0, 0, 0, 0)
      if (rowDate < startDate) return false
    }

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

function compareValues(a: any, b: any, order: string) {
  if (a == null && b == null) return 0
  if (a == null) return order === 'ASC' ? -1 : 1
  if (b == null) return order === 'ASC' ? 1 : -1
  if (a < b) return order === 'ASC' ? -1 : 1
  if (a > b) return order === 'ASC' ? 1 : -1
  return 0
}

export function prepareTableWidgetData({
  chartData,
  props,
  chartDimensions,
  columnAttrs,
  rowAttrs,
  valueAttrs,
  shouldPivot,
  calculateMinMax,
}: PrepareTableWidgetDataParams) {
  let processedData = chartData
  try {
    const aggregations = (props.chartDimensionAggregations || {}) as Record<string, Record<string, AggregationType>>
    const aggConfig = getAggregationConfig(
      (chartDimensions || {}) as Record<string, string | string[]>,
      aggregations,
      shouldPivot ? ['rows', 'columns'] : ['rows'],
      ['values']
    )
    processedData = applyAggregations(chartData, aggConfig)
  } catch (error) {
    console.error('Table aggregation failed, falling back to raw data:', error)
    processedData = chartData
  }

  const allAttrs = [...columnAttrs, ...rowAttrs, ...valueAttrs]
  let filteredData = processedData.filter((row: any) => (
    row && typeof row === 'object' && allAttrs.some(attr => row[attr] !== undefined)
  ))

  filteredData = applyDateRangeFilter(filteredData, props)

  const rowFilters = (props.rowFilters as FilterGroup) || null
  if (rowFilters) {
    filteredData = filteredData.filter((row: any) => evaluateGroup(rowFilters, row))
  }

  const valueMinMax = valueAttrs.length > 0 ? calculateMinMax(filteredData, valueAttrs) : {}

  try {
    const dimsObj = (chartDimensions || {}) as Record<string, any>
    const rowSortAttr = String(dimsObj.rowSort || '')
    const rowSortOrder = String(props.rowSortOrder || 'ASC').toUpperCase()
    if (!shouldPivot && rowSortAttr) {
      filteredData = [...filteredData].sort((r1, r2) => compareValues(r1[rowSortAttr], r2[rowSortAttr], rowSortOrder))
    }
  } catch (error) {
    console.warn('Sorting skipped due to error:', error)
  }

  return { filteredData, valueMinMax }
}
