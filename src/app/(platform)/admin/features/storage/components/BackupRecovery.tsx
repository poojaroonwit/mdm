'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  RefreshCw, 
  Settings, 
  Calendar,
  Play,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Backup, BackupSchedule, RestorePoint } from '../types'
import { BackupManagementTab, type BackupDraft } from './BackupManagementTab'

export function BackupRecovery() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedules, setSchedules] = useState<BackupSchedule[]>([])
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateBackup, setShowCreateBackup] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [isRestoring, setIsRestoring] = useState(false)

  const [newBackup, setNewBackup] = useState<BackupDraft>({
    name: '',
    type: 'full' as const,
    description: '',
    includeAttachments: true,
    includeDatabase: true,
    includeSettings: true,
    retentionDays: 30
  })

  const [newSchedule, setNewSchedule] = useState({
    name: '',
    frequency: 'daily' as const,
    time: '02:00',
    type: 'incremental' as const,
    retentionDays: 30,
    includeAttachments: true,
    includeDatabase: true,
    includeSettings: true
  })

  useEffect(() => {
    loadBackups()
    loadSchedules()
    loadRestorePoints()
  }, [])

  const loadBackups = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups.map((backup: any) => ({
          ...backup,
          createdAt: new Date(backup.createdAt),
          completedAt: backup.completedAt ? new Date(backup.completedAt) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/admin/backup-schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules.map((schedule: any) => ({
          ...schedule,
          lastRun: schedule.lastRun ? new Date(schedule.lastRun) : undefined,
          nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined
        })))
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  const loadRestorePoints = async () => {
    try {
      const response = await fetch('/api/admin/restore-points')
      if (response.ok) {
        const data = await response.json()
        setRestorePoints(data.restorePoints.map((point: any) => ({
          ...point,
          timestamp: new Date(point.timestamp)
        })))
      }
    } catch (error) {
      console.error('Error loading restore points:', error)
    }
  }

  const createBackup = async () => {
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBackup)
      })

      if (response.ok) {
        toast.success('Backup created successfully')
        setShowCreateBackup(false)
        setNewBackup({
          name: '',
          type: 'full',
          description: '',
          includeAttachments: true,
          includeDatabase: true,
          includeSettings: true,
          retentionDays: 30
        })
        loadBackups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Failed to create backup')
    }
  }

  const createSchedule = async () => {
    try {
      const response = await fetch('/api/admin/backup-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })

      if (response.ok) {
        toast.success('Schedule created successfully')
        setShowCreateSchedule(false)
        setNewSchedule({
          name: '',
          frequency: 'daily',
          time: '02:00',
          type: 'incremental',
          retentionDays: 30,
          includeAttachments: true,
          includeDatabase: true,
          includeSettings: true
        })
        loadSchedules()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('Failed to create schedule')
    }
  }

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${backup.name}.backup`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Backup download started')
      } else {
        toast.error('Failed to download backup')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Failed to download backup')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return

    try {
      const response = await fetch(`/api/admin/backups/${backupId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Backup deleted successfully')
        loadBackups()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete backup')
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Failed to delete backup')
    }
  }

  const restoreFromBackup = async (backup: Backup) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) return

    setIsRestoring(true)
    setRestoreProgress(0)
    
    try {
      const response = await fetch(`/api/admin/backups/${backup.id}/restore`, {
        method: 'POST'
      })

      if (response.ok) {
        // Simulate progress
        const interval = setInterval(() => {
          setRestoreProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsRestoring(false)
              toast.success('Restore completed successfully')
              return 100
            }
            return prev + 10
          })
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to restore backup')
        setIsRestoring(false)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Failed to restore backup')
      setIsRestoring(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Backup & Recovery
          </h2>
          <p className="text-muted-foreground">
            Data protection, automated backups, and disaster recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBackups} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="backups">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-6">
          <BackupManagementTab
            backups={backups}
            isLoading={isLoading}
            showCreateBackup={showCreateBackup}
            setShowCreateBackup={setShowCreateBackup}
            newBackup={newBackup}
            setNewBackup={setNewBackup}
            createBackup={createBackup}
            downloadBackup={downloadBackup}
            restoreFromBackup={restoreFromBackup}
            deleteBackup={deleteBackup}
            formatBytes={formatBytes}
          />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup Schedules</h3>
            <CrudDialog
              open={showCreateSchedule}
              onOpenChange={setShowCreateSchedule}
              title="Create Backup Schedule"
              description="Set up automated backup schedules"
              trigger={(
                <Button className="rounded-xl font-bold">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Schedule
                </Button>
              )}
              footer={(
                <>
                  <Button className="rounded-xl font-bold" variant="outline" onClick={() => setShowCreateSchedule(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl font-bold" onClick={createSchedule} disabled={!newSchedule.name}>
                    Create Schedule
                  </Button>
                </>
              )}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schedule-name">Schedule Name</Label>
                  <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                    id="schedule-name"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                    placeholder="Enter schedule name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newSchedule.frequency} onValueChange={(value: any) => setNewSchedule({ ...newSchedule, frequency: value })}>
                      <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800"
                      id="time"
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="schedule-type">Backup Type</Label>
                  <Select value={newSchedule.type} onValueChange={(value: any) => setNewSchedule({ ...newSchedule, type: value })}>
                    <SelectTrigger className="rounded-xl h-10 border-zinc-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="full">Full Backup</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CrudDialog>
          </div>

          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{schedule.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {schedule.frequency} at {schedule.time} • {schedule.type} backup
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={schedule.isActive} />
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-6">
          <h3 className="text-lg font-semibold">Restore Points</h3>
          <div className="space-y-4">
            {restorePoints.map(point => (
              <Card key={point.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{point.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {point.timestamp.toLocaleString()} • {formatBytes(point.size)}
                      </p>
                    </div>
                    <Button onClick={() => restoreFromBackup(point as any)}>
                      <Play className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-lg font-semibold">Backup Settings</h3>
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
              <CardDescription>
                Configure backup storage locations and encryption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Storage Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">AWS S3</SelectItem>
                    <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="encryption" />
                <Label htmlFor="encryption">Enable backup encryption</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="compression" />
                <Label htmlFor="compression">Enable backup compression</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Restore Progress */}
      {isRestoring && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Restoring backup...</span>
                <span className="text-sm text-muted-foreground">{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
