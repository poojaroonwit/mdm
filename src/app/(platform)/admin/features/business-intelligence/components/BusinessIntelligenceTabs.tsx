import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Database, Edit, Eye, FileText, Play, Plus, Settings, Trash2 } from 'lucide-react'

import type { ChartTemplate, Dashboard, DataSource, Report } from '../types'

interface BusinessIntelligenceTabsProps {
  dataSources: DataSource[]
  filteredDashboards: Dashboard[]
  filteredReports: Report[]
  deleteDashboard: (dashboardId: string) => void
  deleteReport: (reportId: string) => void
  runReport: (reportId: string) => void
  setShowCreateDashboard: (open: boolean) => void
  setShowCreateReport: (open: boolean) => void
  setShowDataSourceDialog: (open: boolean) => void
}

const chartTemplates: ChartTemplate[] = [
  {
    id: 'line-chart',
    name: 'Line Chart',
    type: 'line',
    description: 'Time series data visualization',
    icon: 'Chart',
    config: { type: 'line', showGrid: true, showLegend: true }
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    type: 'bar',
    description: 'Categorical data comparison',
    icon: 'Bars',
    config: { type: 'bar', showGrid: true, showLegend: true }
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    type: 'pie',
    description: 'Proportional data representation',
    icon: 'Pie',
    config: { type: 'pie', showLegend: true, showLabels: true }
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    type: 'area',
    description: 'Stacked area visualization',
    icon: 'Area',
    config: { type: 'area', showGrid: true, showLegend: true }
  }
]

export function BusinessIntelligenceTabs({
  dataSources,
  filteredDashboards,
  filteredReports,
  deleteDashboard,
  deleteReport,
  runReport,
  setShowCreateDashboard,
  setShowCreateReport,
  setShowDataSourceDialog
}: BusinessIntelligenceTabsProps) {
  return (
      <div className="w-full">
      <Tabs defaultValue="dashboards">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Space Dashboards</h3>
            <Button onClick={() => setShowCreateDashboard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDashboards.map(dashboard => (
              <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {dashboard.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {dashboard.isPublic && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDashboard(dashboard.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {dashboard.spaceName} • {dashboard.widgets.length} widgets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dashboard.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Dashboards & Reports</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCreateDashboard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
              <Button onClick={() => setShowCreateReport(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDashboards.map(dashboard => (
              <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {dashboard.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">Dashboard</Badge>
                      {dashboard.isPublic && (
                        <Badge variant="outline" className="text-xs">Public</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDashboard(dashboard.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {dashboard.spaceName} • {dashboard.widgets.length} widgets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dashboard.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredReports.map(report => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.name}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">Report</Badge>
                      <StatusBadge status={report.type} />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {report.spaceName} • {report.format.toUpperCase()} • {report.recipients.length} recipients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">
                      {report.lastRun && (
                        <div>Last run: {report.lastRun.toLocaleDateString()}</div>
                      )}
                      {report.nextRun && (
                        <div>Next run: {report.nextRun.toLocaleDateString()}</div>
                      )}
                    </div>
                    {report.isActive && (
                      <StatusBadge status="active" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runReport(report.id)}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredDashboards.length === 0 && filteredReports.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No dashboards or reports yet. Create your first one to get started.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Data Sources</h3>
            <Button onClick={() => setShowDataSourceDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map(source => (
              <Card key={source.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {source.name}
                  </CardTitle>
                  <CardDescription>
                    {source.type} • {source.spaceId ? 'Space-specific' : 'Global'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Connection:</span>
                      <div className="text-muted-foreground font-mono text-xs truncate">
                        {source.connection}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={source.isActive ? 'active' : 'inactive'} />
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <h3 className="text-lg font-semibold">Chart Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {chartTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    {template.name}
                  </CardTitle>
                  <CardDescription>
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.type}</Badge>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>
  )
}
