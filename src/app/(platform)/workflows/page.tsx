'use client'

import { useState, useMemo, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useSpace } from '@/contexts/space-context'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Settings, 
  Zap, 
  Filter,
  Target,
  Calendar
} from 'lucide-react'
import {
  WorkflowActionsTab,
  WorkflowBasicTab,
  WorkflowConditionsTab,
  WorkflowIntegrationTab,
  WorkflowScheduleTab
} from './components/WorkflowDialogTabs'
import { WorkflowsTable } from './components/WorkflowsTable'

type Workflow = {
  id: string
  name: string
  description?: string
  trigger_type: 'SCHEDULED' | 'EVENT_BASED' | 'MANUAL'
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR'
  is_active: boolean
  created_at: string
  updated_at: string
  data_model_name: string
  data_model_display_name: string
  created_by_name: string
  execution_count: number
  successful_executions: number
  failed_executions: number
}

type DataModel = {
  id: string
  name: string
  display_name: string
}

type Attribute = {
  id: string
  name: string
  display_name: string
  type: string
}

type WorkflowCondition = {
  attribute_id: string
  operator: string
  value: string
  logical_operator: string
  condition_order: number
}

type WorkflowAction = {
  target_attribute_id: string
  action_type: string
  new_value?: string
  calculation_formula?: string
  source_attribute_id?: string
  action_order: number
}

