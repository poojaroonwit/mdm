'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, Plus, Edit, Trash2, Play, Clock, Database, Globe, 
  CheckCircle2, XCircle, AlertCircle, Loader2, History, Settings, Zap, BarChart3
} from 'lucide-react'
import { SyncMonitoringDashboard } from './SyncMonitoringDashboard'
import toast from 'react-hot-toast'
import { DataSyncDialogs } from './DataSyncDialogs'

export interface SyncSchedule {
  id: string
  name: string
  description?: string
  schedule_type: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'CUSTOM_CRON' | 'MANUAL'
  sync_strategy: 'FULL_REFRESH' | 'INCREMENTAL' | 'APPEND'
  is_active: boolean
  last_run_at?: string
  last_run_status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  last_run_error?: string
  next_run_at?: string
  connection_name?: string
  connection_type?: 'database' | 'api'
  data_model_name?: string
  incremental_key?: string
  incremental_timestamp_column?: string
  clear_existing_data: boolean
  max_records_per_sync?: number
  schedule_config?: any
}

export interface SyncExecution {
  id: string
  status: string
  started_at: string
  completed_at?: string
  records_fetched: number
  records_processed: number
  records_inserted: number
  records_updated: number
  records_deleted: number
  records_failed: number
  error_message?: string
  duration_ms: number
}

interface DataSyncManagementProps {
  spaceId: string
  dataModelId?: string // Optional: filter by data model
}

