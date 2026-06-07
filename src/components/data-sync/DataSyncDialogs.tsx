'use client'

import type { Dispatch, SetStateAction } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { SyncExecution, SyncSchedule } from './DataSyncManagement'

interface DataSyncDialogsProps {
  showCreateDialog: boolean
  setShowCreateDialog: Dispatch<SetStateAction<boolean>>
  editingSchedule: SyncSchedule | null
  setEditingSchedule: Dispatch<SetStateAction<SyncSchedule | null>>
  formData: any
  setFormData: Dispatch<SetStateAction<any>>
  availableModels: any[]
  availableConnections: any[]
  handleSubmit: () => void
  resetForm: () => void
  selectedSchedule: SyncSchedule | null
  setSelectedSchedule: Dispatch<SetStateAction<SyncSchedule | null>>
  executions: SyncExecution[]
  executionsLoading: boolean
}

export function DataSyncDialogs({
  showCreateDialog,
  setShowCreateDialog,
  editingSchedule,
  setEditingSchedule,
  formData,
  setFormData,
  availableModels,
  availableConnections,
  handleSubmit,
  resetForm,
  selectedSchedule,
  setSelectedSchedule,
  executions,
  executionsLoading
}: DataSyncDialogsProps) {
  return (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule ? 'Edit Sync Schedule' : 'Create Sync Schedule'}
            </DialogTitle>
            <DialogDescription>
              Configure automatic synchronization from external data sources
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Daily API Sync"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Sync customer data from external API"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Model *</Label>
                <Select
                  value={formData.data_model_id}
                  onValueChange={(v) => setFormData({ ...formData, data_model_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name || model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>External Connection *</Label>
                <Select
                  value={formData.external_connection_id}
                  onValueChange={(v) => setFormData({ ...formData, external_connection_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConnections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.name} ({conn.connection_type === 'api' ? 'API' : conn.db_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Schedule Type</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(v) => setFormData({ ...formData, schedule_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual Only</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sync Strategy</Label>
                <Select
                  value={formData.sync_strategy}
                  onValueChange={(v) => setFormData({ ...formData, sync_strategy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_REFRESH">Full Refresh</SelectItem>
                    <SelectItem value="INCREMENTAL">Incremental</SelectItem>
                    <SelectItem value="APPEND">Append</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.sync_strategy === 'INCREMENTAL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Incremental Key Column</Label>
                  <Input
                    value={formData.incremental_key}
                    onChange={(e) => setFormData({ ...formData, incremental_key: e.target.value })}
                    placeholder="id"
                  />
                </div>
                <div>
                  <Label>Timestamp Column</Label>
                  <Input
                    value={formData.incremental_timestamp_column}
                    onChange={(e) => setFormData({ ...formData, incremental_timestamp_column: e.target.value })}
                    placeholder="updated_at"
                  />
                </div>
              </div>
            )}

            {formData.sync_strategy === 'FULL_REFRESH' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="clear-existing"
                  checked={formData.clear_existing_data}
                  onChange={(e) => setFormData({ ...formData, clear_existing_data: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="clear-existing" className="font-normal">
                  Clear existing data before sync
                </Label>
              </div>
            )}

            <div>
              <Label>Max Records Per Sync (optional)</Label>
              <Input
                type="number"
                value={formData.max_records_per_sync}
                onChange={(e) => setFormData({ ...formData, max_records_per_sync: e.target.value })}
                placeholder="Leave empty for no limit"
              />
            </div>

            <div>
              <Label>Source Query (optional)</Label>
              <Textarea
                value={formData.source_query}
                onChange={(e) => setFormData({ ...formData, source_query: e.target.value })}
                placeholder="Custom SQL query for database sources"
                rows={3}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to use default table query
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingSchedule(null); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedSchedule && (
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Execution History: {selectedSchedule.name}</DialogTitle>
              <DialogDescription>
                View past sync executions and their results
              </DialogDescription>
            </DialogHeader>

            {executionsLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No executions yet
              </div>
            ) : (
              <div className="space-y-3">
                {executions.map((exec) => (
                  <Card key={exec.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {exec.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : exec.status === 'FAILED' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          )}
                          <span className="font-medium">{exec.status}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(exec.started_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {exec.duration_ms}ms
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Fetched</div>
                          <div className="font-medium">{exec.records_fetched}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Inserted</div>
                          <div className="font-medium text-green-600">{exec.records_inserted}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Updated</div>
                          <div className="font-medium text-blue-600">{exec.records_updated}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Deleted</div>
                          <div className="font-medium text-orange-600">{exec.records_deleted}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Failed</div>
                          <div className="font-medium text-red-600">{exec.records_failed}</div>
                        </div>
                      </div>

                      {exec.error_message && (
                        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                          {exec.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
