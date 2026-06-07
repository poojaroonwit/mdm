'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Dashboard, Report, DataSource } from '../types'
import { BusinessIntelligenceHeader } from './BusinessIntelligenceHeader'
import { BusinessIntelligenceTabs } from './BusinessIntelligenceTabs'

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

  const dashboardForm = (
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
  )

  return (
    <div className="space-y-6">
      <BusinessIntelligenceHeader
        isLoading={isLoading}
        selectedSpace={selectedSpace}
        spaces={spaces}
        loadDashboards={loadDashboards}
        setSelectedSpace={setSelectedSpace}
      />

      <CrudDialog
        open={showCreateDashboard}
        onOpenChange={setShowCreateDashboard}
        title="Create Dashboard"
        description="Create a new dashboard for data visualization"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
              Cancel
            </Button>
            <Button onClick={createDashboard} disabled={!newDashboard.name || !newDashboard.spaceId}>
              Create Dashboard
            </Button>
          </>
        )}
      >
        {dashboardForm}
      </CrudDialog>

      <CrudDialog
        open={showCreateReport}
        onOpenChange={setShowCreateReport}
        title="Create Report"
        description="Create a new automated report"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateReport(false)}>
              Cancel
            </Button>
            <Button onClick={createReport} disabled={!newReport.name || !newReport.spaceId}>
              Create Report
            </Button>
          </>
        )}
      >
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
      </CrudDialog>

      <CrudDialog
        open={showDataSourceDialog}
        onOpenChange={setShowDataSourceDialog}
        title="Add Data Source"
        description="Connect a new data source for reporting"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowDataSourceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createDataSource} disabled={!newDataSource.name || !newDataSource.connection}>
              Add Data Source
            </Button>
          </>
        )}
      >
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
      </CrudDialog>

      <BusinessIntelligenceTabs
        dataSources={dataSources}
        filteredDashboards={filteredDashboards}
        filteredReports={filteredReports}
        deleteDashboard={deleteDashboard}
        deleteReport={deleteReport}
        runReport={runReport}
        setShowCreateDashboard={setShowCreateDashboard}
        setShowCreateReport={setShowCreateReport}
        setShowDataSourceDialog={setShowDataSourceDialog}
      />
    </div>
  )
}
