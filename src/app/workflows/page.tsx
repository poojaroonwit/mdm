'use client'

import { useState, useMemo, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { WorkflowsList } from '@/features/workflows'
import { Button } from '@/components/ui/button'
import { useSpace } from '@/contexts/space-context'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  Zap, 
  Database,
  Filter,
  Target,
  Calendar,
  Activity
} from 'lucide-react'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'PAUSED': return 'outline'
      case 'ERROR': return 'destructive'
      default: return 'secondary'
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />
      case 'EVENT_BASED': return <Zap className="h-4 w-4" />
      case 'MANUAL': return <Play className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
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

        {/* Workflows Table */}
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>Manage your automated workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Data Model</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{workflow.name}</div>
                        {workflow.description && (
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{workflow.data_model_display_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTriggerIcon(workflow.trigger_type)}
                        <span className="capitalize">{workflow.trigger_type.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Total: {workflow.execution_count}</div>
                        <div className="text-green-600">Success: {workflow.successful_executions}</div>
                        <div className="text-red-600">Failed: {workflow.failed_executions}</div>
                      </div>
                    </TableCell>
                    <TableCell>{workflow.created_by_name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => executeWorkflow(workflow)}
                        disabled={workflow.status !== 'ACTIVE'}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Execute
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(workflow)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteWorkflow(workflow)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No workflows found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_model">Data Model</Label>
                    <Select 
                      value={form.data_model_id} 
                      onValueChange={(value) => {
                        setForm({ ...form, data_model_id: value })
                        loadModelAttributes(value)
                        loadSyncSchedulesForModel(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select data model" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter workflow description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select 
                      value={form.trigger_type} 
                      onValueChange={(value: any) => setForm({ ...form, trigger_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="EVENT_BASED">Event Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={form.status} 
                      onValueChange={(value: any) => setForm({ ...form, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="conditions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Workflow Conditions</h3>
                  <Button size="sm" onClick={addCondition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Condition
                  </Button>
                </div>
                
                {conditions.length > 0 ? (
                  <div className="space-y-4">
                    {conditions.map((condition, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-5 gap-4 items-end">
                          <div>
                            <Label>Attribute</Label>
                            <Select 
                              value={condition.attribute_id} 
                              onValueChange={(value) => updateCondition(index, 'attribute_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select attribute" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedModelAttributes.map((attr) => (
                                  <SelectItem key={attr.id} value={attr.id}>
                                    {attr.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Operator</Label>
                            <Select 
                              value={condition.operator} 
                              onValueChange={(value) => updateCondition(index, 'operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EQUALS">Equals</SelectItem>
                                <SelectItem value="NOT_EQUALS">Not Equals</SelectItem>
                                <SelectItem value="CONTAINS">Contains</SelectItem>
                                <SelectItem value="NOT_CONTAINS">Not Contains</SelectItem>
                                <SelectItem value="GREATER_THAN">Greater Than</SelectItem>
                                <SelectItem value="LESS_THAN">Less Than</SelectItem>
                                <SelectItem value="IS_EMPTY">Is Empty</SelectItem>
                                <SelectItem value="IS_NOT_EMPTY">Is Not Empty</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Value</Label>
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(index, 'value', e.target.value)}
                              placeholder="Enter value"
                            />
                          </div>
                          <div>
                            <Label>Logic</Label>
                            <Select 
                              value={condition.logical_operator} 
                              onValueChange={(value) => updateCondition(index, 'logical_operator', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeCondition(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No conditions defined. Add conditions to specify when this workflow should run.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Workflow Actions</h3>
                  <Button size="sm" onClick={addAction}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
                
                {actions.length > 0 ? (
                  <div className="space-y-4">
                    {actions.map((action, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-4 gap-4 items-end">
                          <div>
                            <Label>Target Attribute</Label>
                            <Select 
                              value={action.target_attribute_id} 
                              onValueChange={(value) => updateAction(index, 'target_attribute_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select attribute" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedModelAttributes.map((attr) => (
                                  <SelectItem key={attr.id} value={attr.id}>
                                    {attr.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Action Type</Label>
                            <Select 
                              value={action.action_type} 
                              onValueChange={(value) => updateAction(index, 'action_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UPDATE_VALUE">Update Value</SelectItem>
                                <SelectItem value="SET_DEFAULT">Set Default</SelectItem>
                                <SelectItem value="CALCULATE">Calculate</SelectItem>
                                <SelectItem value="COPY_FROM">Copy From</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>New Value</Label>
                            <Input
                              value={action.new_value || ''}
                              onChange={(e) => updateAction(index, 'new_value', e.target.value)}
                              placeholder="Enter new value"
                            />
                          </div>
                          <div>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => removeAction(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No actions defined. Add actions to specify what this workflow should do.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                {form.trigger_type === 'SCHEDULED' ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Schedule Configuration</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Schedule Type</Label>
                        <Select 
                          value={schedule.schedule_type} 
                          onValueChange={(value) => setSchedule({ ...schedule, schedule_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONCE">Once</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="CUSTOM_CRON">Custom Cron</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Input
                          value={schedule.timezone}
                          onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                          placeholder="UTC"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="datetime-local"
                          value={schedule.start_date}
                          onChange={(e) => setSchedule({ ...schedule, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={schedule.end_date}
                          onChange={(e) => setSchedule({ ...schedule, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Schedule configuration is only available for scheduled workflows.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="integration" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Sync Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure this workflow to automatically trigger after data syncs complete
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="trigger-on-sync"
                        checked={schedule.schedule_config?.trigger_on_sync || false}
                        onChange={(e) => setSchedule({
                          ...schedule,
                          schedule_config: {
                            ...schedule.schedule_config,
                            trigger_on_sync: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="trigger-on-sync" className="font-normal cursor-pointer">
                        Trigger this workflow after data syncs complete
                      </Label>
                    </div>

                    {schedule.schedule_config?.trigger_on_sync && (
                      <div className="space-y-3 pl-6 border-l-2">
                        <div className="space-y-2">
                          <Label>Trigger Conditions</Label>
                          <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={schedule.schedule_config?.trigger_on_sync_success !== false}
                                onChange={(e) => setSchedule({
                                  ...schedule,
                                  schedule_config: {
                                    ...schedule.schedule_config,
                                    trigger_on_sync_success: e.target.checked
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm">Trigger on successful sync</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={schedule.schedule_config?.trigger_on_sync_failure || false}
                                onChange={(e) => setSchedule({
                                  ...schedule,
                                  schedule_config: {
                                    ...schedule.schedule_config,
                                    trigger_on_sync_failure: e.target.checked
                                  }
                                })}
                                className="rounded"
                              />
                              <span className="text-sm">Trigger on failed sync</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <Label>Specific Sync Schedule (Optional)</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            Leave empty to trigger after any sync for this data model, or select a specific sync schedule
                          </p>
                          <Select
                            value={schedule.schedule_config?.trigger_on_sync_schedule_id || ''}
                            onValueChange={(value) => setSchedule({
                              ...schedule,
                              schedule_config: {
                                ...schedule.schedule_config,
                                trigger_on_sync_schedule_id: value || null
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All sync schedules (auto-detect)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All sync schedules (auto-detect)</SelectItem>
                              {availableSyncSchedules.map((sync) => (
                                <SelectItem key={sync.id} value={sync.id}>
                                  {sync.name} ({sync.schedule_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
