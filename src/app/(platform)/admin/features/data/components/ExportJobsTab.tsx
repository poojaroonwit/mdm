import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import type { DataSchema, ExportJob } from '../types'

export interface ExportDraft {
  name: string
  type: 'full' | 'incremental' | 'custom'
  format: 'json' | 'csv' | 'xml' | 'sql'
  includes: string[]
  filters: Record<string, any>
}

interface ExportJobsTabProps {
  exportJobs: ExportJob[]
  newExport: ExportDraft
  schemas: DataSchema[]
  showCreateExport: boolean
  createExportJob: () => void
  deleteExportJob: (jobId: string) => void
  downloadExport: (job: ExportJob) => void
  getStatusIcon: (status: string) => ReactNode
  setNewExport: Dispatch<SetStateAction<ExportDraft>>
  setShowCreateExport: (open: boolean) => void
}

export function ExportJobsTab({
  exportJobs,
  newExport,
  schemas,
  showCreateExport,
  createExportJob,
  deleteExportJob,
  downloadExport,
  getStatusIcon,
  setNewExport,
  setShowCreateExport,
}: ExportJobsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Export Jobs</h3>
        <CrudDialog
          open={showCreateExport}
          onOpenChange={setShowCreateExport}
          title="Create Export Job"
          description="Create a new data export with custom filters and format options"
          contentClassName="max-w-2xl"
          trigger={(
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          )}
          bodyClassName="space-y-4"
          footer={(
            <>
              <Button variant="outline" onClick={() => setShowCreateExport(false)}>
                Cancel
              </Button>
              <Button onClick={createExportJob} disabled={!newExport.name}>
                Create Export
              </Button>
            </>
          )}
        >
          <div>
            <Label htmlFor="export-name">Export Name</Label>
            <Input
              id="export-name"
              value={newExport.name}
              onChange={(e) => setNewExport({ ...newExport, name: e.target.value })}
              placeholder="Enter export name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="export-type">Export Type</Label>
              <Select value={newExport.type} onValueChange={(value: any) => setNewExport({ ...newExport, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Export</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="export-format">Format</Label>
              <Select value={newExport.format} onValueChange={(value: any) => setNewExport({ ...newExport, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Include Tables</Label>
            <div className="space-y-2 mt-2">
              {schemas.map(schema => (
                <div key={schema.table} className="flex items-center space-x-2">
                  <Switch
                    id={schema.table}
                    checked={newExport.includes.includes(schema.table)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewExport({
                          ...newExport,
                          includes: [...newExport.includes, schema.table]
                        })
                      } else {
                        setNewExport({
                          ...newExport,
                          includes: newExport.includes.filter(t => t !== schema.table)
                        })
                      }
                    }}
                  />
                  <Label htmlFor={schema.table}>
                    {schema.table} ({schema.rowCount.toLocaleString()} rows)
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CrudDialog>
      </div>

      <div className="space-y-4">
        {exportJobs.map(job => (
          <Card key={job.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="font-medium">{job.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.type} - {job.format.toUpperCase()} - {job.includes.length} tables
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={job.status} />
                  {job.status === 'running' && (
                    <div className="w-24">
                      <Progress value={job.progress} />
                    </div>
                  )}
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadExport(job)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteExportJob(job.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
