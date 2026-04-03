import { BarChart3, LineChart, PieChart, AreaChart, TrendingUp, Grid, Square, CreditCard, Table as TableIcon, Image, Video, Calendar, Map, Gauge, Target, Circle, Type, Triangle, Hexagon, Frame, Link2, FileText, Box, Filter, ListFilter, Search, SlidersHorizontal, ToggleLeft, CheckSquare, ChevronDown, Hash, User, Tag, Bell, MessageSquare, Columns, List, Clock, Star, QrCode, MoreHorizontal, ChevronsRight } from 'lucide-react'

export const widgetsPalette = [
  // Charts (merged Power BI and Basic Charts)
  { type: 'bar-chart', label: 'Bar Chart', icon: BarChart3, category: 'Charts' },
  { type: 'line-chart', label: 'Line Chart', icon: LineChart, category: 'Charts' },
  { type: 'area-chart', label: 'Area Chart', icon: AreaChart, category: 'Charts' },
  { type: 'pie-chart', label: 'Pie Chart', icon: PieChart, category: 'Charts' },
  { type: 'donut-chart', label: 'Donut Chart', icon: PieChart, category: 'Charts' },
  { type: 'scatter-chart', label: 'Scatter Plot', icon: Circle, category: 'Charts' },
  { type: 'radar-chart', label: 'Radar Chart', icon: Target, category: 'Charts' },
  { type: 'gauge-chart', label: 'Gauge Chart', icon: Gauge, category: 'Charts' },
  { type: 'funnel-chart', label: 'Funnel Chart', icon: TrendingUp, category: 'Charts' },
  { type: 'waterfall-chart', label: 'Waterfall Chart', icon: BarChart3, category: 'Charts' },
  { type: 'treemap-chart', label: 'Treemap', icon: Grid, category: 'Charts' },
  { type: 'heatmap-chart', label: 'Heatmap', icon: Grid, category: 'Charts' },
  { type: 'bubble-chart', label: 'Bubble Chart', icon: Circle, category: 'Charts' },
  { type: 'combo-chart', label: 'Combo Chart', icon: BarChart3, category: 'Charts' },
  // UI Elements (merged Tables and UI Components)
  { type: 'pivot-table', label: 'Pivot Table', icon: TableIcon, category: 'UI Elements' },
  { type: 'scorecard', label: 'Scorecard', icon: Target, category: 'UI Elements' },
  { type: 'time-series', label: 'Time Series', icon: TrendingUp, category: 'UI Elements' },
  { type: 'table', label: 'Table', icon: TableIcon, category: 'UI Elements' },
  { type: 'card', label: 'Card', icon: CreditCard, category: 'UI Elements' },
  { type: 'text', label: 'Text', icon: Type, category: 'UI Elements' },
  { type: 'button', label: 'Button', icon: Square, category: 'UI Elements' },
  { type: 'image', label: 'Image', icon: Image, category: 'UI Elements' },
  { type: 'video', label: 'Video', icon: Video, category: 'UI Elements' },
  { type: 'iframe', label: 'Iframe', icon: Frame, category: 'UI Elements' },
  { type: 'shape', label: 'Shape', icon: Square, category: 'UI Elements' },
  { type: 'rectangle', label: 'Rectangle', icon: Square, category: 'UI Elements' },
  { type: 'circle', label: 'Circle', icon: Circle, category: 'UI Elements' },
  { type: 'triangle', label: 'Triangle', icon: Triangle, category: 'UI Elements' },
  { type: 'hexagon', label: 'Hexagon', icon: Hexagon, category: 'UI Elements' },
  { type: 'container', label: 'Container', icon: Box, category: 'UI Elements' },
  { type: 'link', label: 'Link', icon: Link2, category: 'UI Elements' },
  { type: 'divider', label: 'Divider', icon: Square, category: 'UI Elements' },
  { type: 'spacer', label: 'Spacer', icon: Box, category: 'UI Elements' },
  { type: 'calendar', label: 'Calendar', icon: Calendar, category: 'UI Elements' },
  { type: 'map', label: 'Map', icon: Map, category: 'UI Elements' },
  { type: 'html', label: 'HTML', icon: FileText, category: 'UI Elements' },
  { type: 'embed', label: 'Embed', icon: Frame, category: 'UI Elements' },
  // Data / KPI & Progress
  { type: 'kpi', label: 'KPI / Stat', icon: TrendingUp, category: 'UI Elements' },
  { type: 'progress', label: 'Progress', icon: Circle, category: 'UI Elements' },
  { type: 'progress-circular', label: 'Progress (Circular)', icon: Circle, category: 'UI Elements' },
  // Navigation / structure
  { type: 'tabs', label: 'Tabs', icon: MoreHorizontal, category: 'UI Elements' },
  { type: 'accordion', label: 'Accordion', icon: List, category: 'UI Elements' },
  { type: 'breadcrumbs', label: 'Breadcrumbs', icon: ChevronsRight, category: 'UI Elements' },
  { type: 'pagination', label: 'Pagination', icon: MoreHorizontal, category: 'UI Elements' },
  { type: 'stepper', label: 'Stepper', icon: Hash, category: 'UI Elements' },
  // Feedback / overlays
  { type: 'modal', label: 'Modal/Dialog', icon: Square, category: 'UI Elements' },
  { type: 'drawer', label: 'Drawer/Sheet', icon: Columns, category: 'UI Elements' },
  { type: 'tooltip', label: 'Tooltip', icon: MessageSquare, category: 'UI Elements' },
  { type: 'toast', label: 'Toast/Notification', icon: Bell, category: 'UI Elements' },
  { type: 'badge', label: 'Badge/Chip', icon: Tag, category: 'UI Elements' },
  // Lists and boards
  { type: 'list', label: 'List', icon: List, category: 'UI Elements' },
  { type: 'timeline', label: 'Timeline', icon: Clock, category: 'UI Elements' },
  { type: 'kanban', label: 'Kanban Board', icon: Columns, category: 'UI Elements' },
  // Inputs (non-filter)
  { type: 'toggle', label: 'Toggle', icon: ToggleLeft, category: 'UI Elements' },
  { type: 'radio-group', label: 'Radio Group', icon: Circle, category: 'UI Elements' },
  // Media / utility
  { type: 'avatar', label: 'Avatar', icon: User, category: 'UI Elements' },
  { type: 'icon', label: 'Icon', icon: Star, category: 'UI Elements' },
  { type: 'qr', label: 'QR Code', icon: QrCode, category: 'UI Elements' },
  { type: 'rating', label: 'Rating', icon: Star, category: 'UI Elements' },
  // Filters
  { type: 'text-filter', label: 'Text Filter', icon: Search, category: 'Filters' },
  { type: 'number-filter', label: 'Number Filter', icon: Hash, category: 'Filters' },
  { type: 'date-filter', label: 'Date Filter', icon: Calendar, category: 'Filters' },
  { type: 'dropdown-filter', label: 'Dropdown Filter', icon: ChevronDown, category: 'Filters' },
  { type: 'multiselect-filter', label: 'Multi-Select Filter', icon: CheckSquare, category: 'Filters' },
  { type: 'checkbox-filter', label: 'Checkbox Filter', icon: ToggleLeft, category: 'Filters' },
  { type: 'slider-filter', label: 'Slider Filter', icon: SlidersHorizontal, category: 'Filters' },
  { type: 'range-filter', label: 'Range Filter', icon: SlidersHorizontal, category: 'Filters' },
  { type: 'search-filter', label: 'Search Filter', icon: Search, category: 'Filters' },
  { type: 'filter-panel', label: 'Filter Panel', icon: Filter, category: 'Filters' },
  { type: 'advanced-filter', label: 'Advanced Filter', icon: ListFilter, category: 'Filters' },
] as const

