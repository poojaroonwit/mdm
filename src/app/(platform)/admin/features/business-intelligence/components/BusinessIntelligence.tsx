'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  FileText, 
  Calendar,
  Download,
  Share,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Database,
  Activity,
  Zap,
  Target,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Send
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'
import { Dashboard, DashboardWidget, FilterConfig, Report, DataSource, ChartTemplate } from '../types'

export function BusinessIntelligence() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [spaces, setSpaces] = useState<Array<{id: string, name: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDashboard, setShowCreateDashboard] = useState(false)
  const [showCreateReport, setShowCreateReport] = useState(false)
  const [showDataSourceDialog, setShowDataSourceDialog] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<string>('all')

  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: '',
    spaceId: '',
    isPublic: false
  })

  const [newReport, setNewReport] = useState<{
    name: string
    description: string
    spaceId: string
    type: 'on_demand' | 'scheduled'
    schedule: string
    format: 'pdf' | 'excel' | 'csv'
    recipients: string
  }>({
    name: '',
    description: '',
    spaceId: '',
    type: 'on_demand',
    schedule: '',
    format: 'pdf',
    recipients: ''
  })

  const [newDataSource, setNewDataSource] = useState({
    name: '',
    type: 'database' as const,
    connection: '',
    spaceId: ''
  })

  const chartTemplates: ChartTemplate[] = [
    {
      id: 'line-chart',
      name: 'Line Chart',
      type: 'line',
      description: 'Time series data visualization',
      icon: '📈',
      config: { type: 'line', showGrid: true, showLegend: true }
    },
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      type: 'bar',
      description: 'Categorical data comparison',
      icon: '📊',
      config: { type: 'bar', showGrid: true, showLegend: true }
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      type: 'pie',
      description: 'Proportional data representation',
      icon: '🥧',
      config: { type: 'pie', showLegend: true, showLabels: true }
    },
    {
      id: 'area-chart',
      name: 'Area Chart',
      type: 'area',
      description: 'Stacked area visualization',
      icon: '📈',
      config: { type: 'area', showGrid: true, showLegend: true }
    }
  ]

  useEffect(() => {
    loadSpaces()
    loadDashboards()
    loadReports()
    loadDataSources()
  }, [])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const loadDashboards = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/bi/dashboards')
      if (response.ok) {
        const data = await response.json()
        setDashboards(data.dashboards.map((dash: any) => ({
          ...dash,
          createdAt: new Date(dash.createdAt),
          updatedAt: new Date(dash.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReports = async () => {
    try {
      const response = await fetch('/api/admin/bi/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          lastRun: report.lastRun ? new Date(report.lastRun) : undefined,
          nextRun: report.nextRun ? new Date(report.nextRun) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const loadDataSources = async () => {
    try {
      const response = await fetch('/api/admin/bi/data-sources')
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.dataSources)
      }
    } catch (error) {
      console.error('Error loading data sources:', error)
    }
  }

  const createDashboard = async () => {
    try {
      const response = await fetch('/api/admin/bi/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDashboard)
      })

      if (response.ok) {
        setShowCreateDashboard(false)
        setNewDashboard({
          name: '',
          description: '',
          spaceId: '',
          isPublic: false
        })
        loadDashboards()
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
    }
  }

  const createReport = async () => {
    try {
      const response = await fetch('/api/admin/bi/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReport,
          recipients: newReport.recipients.split(',').map(email => email.trim())
        })
      })

      if (response.ok) {
        setShowCreateReport(false)
        setNewReport({
          name: '',
          description: '',
          spaceId: '',
          type: 'on_demand',
          schedule: '',
          format: 'pdf',
          recipients: ''
        })
        loadReports()
      }
    } catch (error) {
      console.error('Error creating report:', error)
    }
  }

  const createDataSource = async () => {
    try {
      const response = await fetch('/api/admin/bi/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataSource)
      })

      if (response.ok) {
        setShowDataSourceDialog(false)
        setNewDataSource({
          name: '',
          type: 'database',
          connection: '',
          spaceId: ''
        })
        loadDataSources()
      }
    } catch (error) {
      console.error('Error creating data source:', error)
    }
  }

  const deleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const response = await fetch(`/api/admin/bi/dashboards/${dashboardId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadDashboards()
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
    }
  }

  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/admin/bi/reports/${reportId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadReports()
      }
    } catch (error) {
      console.error('Error deleting report:', error)
    }
  }

  const runReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/bi/reports/${reportId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        loadReports()
      }
    } catch (error) {
      console.error('Error running report:', error)
    }
  }

  const filteredDashboards = selectedSpace === 'all' 
    ? dashboards 
    : dashboards.filter(dash => dash.spaceId === selectedSpace)

  const filteredReports = selectedSpace === 'all' 
    ? reports 
    : reports.filter(report => report.spaceId === selectedSpace)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Business Intelligence & Reporting
          </h2>
          <p className="text-muted-foreground">
            Create dashboards, build reports, and analyze data across spaces
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSpace} onValueChange={setSelectedSpace}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Spaces</SelectItem>
              {spaces.map(space => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadDashboards} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

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
            <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Dashboard
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Create Dashboard</DialogTitle>
                  <DialogDescription>
                    Create a new dashboard for data visualization
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="p-6 pt-2 pb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="dashboard-name">Dashboard Name</Label>
                      <Input
                        id="dashboard-name"
                        value={newDashboard.name}
                        onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                        placeholder="Sales Dashboard"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-description">Description</Label>
                      <Textarea
                        id="dashboard-description"
                        value={newDashboard.description}
                        onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                        placeholder="Dashboard description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dashboard-space">Space</Label>
                      <Select value={newDashboard.spaceId} onValueChange={(value) => setNewDashboard({ ...newDashboard, spaceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces.map(space => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={newDashboard.isPublic} 
                        onCheckedChange={(checked) => setNewDashboard({ ...newDashboard, isPublic: checked })}
                      />
                      <Label>Make Public</Label>
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="p-6 pt-2">
                  <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDashboard} disabled={!newDashboard.name || !newDashboard.spaceId}>
                    Create Dashboard
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Create Dashboard</DialogTitle>
                    <DialogDescription>
                      Create a new dashboard for data visualization
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody className="p-6 pt-2 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="dashboard-name">Dashboard Name</Label>
                        <Input
                          id="dashboard-name"
                          value={newDashboard.name}
                          onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                          placeholder="Sales Dashboard"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-description">Description</Label>
                        <Textarea
                          id="dashboard-description"
                          value={newDashboard.description}
                          onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                          placeholder="Dashboard description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dashboard-space">Space</Label>
                        <Select value={newDashboard.spaceId} onValueChange={(value) => setNewDashboard({ ...newDashboard, spaceId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a space" />
                          </SelectTrigger>
                          <SelectContent>
                            {spaces.map(space => (
                              <SelectItem key={space.id} value={space.id}>
                                {space.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={newDashboard.isPublic} 
                          onCheckedChange={(checked) => setNewDashboard({ ...newDashboard, isPublic: checked })}
                        />
                        <Label>Make Public</Label>
                      </div>
                    </div>
                  </DialogBody>
                  <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createDashboard} disabled={!newDashboard.name || !newDashboard.spaceId}>
                      Create Dashboard
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 overflow-hidden">
                  <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Create Report</DialogTitle>
                    <DialogDescription>
                      Create a new automated report
                    </DialogDescription>
                  </DialogHeader>
                  <DialogBody className="p-6 pt-2 pb-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-name">Report Name</Label>
                          <Input
                            id="report-name"
                            value={newReport.name}
                            onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                            placeholder="Monthly Sales Report"
                          />
                        </div>
                        <div>
                          <Label htmlFor="report-space">Space</Label>
                          <Select value={newReport.spaceId} onValueChange={(value) => setNewReport({ ...newReport, spaceId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a space" />
                            </SelectTrigger>
                            <SelectContent>
                              {spaces.map(space => (
                                <SelectItem key={space.id} value={space.id}>
                                  {space.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="report-description">Description</Label>
                        <Textarea
                          id="report-description"
                          value={newReport.description}
                          onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                          placeholder="Report description"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-type">Type</Label>
                          <Select value={newReport.type} onValueChange={(value: any) => setNewReport({ ...newReport, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="on_demand">On Demand</SelectItem>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="report-format">Format</Label>
                          <Select value={newReport.format} onValueChange={(value: any) => setNewReport({ ...newReport, format: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {newReport.type === 'scheduled' && (
                        <div>
                          <Label htmlFor="report-schedule">Schedule (Cron)</Label>
                          <Input
                            id="report-schedule"
                            value={newReport.schedule}
                            onChange={(e) => setNewReport({ ...newReport, schedule: e.target.value })}
                            placeholder="0 9 * * 1 (Every Monday at 9 AM)"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="report-recipients">Recipients (comma-separated emails)</Label>
                        <Input
                          id="report-recipients"
                          value={newReport.recipients}
                          onChange={(e) => setNewReport({ ...newReport, recipients: e.target.value })}
                          placeholder="admin@company.com, manager@company.com"
                        />
                      </div>
                    </div>
                  </DialogBody>
                  <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={() => setShowCreateReport(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createReport} disabled={!newReport.name || !newReport.spaceId}>
                      Create Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                      <Badge variant={report.type === 'scheduled' ? 'default' : 'outline'}>
                        {report.type}
                      </Badge>
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
                      <Badge variant="outline" className="text-green-600">Active</Badge>
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
            <Dialog open={showDataSourceDialog} onOpenChange={setShowDataSourceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Data Source
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle>Add Data Source</DialogTitle>
                  <DialogDescription>
                    Connect a new data source for reporting
                  </DialogDescription>
                </DialogHeader>
                <DialogBody className="p-6 pt-2 pb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="source-name">Data Source Name</Label>
                      <Input
                        id="source-name"
                        value={newDataSource.name}
                        onChange={(e) => setNewDataSource({ ...newDataSource, name: e.target.value })}
                        placeholder="Sales Database"
                      />
                    </div>
                    <div>
                      <Label htmlFor="source-type">Type</Label>
                      <Select value={newDataSource.type} onValueChange={(value: any) => setNewDataSource({ ...newDataSource, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="file">File</SelectItem>
                          <SelectItem value="space_data">Space Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="source-connection">Connection</Label>
                      <Input
                        id="source-connection"
                        value={newDataSource.connection}
                        onChange={(e) => setNewDataSource({ ...newDataSource, connection: e.target.value })}
                        placeholder="Database connection string or API endpoint"
                      />
                    </div>
                    <div>
                      <Label htmlFor="source-space">Space (Optional)</Label>
                      <Select value={newDataSource.spaceId} onValueChange={(value) => setNewDataSource({ ...newDataSource, spaceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a space" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific space</SelectItem>
                          {spaces.map(space => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter className="p-6 pt-2">
                  <Button variant="outline" onClick={() => setShowDataSourceDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDataSource} disabled={!newDataSource.name || !newDataSource.connection}>
                    Add Data Source
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      <Badge variant={source.isActive ? 'default' : 'outline'}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
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
    </div>
  )
}
