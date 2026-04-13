import { notFound } from 'next/navigation'
import { query } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Table,
  Type,
  Image,
  Filter,
  Map,
  Gauge
} from 'lucide-react'

interface EmbedDashboardPageProps {
  params: Promise<{
    publicLink: string
  }>
}

type DashboardElement = {
  id: string
  name: string
  type: string
  chart_type?: string
  position_x: number
  position_y: number
  width: number
  height: number
  z_index: number
  config: any
  style: any
  data_config: any
  is_visible: boolean
}

type Dashboard = {
  id: string
  name: string
  description?: string
  background_color: string
  font_family: string
  font_size: number
  grid_size: number
  layout_config: any
  style_config: any
}

const getElementIcon = (type: string, chartType?: string) => {
  switch (type) {
    case 'KPI':
      return TrendingUp
    case 'CHART':
      switch (chartType) {
        case 'BAR':
          return BarChart3
        case 'LINE':
          return LineChart
        case 'PIE':
          return PieChart
        default:
          return BarChart3
      }
    case 'TABLE':
      return Table
    case 'TEXT':
      return Type
    case 'IMAGE':
      return Image
    case 'FILTER':
      return Filter
    case 'MAP':
      return Map
    case 'GAUGE':
      return Gauge
    default:
      return BarChart3
  }
}

export default async function EmbedDashboardPage({ params }: EmbedDashboardPageProps) {
  const { publicLink } = await params

  // Fetch dashboard by public link
  const { rows: dashboards } = await query(`
    SELECT id, name, description, background_color, font_family, font_size, 
           grid_size, layout_config, style_config
    FROM public.dashboards 
    WHERE public_link = $1 
      AND visibility = 'PUBLIC' 
      AND deleted_at IS NULL
  `, [publicLink])

  if (dashboards.length === 0) {
    notFound()
  }

  const dashboard: Dashboard = dashboards[0]

  // Fetch dashboard elements
  const { rows: elements } = await query(`
    SELECT * FROM dashboard_elements 
    WHERE dashboard_id = $1 AND is_visible = true
    ORDER BY z_index ASC, position_y ASC, position_x ASC
  `, [dashboard.id])

  const dashboardElements: DashboardElement[] = elements

  return (
    <div
      className="min-h-screen p-6"
      style={{
        backgroundColor: dashboard.background_color || '#ffffff',
        fontFamily: dashboard.font_family || 'Inter',
        fontSize: `${dashboard.font_size || 14}px`
      }}
    >
      {/* Embed Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{dashboard.name}</h1>
        {dashboard.description && (
          <p className="text-muted-foreground mt-1">{dashboard.description}</p>
        )}
      </div>

      {/* Dashboard Canvas */}
      <Card>
        <CardContent className="p-6">
          <div className="relative min-h-96">
            {dashboardElements.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No elements</h3>
                  <p className="text-muted-foreground">
                    This dashboard doesn&apos;t have any elements yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                {dashboardElements
                  .sort((a, b) => a.z_index - b.z_index)
                  .map((element) => {
                    const Icon = getElementIcon(element.type, element.chart_type)
                    return (
                      <div
                        key={element.id}
                        className="absolute border rounded-lg shadow-lg bg-background"
                        style={{
                          left: `${(element.position_x / (dashboard.grid_size || 12)) * 100}%`,
                          top: `${(element.position_y / (dashboard.grid_size || 12)) * 100}%`,
                          width: `${(element.width / (dashboard.grid_size || 12)) * 100}%`,
                          height: `${(element.height / (dashboard.grid_size || 12)) * 100}%`,
                          zIndex: element.z_index,
                          ...element.style
                        }}
                      >
                        <div className="w-full h-full p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-medium text-sm">{element.name}</h3>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {element.type}
                            </Badge>
                          </div>
                          {/* Placeholder for actual chart/table content */}
                          <div className="mt-4 flex items-center justify-center h-20 bg-muted/30 rounded border-2 border-dashed border-border">
                            <div className="text-center text-gray-500">
                              <Icon className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-xs">{element.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Embed Footer */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        Powered by Unified Data Platform
      </div>
    </div>
  )
}

