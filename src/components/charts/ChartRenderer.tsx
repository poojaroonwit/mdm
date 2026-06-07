'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadialBarChart,
  RadialBar,
  Treemap as ReTreemap,
  ComposedChart
} from 'recharts'
// Removed Card wrapper to avoid inner borders inside element padding
import { Filter, BarChart3 as LBarChart3, LineChart as LLineChart, PieChart as LPieChart, Table as LTable, AreaChart as LAreaChart } from 'lucide-react'
import {
  Star as StarIcon,
  Heart,
  Home,
  User,
  Settings as SettingsIcon,
  Bell,
  CheckCircle,
  AlertTriangle,
  Camera,
  Cloud,
  Folder,
  Mail,
  Phone,
  Play as PlayIcon,
  Pause as PauseIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon
} from 'lucide-react'
import { getTableColumns, hasValidTableColumns } from './chartUtils'
import { createChartFormatters } from './chartRendererFormatters'
import { processChartData, validateChartConfig, DEFAULT_CHART_COLORS, type ChartType } from '@/lib/chart-utils'
import DOMPurify from 'dompurify'
import { renderChartCases1 } from './ChartRendererCases1'
import { renderChartCases2 } from './ChartRendererCases2'
import { renderChartCases3 } from './ChartRendererCases3'
import { renderChartCases4 } from './ChartRendererCases4'

interface ChartData {
  [key: string]: any
}

interface ChartRendererProps {
  type: string
  chartType: string
  data: ChartData[]
  dimensions: string[]
  measures: string[]
  filters: any[]
  title: string
  isLive?: boolean
  refreshInterval?: number
  onRefresh?: () => void
  onFilter?: (filter: any) => void
  onExport?: (format: string) => void
  className?: string
  config?: any
}

// Use shared chart colors from chart-utils
const COLORS = DEFAULT_CHART_COLORS

export function ChartRenderer({
  type,
  chartType,
  data,
  dimensions,
  measures,
  filters,
  title,
  isLive = false,
  refreshInterval = 30000,
  onRefresh,
  onFilter,
  onExport,
  className = '',
  config
}: ChartRendererProps) {
  // Header controls removed per request (no live badge, pause, reload, download, title, or last updated)

  const handleDataPointClick = (data: any, index: number) => {
    if (onFilter && dimensions.length > 0) {
      const filter = {
        field: dimensions[0],
        operator: '=',
        value: data[dimensions[0]]
      }
      onFilter(filter)
    }
  }

  const { formatLabelWithType, formatNumber, getAttributeStyle } = createChartFormatters(config)

  const renderChart = () => {
    // Validate chart configuration
    const chartConfig = {
      type: (chartType || type || 'BAR') as ChartType,
      dimensions,
      measures,
      filters
    }
    const validation = validateChartConfig(chartConfig)
    if (!validation.isValid && validation.errors.length > 0) {
      console.warn('Chart validation errors:', validation.errors)
    }

    // Process chart data with filters using shared utilities
    const processedData = data && data.length > 0
      ? processChartData(data, dimensions, measures, filters)
      : (() => {
        const ct = (chartType || type || '').toUpperCase()

        if (ct.includes('LINE')) {
          return [
            { name: 'Jan', sales: 1200, profit: 300 },
            { name: 'Feb', sales: 1500, profit: 400 },
            { name: 'Mar', sales: 1800, profit: 500 },
            { name: 'Apr', sales: 1600, profit: 450 },
            { name: 'May', sales: 2000, profit: 600 },
            { name: 'Jun', sales: 2200, profit: 600 }
          ]
        } else if (ct.includes('PIE') || ct.includes('DONUT')) {
          return [
            { name: 'Desktop', value: 45, color: '#1e40af' },
            { name: 'Mobile', value: 35, color: '#10b981' },
            { name: 'Tablet', value: 20, color: '#f59e0b' }
          ]
        } else if (ct.includes('AREA')) {
          return [
            { name: 'Q1', revenue: 50000, expenses: 30000 },
            { name: 'Q2', revenue: 65000, expenses: 35000 },
            { name: 'Q3', revenue: 75000, expenses: 40000 },
            { name: 'Q4', revenue: 80000, expenses: 42000 }
          ]
        } else if (ct.includes('TABLE')) {
          return [
            { product: 'Product A', sales: 1000, profit: 200, growth: '+12%' },
            { product: 'Product B', sales: 1500, profit: 300, growth: '+8%' },
            { product: 'Product C', sales: 800, profit: 150, growth: '+15%' },
            { product: 'Product D', sales: 2000, profit: 500, growth: '+5%' },
            { product: 'Product E', sales: 1200, profit: 250, growth: '+20%' }
          ]
        } else {
          return [
            { name: 'Jan', sales: 1200, profit: 300 },
            { name: 'Feb', sales: 1500, profit: 400 },
            { name: 'Mar', sales: 1800, profit: 500 },
            { name: 'Apr', sales: 1600, profit: 450 },
            { name: 'May', sales: 2000, profit: 600 },
            { name: 'Jun', sales: 2200, profit: 600 }
          ]
        }
      })()

    const commonProps = {
      data: processedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    const ct = (chartType || type || '').toUpperCase()
    const chartContext = {
      ct,
      commonProps,
      processedData,
      data,
      dimensions,
      measures,
      filters,
      config,
      chartType,
      type,
      handleDataPointClick,
      formatLabelWithType,
      formatNumber,
      getAttributeStyle,
    }

    return renderChartCases1(chartContext) ?? renderChartCases2(chartContext) ?? renderChartCases3(chartContext) ?? renderChartCases4(chartContext)

  }

  return (
    <div className={`h-full ${className}`}>
      {renderChart()}
    </div>
  )
}
