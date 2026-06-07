import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface CreateBackupJobDialogProps {
  newJob: any
  backupTypes: any[]
  scheduleOptions: any[]
  setNewJob: (job: any) => void
  onCreateBackupJob: () => void
  onClose: () => void
}

export function CreateBackupJobDialog({
  newJob,
  backupTypes,
  scheduleOptions,
  setNewJob,
  onCreateBackupJob,
  onClose
}: CreateBackupJobDialogProps) {
  const update = (updates: any) => setNewJob({ ...newJob, ...updates })

  return (
    <Card className="fixed inset-0 z-50 m-4 max-w-2xl">
      <CardHeader>
        <CardTitle>Create Backup Job</CardTitle>
        <CardDescription>Set up a new automated backup job</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-job-name">Job Name</Label>
            <Input
              id="new-job-name"
              value={newJob.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Enter job name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-job-type">Backup Type</Label>
            <Select value={newJob.type} onValueChange={(type) => update({ type })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backupTypes.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    <div className="flex items-center gap-2">
                      <div className={`rounded p-1 text-xs text-white ${type.color}`}>{type.icon}</div>
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-job-description">Description</Label>
          <Textarea
            id="new-job-description"
            value={newJob.description}
            onChange={(event) => update({ description: event.target.value })}
            placeholder="Enter job description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-job-schedule">Schedule</Label>
            <Select value={newJob.schedule} onValueChange={(schedule) => update({ schedule })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scheduleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-job-retention">Retention (days)</Label>
            <Input
              id="new-job-retention"
              type="number"
              value={newJob.retention}
              onChange={(event) => update({ retention: parseInt(event.target.value) || 30 })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onCreateBackupJob} disabled={!newJob.name.trim()}>
            Create Backup Job
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
