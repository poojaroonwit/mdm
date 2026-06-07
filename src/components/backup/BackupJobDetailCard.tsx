import { Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface BackupJobDetailCardProps {
  selectedJob: any
  backupTypes: any[]
  scheduleOptions: any[]
  canEditBackup: boolean
  onUpdateBackupJob: (id: string, updates: any) => void
}

export function BackupJobDetailCard({
  selectedJob,
  backupTypes,
  scheduleOptions,
  canEditBackup,
  onUpdateBackupJob
}: BackupJobDetailCardProps) {
  const update = (updates: any) => onUpdateBackupJob(selectedJob.id, updates)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {selectedJob.name}
          <div className="flex items-center gap-2">
            <StatusBadge status={selectedJob.status} />
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>{selectedJob.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <Tabs defaultValue="config">
            <TabsList>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-name">Job Name</Label>
                  <Input
                    id="job-name"
                    value={selectedJob.name}
                    onChange={(event) => update({ name: event.target.value })}
                    disabled={!canEditBackup}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job-type">Backup Type</Label>
                  <Select value={selectedJob.type} onValueChange={(type) => update({ type })}>
                    <SelectTrigger disabled={!canEditBackup}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backupTypes.map((type) => (
                        <SelectItem key={type.type} value={type.type}>
                          <div className="flex items-center gap-2">
                            <div className={`rounded p-1 text-xs text-white ${type.color}`}>
                              {type.icon}
                            </div>
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
                <Label htmlFor="job-description">Description</Label>
                <Textarea
                  id="job-description"
                  value={selectedJob.description}
                  onChange={(event) => update({ description: event.target.value })}
                  disabled={!canEditBackup}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-schedule">Schedule</Label>
                  <Select value={selectedJob.schedule} onValueChange={(schedule) => update({ schedule })}>
                    <SelectTrigger disabled={!canEditBackup}>
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
                  <Label htmlFor="job-retention">Retention (days)</Label>
                  <Input
                    id="job-retention"
                    type="number"
                    value={selectedJob.retention}
                    onChange={(event) => update({ retention: parseInt(event.target.value) || 30 })}
                    disabled={!canEditBackup}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium">Backup Options</h4>
                <BackupOption
                  id="compression"
                  label="Compression"
                  description="Compress backup files to save space"
                  checked={selectedJob.compression}
                  disabled={!canEditBackup}
                  onCheckedChange={(compression) => update({ compression })}
                />
                <BackupOption
                  id="encryption"
                  label="Encryption"
                  description="Encrypt backup files for security"
                  checked={selectedJob.encryption}
                  disabled={!canEditBackup}
                  onCheckedChange={(encryption) => update({ encryption })}
                />
                <BackupOption
                  id="include-data"
                  label="Include Data"
                  description="Include actual data records in backup"
                  checked={selectedJob.includeData}
                  disabled={!canEditBackup}
                  onCheckedChange={(includeData) => update({ includeData })}
                />
                <BackupOption
                  id="include-schema"
                  label="Include Schema"
                  description="Include database schema in backup"
                  checked={selectedJob.includeSchema}
                  disabled={!canEditBackup}
                  onCheckedChange={(includeSchema) => update({ includeSchema })}
                />
                <BackupOption
                  id="include-users"
                  label="Include Users"
                  description="Include user accounts and permissions"
                  checked={selectedJob.includeUsers}
                  disabled={!canEditBackup}
                  onCheckedChange={(includeUsers) => update({ includeUsers })}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

function BackupOption({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}