export type WidgetType = typeof widgetsPalette[number]['type']

export type PlacedWidget = { 
  id: string
  pageId: string // Page ID that this widget belongs to
  type: WidgetType
  x: number
  y: number
  width?: number
  height?: number
  properties?: Record<string, any>
}

export function getDefaultWidgetProperties(type: WidgetType): Record<string, any> {
  const sharedChartDefaults = {
    dataSource: 'sample',
    sampleData: [],
    dimensions: [],
    measures: [],
    chartDimensions: {},
    chartDimensionAggregations: {},
    chartDimensionsEffectiveTypes: {},
    chartDimensionTypeSettings: {},
    chartDimensionDisplayNames: {},
    chartDimensionStyles: {},
    seriesStyles: {},
    conditionalFormattingRules: [],
    rowFilters: null,
    showHeader: true,
    showLegend: true,
    showGrid: true,
  }

  if (type.includes('chart')) {
    return {
      ...sharedChartDefaults,
      title: widgetsPalette.find(widget => widget.type === type)?.label || 'Chart',
    }
  }

  if (type === 'table' || type === 'pivot-table') {
    return {
      ...sharedChartDefaults,
      stripedRows: false,
      pagination: false,
      rowsPerPage: 10,
    }
  }

  if (type === 'time-series') {
    return {
      ...sharedChartDefaults,
      chartDimensions: {
        time: [],
        values: [],
      },
    }
  }

  if (type === 'text') {
    return {
      text: 'Text Widget',
    }
  }

  if (type === 'button') {
    return {
      buttonText: 'Button',
    }
  }

  if (type === 'link') {
    return {
      linkText: 'Link',
      linkUrl: '#',
      target: '_self',
    }
  }

  if (type.includes('filter')) {
    return {
      placeholder: 'Filter...',
      min: 0,
      max: 100,
    }
  }

  return {}
}

