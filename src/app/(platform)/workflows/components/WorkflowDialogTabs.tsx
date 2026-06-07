'use client'

import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'
import { Plus, Trash2 } from 'lucide-react'

type WorkflowForm = {
  name: string
  description: string
  data_model_id: string
  trigger_type: 'SCHEDULED' | 'EVENT_BASED' | 'MANUAL'
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR'
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

type WorkflowSchedule = {
  schedule_type: string
  schedule_config: any
  start_date: string
  end_date: string
  timezone: string
}

interface WorkflowBasicTabProps {
  dataModels: DataModel[]
  form: WorkflowForm
  loadModelAttributes: (modelId: string) => void
  loadSyncSchedulesForModel: (dataModelId: string) => void
  setForm: Dispatch<SetStateAction<WorkflowForm>>
}

interface WorkflowConditionsTabProps {
  conditions: WorkflowCondition[]
  selectedModelAttributes: Attribute[]
  addCondition: () => void
  removeCondition: (index: number) => void
  updateCondition: (index: number, field: string, value: any) => void
}

interface WorkflowActionsTabProps {
  actions: WorkflowAction[]
  selectedModelAttributes: Attribute[]
  addAction: () => void
  removeAction: (index: number) => void
  updateAction: (index: number, field: string, value: any) => void
}

interface WorkflowScheduleTabProps {
  form: WorkflowForm
  schedule: WorkflowSchedule
  setSchedule: Dispatch<SetStateAction<WorkflowSchedule>>
}

interface WorkflowIntegrationTabProps {
  availableSyncSchedules: any[]
  schedule: WorkflowSchedule
  setSchedule: Dispatch<SetStateAction<WorkflowSchedule>>
}

export function WorkflowBasicTab({
  dataModels,
  form,
  loadModelAttributes,
  loadSyncSchedulesForModel,
  setForm
}: WorkflowBasicTabProps) {
  return (
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
          <Select value={form.trigger_type} onValueChange={(value: any) => setForm({ ...form, trigger_type: value })}>
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
          <Select value={form.status} onValueChange={(value: any) => setForm({ ...form, status: value })}>
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
  )
}

export function WorkflowConditionsTab({
  conditions,
  selectedModelAttributes,
  addCondition,
  removeCondition,
  updateCondition
}: WorkflowConditionsTabProps) {
  return (
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
                  <Select value={condition.attribute_id} onValueChange={(value) => updateCondition(index, 'attribute_id', value)}>
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
                  <Select value={condition.operator} onValueChange={(value) => updateCondition(index, 'operator', value)}>
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
                  <Select value={condition.logical_operator} onValueChange={(value) => updateCondition(index, 'logical_operator', value)}>
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
                  <Button size="sm" variant="destructive" onClick={() => removeCondition(index)}>
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
  )
}

export function WorkflowActionsTab({
  actions,
  selectedModelAttributes,
  addAction,
  removeAction,
  updateAction
}: WorkflowActionsTabProps) {
  return (
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
                  <Select value={action.target_attribute_id} onValueChange={(value) => updateAction(index, 'target_attribute_id', value)}>
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
                  <Select value={action.action_type} onValueChange={(value) => updateAction(index, 'action_type', value)}>
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
                  <Button size="sm" variant="destructive" onClick={() => removeAction(index)}>
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
  )
}

export function WorkflowScheduleTab({ form, schedule, setSchedule }: WorkflowScheduleTabProps) {
  return (
    <TabsContent value="schedule" className="space-y-4">
      {form.trigger_type === 'SCHEDULED' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Schedule Configuration</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schedule Type</Label>
              <Select value={schedule.schedule_type} onValueChange={(value) => setSchedule({ ...schedule, schedule_type: value })}>
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
  )
}

export function WorkflowIntegrationTab({
  availableSyncSchedules,
  schedule,
  setSchedule
}: WorkflowIntegrationTabProps) {
  return (
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
  )
}