export function DataSyncManagement({ spaceId, dataModelId }: DataSyncManagementProps) {
  const [schedules, setSchedules] = useState<SyncSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<SyncSchedule | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<SyncSchedule | null>(null)
  const [executions, setExecutions] = useState<SyncExecution[]>([])
  const [executionsLoading, setExecutionsLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    data_model_id: dataModelId || '',
    external_connection_id: '',
    schedule_type: 'MANUAL' as SyncSchedule['schedule_type'],
    schedule_config: {} as any,
    sync_strategy: 'FULL_REFRESH' as SyncSchedule['sync_strategy'],
    incremental_key: '',
    incremental_timestamp_column: '',
    clear_existing_data: true,
    source_query: '',
    max_records_per_sync: '',
    is_active: true
  })

  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [availableConnections, setAvailableConnections] = useState<any[]>([])

  // Load schedules
  const loadSchedules = async () => {
    setLoading(true)
    try {
      const url = dataModelId 
        ? `/api/data-sync-schedules?space_id=${spaceId}&data_model_id=${dataModelId}`
        : `/api/data-sync-schedules?space_id=${spaceId}`
      const res = await fetch(url)
      const json = await res.json()
      setSchedules(json.schedules || [])
    } catch (error) {
      toast.error('Failed to load sync schedules')
    } finally {
      setLoading(false)
    }
  }

  // Load available models and connections
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data models
        const modelsRes = await fetch(`/api/data-models?page=1&limit=500&space_id=${spaceId}`)
        const modelsJson = await modelsRes.json()
        setAvailableModels(modelsJson.dataModels || [])

        // Load external connections
        const connRes = await fetch(`/api/external-connections?space_id=${spaceId}`)
        const connJson = await connRes.json()
        setAvailableConnections(connJson.connections || [])
      } catch (error) {
        console.error('Failed to load models/connections:', error)
      }
    }
    loadData()
    loadSchedules()
  }, [spaceId, dataModelId])

  // Load executions for selected schedule
  const loadExecutions = async (scheduleId: string) => {
    setExecutionsLoading(true)
    try {
      const res = await fetch(`/api/data-sync-schedules/${scheduleId}/executions`)
      const json = await res.json()
      setExecutions(json.executions || [])
    } catch (error) {
      toast.error('Failed to load execution history')
    } finally {
      setExecutionsLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.data_model_id || !formData.external_connection_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const payload = {
        space_id: spaceId,
        name: formData.name,
        description: formData.description,
        data_model_id: formData.data_model_id,
        external_connection_id: formData.external_connection_id,
        schedule_type: formData.schedule_type,
        schedule_config: formData.schedule_config,
        sync_strategy: formData.sync_strategy,
        incremental_key: formData.incremental_key || null,
        incremental_timestamp_column: formData.incremental_timestamp_column || null,
        clear_existing_data: formData.clear_existing_data,
        source_query: formData.source_query || null,
        max_records_per_sync: formData.max_records_per_sync ? parseInt(formData.max_records_per_sync) : null,
        is_active: formData.is_active
      }

      const url = editingSchedule 
        ? `/api/data-sync-schedules/${editingSchedule.id}`
        : '/api/data-sync-schedules'
      const method = editingSchedule ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSchedule ? { ...payload, ...formData } : payload)
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save sync schedule')
      }

      toast.success(editingSchedule ? 'Sync schedule updated' : 'Sync schedule created')
      setShowCreateDialog(false)
      setEditingSchedule(null)
      resetForm()
      loadSchedules()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save sync schedule')
    }
  }

  // Delete schedule
  const handleDelete = async (schedule: SyncSchedule) => {
    if (!confirm(`Delete sync schedule "${schedule.name}"?`)) return

    try {
      const res = await fetch(`/api/data-sync-schedules/${schedule.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Sync schedule deleted')
      loadSchedules()
    } catch (error) {
      toast.error('Failed to delete sync schedule')
    }
  }

  // Execute sync
  const handleExecute = async (schedule: SyncSchedule) => {
    try {
      toast.loading('Executing sync...', { id: 'sync-execute' })
      const res = await fetch(`/api/data-sync-schedules/${schedule.id}/execute`, {
        method: 'POST'
      })
      const json = await res.json()

      if (json.success) {
        toast.success(`Sync completed: ${json.result.records_inserted} inserted`, { id: 'sync-execute' })
      } else {
        toast.error(json.error || 'Sync failed', { id: 'sync-execute' })
      }

      loadSchedules()
      if (selectedSchedule?.id === schedule.id) {
        loadExecutions(schedule.id)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute sync', { id: 'sync-execute' })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      data_model_id: dataModelId || '',
      external_connection_id: '',
      schedule_type: 'MANUAL',
      schedule_config: {},
      sync_strategy: 'FULL_REFRESH',
      incremental_key: '',
      incremental_timestamp_column: '',
      clear_existing_data: true,
      source_query: '',
      max_records_per_sync: '',
      is_active: true
    })
  }

  // Open edit dialog - we'll need to fetch the full schedule to get IDs
  const handleEdit = async (schedule: SyncSchedule) => {
    try {
      const res = await fetch(`/api/data-sync-schedules/${schedule.id}`)
      const json = await res.json()
      const fullSchedule = json.schedule
      
      setEditingSchedule(fullSchedule)
      setFormData({
        name: fullSchedule.name,
        description: fullSchedule.description || '',
        data_model_id: fullSchedule.data_model_id || '',
        external_connection_id: fullSchedule.external_connection_id || '',
        schedule_type: fullSchedule.schedule_type,
        schedule_config: fullSchedule.schedule_config || {},
        sync_strategy: fullSchedule.sync_strategy,
        incremental_key: fullSchedule.incremental_key || '',
        incremental_timestamp_column: fullSchedule.incremental_timestamp_column || '',
        clear_existing_data: fullSchedule.clear_existing_data,
        source_query: fullSchedule.source_query || '',
        max_records_per_sync: fullSchedule.max_records_per_sync?.toString() || '',
        is_active: fullSchedule.is_active
      })
      setShowCreateDialog(true)
    } catch (error) {
      toast.error('Failed to load schedule details')
    }
  }

  // Get status badge
  const getStatusBadge = (schedule: SyncSchedule) => {
    const status = schedule.last_run_status
    if (status === 'RUNNING') {
      return <StatusBadge status={status}><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</StatusBadge>
    }
    if (status === 'COMPLETED') {
      return <StatusBadge status={status}><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</StatusBadge>
    }
    if (status === 'FAILED') {
      return <StatusBadge status={status}><XCircle className="h-3 w-3 mr-1" /> Failed</StatusBadge>
    }
    return <StatusBadge status="pending"><Clock className="h-3 w-3 mr-1" /> Pending</StatusBadge>
  }

  return (
    <div className="space-y-6">
    <Tabs defaultValue="schedules">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Data Synchronization</h3>
          <p className="text-sm text-muted-foreground">
            Automatically sync data from external sources into your data models
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Sync Schedule
        </Button>
      </div>

      <TabsList>
        <TabsTrigger value="schedules">Schedules</TabsTrigger>
        <TabsTrigger value="monitoring">
          <BarChart3 className="h-4 w-4 mr-2" />
          Monitoring
        </TabsTrigger>
      </TabsList>

      <TabsContent value="schedules" className="space-y-6">

      {/* Schedules List */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No sync schedules configured</p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Sync Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-base">{schedule.name}</CardTitle>
                      {getStatusBadge(schedule)}
                      {!schedule.is_active && (
                        <StatusBadge status="inactive" />
                      )}
                    </div>
                    {schedule.description && (
                      <CardDescription>{schedule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedSchedule(schedule); loadExecutions(schedule.id) }}
                    >
                      <History className="h-4 w-4 mr-1" />
                      History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecute(schedule)}
                      disabled={schedule.last_run_status === 'RUNNING'}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Source</div>
                    <div className="flex items-center gap-1">
                      {schedule.connection_type === 'api' ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Database className="h-3 w-3" />
                      )}
                      <span>{schedule.connection_name || 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Target</div>
                    <div>{schedule.data_model_name || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Schedule</div>
                    <div>{schedule.schedule_type}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Strategy</div>
                    <div>{schedule.sync_strategy.replace('_', ' ')}</div>
                  </div>
                  {schedule.last_run_at && (
                    <div>
                    <div className="text-muted-foreground mb-1">Last Run</div>
                    <div>{new Date(schedule.last_run_at).toLocaleString()}</div>
                  </div>
                  )}
                  {schedule.next_run_at && (
                    <div>
                    <div className="text-muted-foreground mb-1">Next Run</div>
                    <div>{new Date(schedule.next_run_at).toLocaleString()}</div>
                  </div>
                  )}
                </div>
                {schedule.last_run_error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {schedule.last_run_error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataSyncDialogs
        showCreateDialog={showCreateDialog}
        setShowCreateDialog={setShowCreateDialog}
        editingSchedule={editingSchedule}
        setEditingSchedule={setEditingSchedule}
        formData={formData}
        setFormData={setFormData}
        availableModels={availableModels}
        availableConnections={availableConnections}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        selectedSchedule={selectedSchedule}
        setSelectedSchedule={setSelectedSchedule}
        executions={executions}
        executionsLoading={executionsLoading}
      />
      </TabsContent>

      <TabsContent value="monitoring">
        <SyncMonitoringDashboard spaceId={spaceId} />
      </TabsContent>
    </Tabs>
    </div>
  )
}