export default function WorkflowsPage() {
  const { currentSpace } = useSpace()
  const disabled = !!currentSpace && (currentSpace.features?.workflows === false || (currentSpace as any).enable_workflows === false)
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [dataModels, setDataModels] = useState<DataModel[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [triggerFilter, setTriggerFilter] = useState('all')
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [availableSyncSchedules, setAvailableSyncSchedules] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    data_model_id: '',
    trigger_type: 'MANUAL' as 'SCHEDULED' | 'EVENT_BASED' | 'MANUAL',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR'
  })
  const [conditions, setConditions] = useState<WorkflowCondition[]>([])
  const [actions, setActions] = useState<WorkflowAction[]>([])
  const [schedule, setSchedule] = useState({
    schedule_type: 'DAILY',
    schedule_config: {} as any,
    start_date: '',
    end_date: '',
    timezone: 'UTC'
  })
  const [selectedModelAttributes, setSelectedModelAttributes] = useState<Attribute[]>([])

  const filtered = useMemo(() => {
    let filtered = workflows

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(w => 
        w.name.toLowerCase().includes(q) || 
        w.description?.toLowerCase().includes(q) ||
        w.data_model_display_name.toLowerCase().includes(q)
      )
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter)
    }

    if (triggerFilter && triggerFilter !== 'all') {
      filtered = filtered.filter(w => w.trigger_type === triggerFilter)
    }

    return filtered
  }, [workflows, search, statusFilter, triggerFilter])

  async function loadWorkflows() {
    setLoading(true)
    try {
      const res = await fetch('/api/workflows')
      const json = await res.json()
      setWorkflows(json.workflows || [])
    } finally {
      setLoading(false)
    }
  }

  async function loadDataModels() {
    try {
      const res = await fetch('/api/data-models')
      const json = await res.json()
      setDataModels(json.dataModels || [])
    } catch (error) {
      console.error('Error loading data models:', error)
    }
  }

  async function loadModelAttributes(modelId: string) {
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      const json = await res.json()
      setSelectedModelAttributes(json.attributes || [])
    } catch (error) {
      console.error('Error loading attributes:', error)
      setSelectedModelAttributes([])
    }
  }

  async function loadSyncSchedulesForModel(dataModelId: string) {
    try {
      const res = await fetch(`/api/data-sync-schedules?data_model_id=${dataModelId}`)
      const json = await res.json()
      setAvailableSyncSchedules(json.schedules || [])
    } catch (error) {
      console.error('Error loading sync schedules:', error)
      setAvailableSyncSchedules([])
    }
  }

  useEffect(() => {
    loadWorkflows()
    loadDataModels()
  }, [])

  function openCreate() {
    setEditingWorkflow(null)
    setForm({
      name: '',
      description: '',
      data_model_id: '',
      trigger_type: 'MANUAL',
      status: 'ACTIVE'
    })
    setConditions([])
    setActions([])
    setSchedule({
      schedule_type: 'DAILY',
      schedule_config: {},
      start_date: '',
      end_date: '',
      timezone: 'UTC'
    })
    setSelectedModelAttributes([])
    setShowWorkflowDialog(true)
  }

  async function openEdit(workflow: Workflow) {
    setEditingWorkflow(workflow)
    setForm({
      name: workflow.name,
      description: workflow.description || '',
      data_model_id: '', // Will be loaded from API
      trigger_type: workflow.trigger_type,
      status: workflow.status
    })
    
    // Load full workflow details
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`)
      const json = await res.json()
      
      setConditions(json.conditions || [])
      setActions(json.actions || [])
      setSchedule(json.schedule || {
        schedule_type: 'DAILY',
        schedule_config: {},
        start_date: '',
        end_date: '',
        timezone: 'UTC'
      })
      
      // Load attributes for the data model
      if (json.workflow.data_model_id) {
        await loadModelAttributes(json.workflow.data_model_id)
        await loadSyncSchedulesForModel(json.workflow.data_model_id)
      }
    } catch (error) {
      console.error('Error loading workflow details:', error)
    }
    
    setShowWorkflowDialog(true)
  }

  async function saveWorkflow() {
    try {
      const method = editingWorkflow ? 'PUT' : 'POST'
      const url = editingWorkflow ? `/api/workflows/${editingWorkflow.id}` : '/api/workflows'
      
      const payload = {
        ...form,
        conditions,
        actions,
        // Include schedule for SCHEDULED workflows or EVENT_BASED workflows with sync integration
        schedule: (form.trigger_type === 'SCHEDULED' || 
                   (form.trigger_type === 'EVENT_BASED' && schedule.schedule_config?.trigger_on_sync)) 
                 ? schedule : null
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        setShowWorkflowDialog(false)
        await loadWorkflows()
      } else {
        const error = await res.json()
        alert('Failed to save workflow: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      alert('Failed to save workflow')
    }
  }

  async function deleteWorkflow(workflow: Workflow) {
    if (!confirm(`Delete workflow "${workflow.name}"?`)) return
    
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, { method: 'DELETE' })
      if (res.ok) await loadWorkflows()
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete workflow')
    }
  }

  async function executeWorkflow(workflow: Workflow) {
    if (!confirm(`Execute workflow "${workflow.name}"?`)) return
    
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/execute`, { method: 'POST' })
      const json = await res.json()
      
      if (res.ok) {
        alert(`Workflow executed successfully. Processed ${json.records_processed} records, updated ${json.records_updated} records.`)
        await loadWorkflows()
      } else {
        alert('Failed to execute workflow: ' + (json.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
      alert('Failed to execute workflow')
    }
  }

  function addCondition() {
    setConditions([...conditions, {
      attribute_id: '',
      operator: 'EQUALS',
      value: '',
      logical_operator: 'AND',
      condition_order: conditions.length
    }])
  }

  function updateCondition(index: number, field: string, value: any) {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setConditions(newConditions)
  }

  function removeCondition(index: number) {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  function addAction() {
    setActions([...actions, {
      target_attribute_id: '',
      action_type: 'UPDATE_VALUE',
      new_value: '',
      action_order: actions.length
    }])
  }

  function updateAction(index: number, field: string, value: any) {
    const newActions = [...actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setActions(newActions)
  }

  function removeAction(index: number) {
    setActions(actions.filter((_, i) => i !== index))
  }

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            {disabled ? (
              <p className="text-muted-foreground">This feature is disabled for the current space.</p>
            ) : (
              <p className="text-muted-foreground">Automate data model attribute updates with conditions and schedules</p>
            )}
          </div>
          {!disabled && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
          )}
        </div>

        {/* Filters */}
        {!disabled && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search workflows..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Triggers</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="EVENT_BASED">Event Based</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        )}

        <WorkflowsTable
          workflows={filtered}
          onDeleteWorkflow={deleteWorkflow}
          onEditWorkflow={openEdit}
          onExecuteWorkflow={executeWorkflow}
        />
        {/* Workflow Dialog */}
        <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkflow ? 'Edit Workflow' : 'New Workflow'}</DialogTitle>
              <DialogDescription>
                {editingWorkflow ? 'Edit workflow configuration' : 'Create a new automated workflow'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="w-full">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="conditions" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Conditions
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Actions
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="integration" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Integration
                </TabsTrigger>
              </TabsList>
              
              <WorkflowBasicTab
                dataModels={dataModels}
                form={form}
                loadModelAttributes={loadModelAttributes}
                loadSyncSchedulesForModel={loadSyncSchedulesForModel}
                setForm={setForm}
              />
              <WorkflowConditionsTab
                conditions={conditions}
                selectedModelAttributes={selectedModelAttributes}
                addCondition={addCondition}
                removeCondition={removeCondition}
                updateCondition={updateCondition}
              />
              <WorkflowActionsTab
                actions={actions}
                selectedModelAttributes={selectedModelAttributes}
                addAction={addAction}
                removeAction={removeAction}
                updateAction={updateAction}
              />
              <WorkflowScheduleTab
                form={form}
                schedule={schedule}
                setSchedule={setSchedule}
              />
              <WorkflowIntegrationTab
                availableSyncSchedules={availableSyncSchedules}
                schedule={schedule}
                setSchedule={setSchedule}
              />            </Tabs>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveWorkflow}>
                {editingWorkflow ? 'Update' : 'Create'} Workflow
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
