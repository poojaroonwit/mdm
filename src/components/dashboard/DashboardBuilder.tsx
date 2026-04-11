'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Move, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Table,
  Type,
  Image,
  Target
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

interface DashboardWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'text' | 'image'
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: any
  dataSource: string
  filters: any[]
}

interface DashboardBuilderProps {
  dashboardId: string
  widgets: DashboardWidget[]
  onWidgetsChange: (widgets: DashboardWidget[]) => void
  dataSources: Array<{id: string, name: string, type: string}>
  isEditMode?: boolean
}

export function DashboardBuilder({ 
  dashboardId, 
  widgets, 
  onWidgetsChange, 
  dataSources,
  isEditMode = false 
}: DashboardBuilderProps) {
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const addWidget = useCallback((type: DashboardWidget['type']) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type}`,
      position: { x: 0, y: 0, w: 4, h: 3 },
      config: getDefaultConfig(type),
      dataSource: dataSources[0]?.id || '',
      filters: []
    }
    onWidgetsChange([...widgets, newWidget])
  }, [widgets, onWidgetsChange, dataSources])

  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    onWidgetsChange(widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w))
  }, [widgets, onWidgetsChange])

  const deleteWidget = useCallback((widgetId: string) => {
    onWidgetsChange(widgets.filter(w => w.id !== widgetId))
    setSelectedWidget(null)
  }, [widgets, onWidgetsChange])

  const getDefaultConfig = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'chart':
        return { type: 'line', showGrid: true, showLegend: true }
      case 'table':
        return { columns: [], rows: [] }
      case 'metric':
        return { value: 0, format: 'number', color: 'blue' }
      case 'text':
        return { content: 'Enter text here', fontSize: 16, color: 'black' }
      case 'image':
        return { src: '', alt: '', width: 200, height: 150 }
      default:
        return {}
    }
  }

  const getWidgetIcon = (type: DashboardWidget['type']) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="h-4 w-4" />
      case 'table':
        return <Table className="h-4 w-4" />
      case 'metric':
        return <Target className="h-4 w-4" />
      case 'text':
        return <Type className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  const renderWidget = (widget: DashboardWidget) => {
    const isSelected = selectedWidget === widget.id

    return (
      <Card
        key={widget.id}
        className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isEditMode ? 'cursor-move' : ''}`}
        style={{
          gridColumn: `span ${widget.position.w}`,
          gridRow: `span ${widget.position.h}`
        }}
        onClick={() => setSelectedWidget(widget.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              {getWidgetIcon(widget.type)}
              {widget.title}
            </CardTitle>
            {isEditMode && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteWidget(widget.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {renderWidgetContent(widget)}
        </CardContent>
      </Card>
    )
  }

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} />
      case 'table':
        return <TableWidget widget={widget} />
      case 'metric':
        return <MetricWidget widget={widget} />
      case 'text':
        return <TextWidget widget={widget} />
      case 'image':
        return <ImageWidget widget={widget} />
      default:
        return <div className="text-muted-foreground">Unknown widget type</div>
    }
  }

  return (
    <div className="space-y-4">
      {isEditMode && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">Add Widget:</span>
          <Button size="sm" variant="outline" onClick={() => addWidget('chart')}>
            <BarChart3 className="h-4 w-4 mr-1" />
            Chart
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget('table')}>
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget('metric')}>
            <Target className="h-4 w-4 mr-1" />
            Metric
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget('text')}>
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => addWidget('image')}>
            <Image className="h-4 w-4 mr-1" />
            Image
          </Button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 min-h-[600px]">
        {widgets.map(renderWidget)}
      </div>
    </div>
  )
}

// Widget Components
function ChartWidget({ widget }: { widget: DashboardWidget }) {
  const mockData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 600 }
  ]

  const { type } = widget.config

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie
            data={mockData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label
          >
            {mockData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    )
  }

  return <div className="text-muted-foreground">Chart type not supported</div>
}

function TableWidget({ widget }: { widget: DashboardWidget }) {
  const mockData = [
    { name: 'Product A', sales: 1000, profit: 200 },
    { name: 'Product B', sales: 1500, profit: 300 },
    { name: 'Product C', sales: 800, profit: 150 }
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Sales</th>
            <th className="text-left p-2">Profit</th>
          </tr>
        </thead>
        <tbody>
          {mockData.map((row, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{row.name}</td>
              <td className="p-2">${row.sales}</td>
              <td className="p-2">${row.profit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MetricWidget({ widget }: { widget: DashboardWidget }) {
  const { value, format, color } = widget.config

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold text-${color}-600`}>
        {format === 'currency' ? `$${value.toLocaleString()}` : value.toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        Total Revenue
      </div>
    </div>
  )
}

function TextWidget({ widget }: { widget: DashboardWidget }) {
  const { content, fontSize, color } = widget.config

  return (
    <div 
      className="p-2"
      style={{ fontSize: `${fontSize}px`, color }}
    >
      {content}
    </div>
  )
}

function ImageWidget({ widget }: { widget: DashboardWidget }) {
  const { src, alt, width, height } = widget.config

  return (
    <div className="flex items-center justify-center">
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          style={{ width, height }}
          className="object-contain"
        />
      ) : (
        <div className="text-muted-foreground text-center">
          <Image className="h-12 w-12 mx-auto mb-2" />
          <div>No image selected</div>
        </div>
      )}
    </div>
  )
}
